import { Repository } from 'typeorm'
import { Booking, BookingStatus, BookingType } from '../entities/Booking'
import { BookingItem } from '../entities/BookingItem'
import { Payment, PaymentStatus } from '../entities/Payment'
import { AppDataSource } from '../database'
import { BookingComService } from './BookingComService'
import { SkyscannerService } from './SkyscannerService'
import { PaymentService } from './PaymentService'
import { EmailService } from './EmailService'
import { v4 as uuidv4 } from 'uuid'

export interface CreateBookingDto {
  userId: string
  tripId?: string
  type: BookingType
  startDate: Date
  endDate?: Date
  guestDetails: {
    adults: number
    children: number
    infants: number
    guests: Array<{ firstName: string; lastName: string; dateOfBirth?: Date }>
  }
  contactEmail: string
  contactPhone: string
  specialRequests?: string
}

export interface HotelBookingDto extends CreateBookingDto {
  hotelId: string
  roomId: string
  roomCount: number
}

export interface FlightBookingDto extends CreateBookingDto {
  originAirport: string
  destinationAirport: string
  outboundFlightId: string
  returnFlightId?: string
  seatPreferences?: Array<{ guestId: string; seatType: string; specialRequests: string }>
}

export class BookingService {
  private bookingRepo: Repository<Booking>
  private bookingItemRepo: Repository<BookingItem>
  private paymentRepo: Repository<Payment>
  private bookingComService: BookingComService
  private skyscannerService: SkyscannerService
  private paymentService: PaymentService
  private emailService: EmailService

  constructor() {
    this.bookingRepo = AppDataSource.getRepository(Booking)
    this.bookingItemRepo = AppDataSource.getRepository(BookingItem)
    this.paymentRepo = AppDataSource.getRepository(Payment)
    this.bookingComService = new BookingComService()
    this.skyscannerService = new SkyscannerService()
    this.paymentService = new PaymentService()
    this.emailService = new EmailService()
  }

  async createHotelBooking(bookingData: HotelBookingDto, paymentMethodId: string): Promise<Booking> {
    try {
      const availability = await this.bookingComService.checkAvailability(bookingData.hotelId, bookingData.roomId, {
        destination: '',
        checkIn: bookingData.startDate.toISOString().split('T')[0],
        checkOut: bookingData.endDate!.toISOString().split('T')[0],
        adults: bookingData.guestDetails.adults,
        children: bookingData.guestDetails.children,
        rooms: bookingData.roomCount,
      })

      if (!availability.available) {
        throw new Error('Hotel room not available for selected dates')
      }

      const totalAmount = (availability.price || 0) * bookingData.roomCount

      const booking = await this.createBookingRecord({
        ...bookingData,
        type: BookingType.ACCOMMODATION,
        totalAmount,
        currency: availability.currency || 'USD',
        providerName: 'booking.com',
      })

      await this.bookingItemRepo.save({
        bookingId: booking.id,
        itemType: 'room',
        itemName: `Hotel Room`,
        roomCount: bookingData.roomCount,
        unitPrice: availability.price || 0,
        quantity: bookingData.roomCount,
        totalPrice: totalAmount,
        currency: availability.currency || 'USD',
      })

      const payment = await this.paymentService.processPayment({
        bookingId: booking.id,
        amount: totalAmount,
        currency: availability.currency || 'USD',
        paymentMethodId,
        description: `Hotel booking - ${booking.bookingReference}`,
      })

      if (payment.status === PaymentStatus.COMPLETED) {
        const reservation = await this.bookingComService.makeReservation({
          hotelId: bookingData.hotelId,
          roomId: bookingData.roomId,
          checkIn: bookingData.startDate.toISOString().split('T')[0],
          checkOut: bookingData.endDate!.toISOString().split('T')[0],
          guests: bookingData.guestDetails.guests.map((g) => ({ firstName: g.firstName, lastName: g.lastName })),
          contactEmail: bookingData.contactEmail,
          contactPhone: bookingData.contactPhone,
          specialRequests: bookingData.specialRequests,
        })

        booking.status = BookingStatus.CONFIRMED
        booking.externalReference = reservation.confirmationCode
        booking.providerBookingId = reservation.bookingId
        await this.bookingRepo.save(booking)

        await this.emailService.sendBookingConfirmation(booking)
        return booking
      } else {
        booking.status = BookingStatus.FAILED
        await this.bookingRepo.save(booking)
        throw new Error('Payment processing failed')
      }
    } catch (error) {
      console.error('Hotel booking failed:', error)
      throw error
    }
  }

