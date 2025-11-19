import Stripe from 'stripe'
import { Repository } from 'typeorm'
import { Payment, PaymentMethod, PaymentStatus } from '../entities/Payment'
import { AppDataSource } from '../database'

export interface ProcessPaymentDto {
  bookingId: string
  amount: number
  currency: string
  paymentMethodId: string
  description: string
  customerEmail?: string
  metadata?: Record<string, string>
}

export interface CreatePaymentIntentDto {
  amount: number
  currency: string
  customerId?: string
  paymentMethodId?: string
  description: string
  metadata?: Record<string, string>
}

export class PaymentService {
  private stripe: Stripe
  private paymentRepo: Repository<Payment>

  constructor() {
    // Let Stripe SDK use its default apiVersion to satisfy stricter type unions
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')
    this.paymentRepo = AppDataSource.getRepository(Payment)
  }

  async createPaymentIntent(data: CreatePaymentIntentDto): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100),
        currency: (data.currency || 'USD').toLowerCase(),
        customer: data.customerId,
        payment_method: data.paymentMethodId,
        description: data.description,
        metadata: data.metadata || {},
        confirmation_method: 'manual',
        confirm: false,
      })

      return { clientSecret: paymentIntent.client_secret!, paymentIntentId: paymentIntent.id }
    } catch (error) {
      console.error('Failed to create payment intent:', error)
      throw new Error('Payment setup failed')
    }
  }

  async processPayment(data: ProcessPaymentDto): Promise<Payment> {
    try {
      const payment = this.paymentRepo.create({
        bookingId: data.bookingId,
        userId: '', // TODO: fill from booking if needed
        status: PaymentStatus.PROCESSING,
        method: PaymentMethod.CREDIT_CARD,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        metadata: data.metadata || {},
      })
      const savedPayment = await this.paymentRepo.save(payment)

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100),
        currency: (data.currency || 'USD').toLowerCase(),
        payment_method: data.paymentMethodId,
        description: data.description,
        metadata: {
          bookingId: data.bookingId,
          paymentId: savedPayment.id,
          ...(data.metadata || {}),
        },
        confirmation_method: 'automatic',
        confirm: true,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking/confirmation`,
      })

      savedPayment.stripePaymentIntentId = paymentIntent.id

      if (paymentIntent.status === 'succeeded') {
        savedPayment.status = PaymentStatus.COMPLETED
        savedPayment.stripeChargeId = paymentIntent.latest_charge as string
        savedPayment.transactionId = paymentIntent.id

        if (paymentIntent.payment_method) {
          const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentIntent.payment_method as string)
          if (paymentMethod.card) {
            savedPayment.paymentDetails = {
              cardLast4: paymentMethod.card.last4 || undefined,
              cardBrand: paymentMethod.card.brand || undefined,
              expiryMonth: paymentMethod.card.exp_month,
              expiryYear: paymentMethod.card.exp_year,
            }
          }
        }
      } else if (paymentIntent.status === 'requires_action') {
        savedPayment.status = PaymentStatus.PENDING
      } else {
        savedPayment.status = PaymentStatus.FAILED
        savedPayment.failureReason = paymentIntent.last_payment_error?.message || null
      }

      return await this.paymentRepo.save(savedPayment)
    } catch (error: any) {
      console.error('Payment processing failed:', error)
      const failed = await this.paymentRepo.findOne({ where: { bookingId: data.bookingId } })
      if (failed) {
        failed.status = PaymentStatus.FAILED
        failed.failureReason = error.message
        await this.paymentRepo.save(failed)
      }
      throw error
    }
  }

  async processRefund(paymentId: string, amount?: number): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } })
    if (!payment) throw new Error('Payment not found')
    if (!payment.stripeChargeId) throw new Error('No charge ID found for refund')

    try {
      const refund = await this.stripe.refunds.create({
        charge: payment.stripeChargeId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: 'requested_by_customer',
        metadata: { paymentId: payment.id, bookingId: payment.bookingId },
      })

      const refundAmount = refund.amount / 100
      if (refund.status === 'succeeded') {
        payment.status = amount && amount < payment.amount ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED
        payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount
      }
      return await this.paymentRepo.save(payment)
    } catch (error) {
      console.error('Refund processing failed:', error)
      throw new Error('Refund processing failed')
    }
  }

  async handleStripeWebhook(signature: string, body: Buffer | string): Promise<void> {
    let event: Stripe.Event
    try {
      event = this.stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || '')
    } catch (error: any) {
      console.error('Stripe webhook signature verification failed:', error)
      throw new Error('Invalid signature')
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case 'charge.dispute.created':
        // Optional: handle disputes
        break
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.paymentRepo.findOne({ where: { stripePaymentIntentId: paymentIntent.id } })
    if (payment) {
      payment.status = PaymentStatus.COMPLETED
      payment.stripeChargeId = paymentIntent.latest_charge as string
      payment.transactionId = paymentIntent.id
      await this.paymentRepo.save(payment)
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.paymentRepo.findOne({ where: { stripePaymentIntentId: paymentIntent.id } })
    if (payment) {
      payment.status = PaymentStatus.FAILED
      payment.failureReason = paymentIntent.last_payment_error?.message || null
      await this.paymentRepo.save(payment)
    }
  }

  async getPaymentMethods(customerId: string): Promise<Array<{ id: string; type: string; last4?: string; brand?: string }>> {
    try {
      const list = await this.stripe.paymentMethods.list({ customer: customerId, type: 'card' })
      return (list.data || []).map((pm) => ({
        id: pm.id,
        type: pm.type,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
      }))
    } catch (error) {
      console.error('Failed to retrieve payment methods:', error)
      throw new Error('Failed to retrieve payment methods')
    }
  }
}
