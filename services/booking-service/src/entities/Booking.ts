import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm'
import { BookingItem } from './BookingItem'
import { Payment } from './Payment'

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum BookingType {
  ACCOMMODATION = 'accommodation',
  FLIGHT = 'flight',
  ACTIVITY = 'activity',
  RESTAURANT = 'restaurant',
  TRANSPORT = 'transport',
  PACKAGE = 'package',
}

@Entity('bookings')
@Index(['userId'])
@Index(['tripId'])
@Index(['status'])
@Index(['bookingDate'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  userId!: string

  @Column({ nullable: true })
  tripId!: string | null

  @Column({ type: 'enum', enum: BookingType })
  type!: BookingType

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus

  @Column()
  bookingReference!: string

  @Column({ nullable: true })
  externalReference!: string | null

  @Column({ nullable: true })
  providerName!: string | null

  @Column({ nullable: true })
  providerBookingId!: string | null

  @Column({ type: 'timestamptz' })
  bookingDate!: Date

  @Column({ type: 'timestamptz' })
  startDate!: Date

  @Column({ type: 'timestamptz', nullable: true })
  endDate!: Date | null

  @Column({ type: 'int' })
  guestCount!: number

  @Column({ type: 'jsonb', nullable: true })
  guestDetails!: {
    adults: number
    children: number
    infants: number
    guests: Array<{
      firstName: string
      lastName: string
      dateOfBirth?: Date
      nationality?: string
      passportNumber?: string
    }>
  } | null

  @Column({ type: 'float' })
  totalAmount!: number

  @Column({ type: 'float', default: 0 })
  taxes!: number

  @Column({ type: 'float', default: 0 })
  fees!: number

  @Column({ default: 'USD' })
  currency!: string

  @Column({ type: 'jsonb', nullable: true })
  priceBreakdown!: {
    basePrice: number
    taxes: Array<{ name: string; amount: number }>
    fees: Array<{ name: string; amount: number }>
    discounts: Array<{ name: string; amount: number }>
  } | null

  @Column({ nullable: true })
  contactEmail!: string | null

  @Column({ nullable: true })
  contactPhone!: string | null

  @Column({ type: 'text', nullable: true })
  specialRequests!: string | null

  @Column({ type: 'text', nullable: true })
  notes!: string | null

  @Column({ type: 'jsonb', nullable: true })
  cancellationPolicy!: {
    freeCancellationUntil?: Date
    cancellationFees: Array<{
      daysBeforeStart: number
      feePercentage: number
      description: string
    }>
    nonRefundable: boolean
  } | null

  @Column({ type: 'jsonb', nullable: true })
  modificationPolicy!: {
    allowModifications: boolean
    modificationDeadline?: Date
    modificationFee?: number
    restrictions: string[]
  } | null

  @Column({ type: 'jsonb', nullable: true })
  statusHistory!: Array<{
    status: BookingStatus
    timestamp: Date
    reason?: string
    updatedBy: string
  }> | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  @OneToMany(() => BookingItem, (item: BookingItem) => item.booking, { cascade: true })
  items!: BookingItem[]

  @OneToMany(() => Payment, (payment: Payment) => payment.booking, { cascade: true })
  payments!: Payment[]
}