  async createFlightBooking(bookingData: FlightBookingDto, paymentMethodId: string): Promise<Booking> {
    try {
      const outboundFlight = await this.skyscannerService.getFlightDetails(bookingData.outboundFlightId)
      const returnFlight = bookingData.returnFlightId ? await this.skyscannerService.getFlightDetails(bookingData.returnFlightId) : null

      const totalAmount = (outboundFlight.price || 0) + (returnFlight?.price || 0)

      const booking = await this.createBookingRecord({
        ...bookingData,
        type: BookingType.FLIGHT,
        totalAmount,
        currency: outboundFlight.currency || 'USD',
        providerName: 'skyscanner',
      })

      await this.createFlightBookingItems(booking.id, outboundFlight, returnFlight || undefined)

      const payment = await this.paymentService.processPayment({
        bookingId: booking.id,
        amount: totalAmount,
        currency: outboundFlight.currency || 'USD',
        paymentMethodId,
        description: `Flight booking - ${booking.bookingReference}`,
      })

      if (payment.status === PaymentStatus.COMPLETED) {
        booking.status = BookingStatus.CONFIRMED
        await this.bookingRepo.save(booking)
        await this.emailService.sendBookingConfirmation(booking)
        return booking
      } else {
        booking.status = BookingStatus.FAILED
        await this.bookingRepo.save(booking)
        throw new Error('Payment processing failed')
      }
    } catch (error) {
      console.error('Flight booking failed:', error)
      throw error
    }
  }

  private async createBookingRecord(data: any): Promise<Booking> {
    const booking = this.bookingRepo.create({
      userId: data.userId,
      tripId: data.tripId,
      type: data.type,
      status: BookingStatus.PENDING,
      bookingReference: this.generateBookingReference(),
      providerName: data.providerName,
      bookingDate: new Date(),
      startDate: data.startDate,
      endDate: data.endDate,
      guestCount: data.guestDetails.adults + data.guestDetails.children + data.guestDetails.infants,
      guestDetails: data.guestDetails,
      totalAmount: data.totalAmount,
      currency: data.currency,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      specialRequests: data.specialRequests,
      statusHistory: [
        { status: BookingStatus.PENDING, timestamp: new Date(), updatedBy: 'system' },
      ],
    })
    return await this.bookingRepo.save(booking)
  }

  private async createFlightBookingItems(bookingId: string, outboundFlight: any, returnFlight?: any): Promise<void> {
    const items: Partial<BookingItem>[] = []

    items.push({
      bookingId,
      itemType: 'flight',
      itemName: 'Outbound Flight',
      flightNumber: outboundFlight.legs?.[0]?.segments?.[0]?.flightNumber,
      airline: outboundFlight.legs?.[0]?.carriers?.[0]?.name,
      departureAirport: outboundFlight.legs?.[0]?.origin?.displayCode,
      arrivalAirport: outboundFlight.legs?.[0]?.destination?.displayCode,
      departureTime: outboundFlight.legs?.[0]?.departure ? new Date(outboundFlight.legs[0].departure) : null,
      arrivalTime: outboundFlight.legs?.[0]?.arrival ? new Date(outboundFlight.legs[0].arrival) : null,
      seatClass: 'economy',
      unitPrice: outboundFlight.price || 0,
      quantity: 1,
      totalPrice: outboundFlight.price || 0,
      currency: outboundFlight.currency || 'USD',
    })

    if (returnFlight) {
      items.push({
        bookingId,
        itemType: 'flight',
        itemName: 'Return Flight',
        flightNumber: returnFlight.legs?.[0]?.segments?.[0]?.flightNumber,
        airline: returnFlight.legs?.[0]?.carriers?.[0]?.name,
        departureAirport: returnFlight.legs?.[0]?.origin?.displayCode,
        arrivalAirport: returnFlight.legs?.[0]?.destination?.displayCode,
        departureTime: returnFlight.legs?.[0]?.departure ? new Date(returnFlight.legs[0].departure) : null,
        arrivalTime: returnFlight.legs?.[0]?.arrival ? new Date(returnFlight.legs[0].arrival) : null,
        seatClass: 'economy',
        unitPrice: returnFlight.price || 0,
        quantity: 1,
        totalPrice: returnFlight.price || 0,
        currency: returnFlight.currency || 'USD',
      })
    }

    await this.bookingItemRepo.save(items)
  }

  async getBookingById(bookingId: string, userId: string): Promise<Booking | null> {
    return await this.bookingRepo.findOne({ where: { id: bookingId, userId }, relations: ['items', 'payments'] })
  }

  async getUserBookings(userId: string, limit: number = 20, offset: number = 0): Promise<{ bookings: Booking[]; total: number }> {
    const [bookings, total] = await this.bookingRepo.findAndCount({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    })
    return { bookings, total }
  }

