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

@Entity('booking_items')
@Index(['bookingId'])
export class BookingItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  bookingId!: string

  @Column()
  itemType!: string

  @Column()
  itemName!: string

  @Column({ type: 'text', nullable: true })
  description!: string | null

  @Column({ nullable: true })
  roomType!: string | null

  @Column({ type: 'int', nullable: true })
  roomCount!: number | null

  @Column({ nullable: true })
  flightNumber!: string | null

  @Column({ nullable: true })
  airline!: string | null

  @Column({ nullable: true })
  departureAirport!: string | null

  @Column({ nullable: true })
  arrivalAirport!: string | null

  @Column({ type: 'timestamptz', nullable: true })
  departureTime!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  arrivalTime!: Date | null

  @Column({ nullable: true })
  seatClass!: string | null

  @Column({ type: 'timestamptz', nullable: true })
  activityDate!: Date | null

  @Column({ nullable: true })
  activityTime!: string | null

  @Column({ type: 'int', nullable: true })
  participantCount!: number | null

  @Column({ type: 'float' })
  unitPrice!: number

  @Column({ type: 'int' })
  quantity!: number

  @Column({ type: 'float' })
  totalPrice!: number

  @Column({ default: 'USD' })
  currency!: string

  @Column({ nullable: true })
  confirmationCode!: string | null

  @Column({ type: 'jsonb', nullable: true })
  vendorDetails!: {
    vendorName: string
    vendorId: string
    contactInfo?: {
      phone?: string
      email?: string
      address?: string
    }
  } | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  @ManyToOne(() => Booking, (booking) => booking.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking!: Booking
}
