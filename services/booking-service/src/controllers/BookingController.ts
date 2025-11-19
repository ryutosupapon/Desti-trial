import { Request, Response } from 'express'
import { BookingService } from '../services/BookingService'
import { PaymentService } from '../services/PaymentService'
import { AuthenticatedRequest, ApiResponse } from '../types'
import { body, validationResult } from 'express-validator'

export class BookingController {
  private bookingService: BookingService
  private paymentService: PaymentService

  constructor() {
    this.bookingService = new BookingService()
    this.paymentService = new PaymentService()
  }

  static hotelBookingValidation = [
    body('hotelId').isString().notEmpty(),
    body('roomId').isString().notEmpty(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('guestDetails.adults').isInt({ min: 1 }),
    body('guestDetails.children').isInt({ min: 0 }),
    body('contactEmail').isEmail(),
    body('contactPhone').isString().notEmpty(),
    body('paymentMethodId').isString().notEmpty(),
  ]

  async createHotelBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() } as ApiResponse)
        return
      }

      const userId = req.user!.id
      const bookingData = {
        ...req.body,
        userId,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      }

      const booking = await this.bookingService.createHotelBooking(bookingData, req.body.paymentMethodId)
      res.status(201).json({ success: true, data: booking, message: 'Hotel booking created successfully' } as ApiResponse)
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message } as ApiResponse)
    }
  }

  async createFlightBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id
      const bookingData = {
        ...req.body,
        userId,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      }

      const booking = await this.bookingService.createFlightBooking(bookingData, req.body.paymentMethodId)
      res.status(201).json({ success: true, data: booking, message: 'Flight booking created successfully' } as ApiResponse)
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message } as ApiResponse)
    }
  }

  async getBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params as any
      const userId = req.user!.id
      const booking = await this.bookingService.getBookingById(bookingId, userId)
      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking not found' } as ApiResponse)
        return
      }
      res.json({ success: true, data: booking } as ApiResponse)
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve booking' } as ApiResponse)
    }
  }

  async getUserBookings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id
      const limit = parseInt((req.query.limit as string) || '20', 10)
      const offset = parseInt((req.query.offset as string) || '0', 10)
      const result = await this.bookingService.getUserBookings(userId, limit, offset)
      res.json({ success: true, data: result.bookings, meta: { total: result.total, limit, offset } } as ApiResponse)
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve bookings' } as ApiResponse)
    }
  }

  async cancelBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params as any
      const { reason } = req.body
      const userId = req.user!.id
      const booking = await this.bookingService.cancelBooking(bookingId, userId, reason)
      res.json({ success: true, data: booking, message: 'Booking cancelled successfully' } as ApiResponse)
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message } as ApiResponse)
    }
  }

  async modifyBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params as any
      const userId = req.user!.id
      const modifications = {
        ...req.body,
        newStartDate: req.body.newStartDate ? new Date(req.body.newStartDate) : undefined,
        newEndDate: req.body.newEndDate ? new Date(req.body.newEndDate) : undefined,
      }
      const booking = await this.bookingService.modifyBooking(bookingId, userId, modifications)
      res.json({ success: true, data: booking, message: 'Booking modified successfully' } as ApiResponse)
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message } as ApiResponse)
    }
  }

  async createPaymentIntent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { amount, currency, customerId, description } = req.body
      const result = await this.paymentService.createPaymentIntent({ amount, currency, customerId, description })
      res.json({ success: true, data: result } as ApiResponse)
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message } as ApiResponse)
    }
  }

  async getPaymentMethods(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { customerId } = req.params as any
      const paymentMethods = await this.paymentService.getPaymentMethods(customerId)
      res.json({ success: true, data: paymentMethods } as ApiResponse)
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve payment methods' } as ApiResponse)
    }
  }

  async handleBookingWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { provider } = req.params as any
      await this.bookingService.processWebhook(provider, req.body)
      res.status(200).json({ received: true })
    } catch (error) {
      console.error('Webhook processing failed:', error)
      res.status(400).json({ error: 'Webhook processing failed' })
    }
  }

  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string
      const body = req.body as Buffer
      await this.paymentService.handleStripeWebhook(signature, body)
      res.status(200).json({ received: true })
    } catch (error: any) {
      console.error('Stripe webhook failed:', error)
      res.status(400).json({ error: error.message })
    }
  }
}