  async cancelBooking(bookingId: string, userId: string, reason?: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId, userId }, relations: ['items', 'payments'] })
    if (!booking) throw new Error('Booking not found')
    if (booking.status !== BookingStatus.CONFIRMED) throw new Error('Only confirmed bookings can be cancelled')

    const canCancel = this.checkCancellationPolicy(booking)
    if (!canCancel.allowed) throw new Error(canCancel.reason || 'Cancellation not allowed')

    const refundAmount = this.calculateRefundAmount(booking, canCancel.feePercentage)

    if (refundAmount > 0) {
      const lastPayment = booking.payments.find((p) => p.status === PaymentStatus.COMPLETED)
      if (lastPayment) {
        await this.paymentService.processRefund(lastPayment.id, refundAmount)
      }
    }

    booking.status = BookingStatus.CANCELLED
    booking.statusHistory = booking.statusHistory || []
    booking.statusHistory.push({ status: BookingStatus.CANCELLED, timestamp: new Date(), reason: reason || 'User cancellation', updatedBy: userId })

    const updated = await this.bookingRepo.save(booking)
    await this.emailService.sendCancellationConfirmation(updated, refundAmount)
    return updated
  }

  async modifyBooking(
    bookingId: string,
    userId: string,
    modifications: { newStartDate?: Date; newEndDate?: Date; guestChanges?: any; specialRequests?: string }
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId, userId }, relations: ['items'] })
    if (!booking) throw new Error('Booking not found')
    if (booking.status !== BookingStatus.CONFIRMED) throw new Error('Only confirmed bookings can be modified')

    const canModify = this.checkModificationPolicy(booking)
    if (!canModify.allowed) throw new Error(canModify.reason || 'Modification not allowed')

    if (modifications.newStartDate) booking.startDate = modifications.newStartDate
    if (modifications.newEndDate) booking.endDate = modifications.newEndDate
    if (modifications.specialRequests) booking.specialRequests = modifications.specialRequests

    booking.statusHistory = booking.statusHistory || []
    booking.statusHistory.push({ status: BookingStatus.CONFIRMED, timestamp: new Date(), reason: 'Booking modified', updatedBy: userId })

    const updated = await this.bookingRepo.save(booking)
    await this.emailService.sendModificationConfirmation(updated)
    return updated
  }

  async processWebhook(providerName: string, webhookData: any): Promise<void> {
    try {
      switch (providerName.toLowerCase()) {
        case 'booking.com':
          await this.handleBookingComWebhook(webhookData)
          break
        case 'skyscanner':
          await this.handleSkyscannerWebhook(webhookData)
          break
        default:
          console.warn(`Unknown webhook provider: ${providerName}`)
      }
    } catch (error) {
      console.error('Webhook processing failed:', error)
    }
  }

  private async handleBookingComWebhook(data: any): Promise<void> {
    const booking = await this.bookingRepo.findOne({ where: { providerBookingId: data.booking_id } })
    if (!booking) {
      console.warn(`Booking not found for webhook: ${data.booking_id}`)
      return
    }

    switch (data.status) {
      case 'confirmed':
        booking.status = BookingStatus.CONFIRMED
        break
      case 'cancelled':
        booking.status = BookingStatus.CANCELLED
        break
      case 'completed':
        booking.status = BookingStatus.COMPLETED
        break
    }

    booking.statusHistory = booking.statusHistory || []
    booking.statusHistory.push({ status: booking.status, timestamp: new Date(), reason: `Webhook update: ${data.status}`, updatedBy: 'system' })
    await this.bookingRepo.save(booking)
  }

  private async handleSkyscannerWebhook(_data: any): Promise<void> {
    // Placeholder for Skyscanner webhook handling
  }

  private checkCancellationPolicy(
    booking: Booking
  ): { allowed: boolean; reason?: string; feePercentage: number } {
    if (!booking.cancellationPolicy) return { allowed: true, feePercentage: 0 }
    if (booking.cancellationPolicy.nonRefundable) return { allowed: false, reason: 'This booking is non-refundable', feePercentage: 100 }

    const now = new Date()
    const startDate = booking.startDate
    const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (booking.cancellationPolicy.freeCancellationUntil && now <= booking.cancellationPolicy.freeCancellationUntil) {
      return { allowed: true, feePercentage: 0 }
    }

    const applicableFee = booking.cancellationPolicy.cancellationFees
      .slice()
      .sort((a, b) => b.daysBeforeStart - a.daysBeforeStart)
      .find((fee) => daysUntilStart >= fee.daysBeforeStart)

    return { allowed: true, feePercentage: applicableFee?.feePercentage || 100 }
  }

  private checkModificationPolicy(booking: Booking): { allowed: boolean; reason?: string } {
    if (!booking.modificationPolicy?.allowModifications) return { allowed: false, reason: 'Modifications not allowed for this booking' }
    if (booking.modificationPolicy.modificationDeadline) {
      const now = new Date()
      if (now > booking.modificationPolicy.modificationDeadline) return { allowed: false, reason: 'Modification deadline has passed' }
    }
    return { allowed: true }
  }

  private calculateRefundAmount(booking: Booking, feePercentage: number): number {
    const refundPercentage = (100 - feePercentage) / 100
    return Math.round(booking.totalAmount * refundPercentage * 100) / 100
  }

  private generateBookingReference(): string {
    return `DESTI-${uuidv4().substring(0, 8).toUpperCase()}`
  }
}
