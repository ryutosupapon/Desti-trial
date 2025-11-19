import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Booking } from './Booking'

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
}

@Entity('payments')
@Index(['bookingId'])
@Index(['stripePaymentIntentId'])
@Index(['status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  bookingId!: string

  @Column()
  userId!: string

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus

  @Column({ type: 'enum', enum: PaymentMethod })
  method!: PaymentMethod

  @Column({ nullable: true })
  stripePaymentIntentId!: string | null

  @Column({ nullable: true })
  stripeChargeId!: string | null

  @Column({ nullable: true })
  stripeCustomerId!: string | null

  @Column({ type: 'float' })
  amount!: number

  @Column({ default: 'USD' })
  currency!: string

  @Column({ type: 'float', default: 0 })
  processingFee!: number

  @Column({ type: 'float', nullable: true })
  refundedAmount!: number | null

  @Column({ nullable: true })
  description!: string | null

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails!: {
    cardLast4?: string
    cardBrand?: string
    expiryMonth?: number
    expiryYear?: number
    billingAddress?: {
      line1: string
      line2?: string
      city: string
      state: string
      postalCode: string
      country: string
    }
  } | null

  @Column({ nullable: true })
  transactionId!: string | null

  @Column({ nullable: true })
  receiptUrl!: string | null

  @Column({ nullable: true })
  failureReason!: string | null

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  @ManyToOne(() => Booking, (booking) => booking.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking!: Booking
}
