import nodemailer from 'nodemailer'
import { Booking, BookingType } from '../entities/Booking'

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      } : undefined,
    })
  }

  async sendBookingConfirmation(booking: Booking): Promise<void> {
    const templateName = this.getTemplateForBookingType(booking.type)
    const html = await this.renderTemplate(templateName, {
      booking,
      customerName: booking.guestDetails?.guests?.[0]?.firstName || 'Guest',
      confirmationNumber: booking.bookingReference,
    })

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'no-reply@desti.app',
      to: booking.contactEmail || '',
      subject: `Booking Confirmation - ${booking.bookingReference}`,
      html,
      attachments: [
        { filename: 'booking-confirmation.pdf', content: await this.generateBookingPDF(booking) },
      ],
    })
  }

  async sendCancellationConfirmation(booking: Booking, refundAmount: number): Promise<void> {
    const html = await this.renderTemplate('cancellation-confirmation', {
      booking,
      refundAmount,
      customerName: booking.guestDetails?.guests?.[0]?.firstName || 'Guest',
    })

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'no-reply@desti.app',
      to: booking.contactEmail || '',
      subject: `Booking Cancelled - ${booking.bookingReference}`,
      html,
    })
  }

  async sendModificationConfirmation(booking: Booking): Promise<void> {
    const html = await this.renderTemplate('modification-confirmation', {
      booking,
      customerName: booking.guestDetails?.guests?.[0]?.firstName || 'Guest',
    })

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'no-reply@desti.app',
      to: booking.contactEmail || '',
      subject: `Booking Modified - ${booking.bookingReference}`,
      html,
    })
  }

  async sendBookingStatusUpdate(booking: Booking): Promise<void> {
    const html = await this.renderTemplate('status-update', {
      booking,
      customerName: booking.guestDetails?.guests?.[0]?.firstName || 'Guest',
    })

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'no-reply@desti.app',
      to: booking.contactEmail || '',
      subject: `Booking Update - ${booking.bookingReference}`,
      html,
    })
  }

  private getTemplateForBookingType(type: BookingType): string {
    const templates: Record<BookingType, string> = {
      [BookingType.ACCOMMODATION]: 'hotel-confirmation',
      [BookingType.FLIGHT]: 'flight-confirmation',
      [BookingType.ACTIVITY]: 'activity-confirmation',
      [BookingType.RESTAURANT]: 'restaurant-confirmation',
      [BookingType.TRANSPORT]: 'transport-confirmation',
      [BookingType.PACKAGE]: 'package-confirmation',
    }
    return templates[type] || 'generic-confirmation'
  }

  private async renderTemplate(templateName: string, data: any): Promise<string> {
    return `
      <html>
        <body>
          <h1>Booking Confirmation</h1>
          <p>Dear ${data.customerName},</p>
          <p>Your booking has been confirmed!</p>
          <div>
            <strong>Confirmation Number:</strong> ${data.booking.bookingReference}<br/>
            <strong>Total Amount:</strong> ${data.booking.currency} ${data.booking.totalAmount}<br/>
            <strong>Start Date:</strong> ${new Date(data.booking.startDate).toDateString()}
            ${data.booking.endDate ? `<br/><strong>End Date:</strong> ${new Date(data.booking.endDate).toDateString()}` : ''}
          </div>
          <p>Thank you for choosing Desti!</p>
        </body>
      </html>`
  }

  private async generateBookingPDF(_booking: Booking): Promise<Buffer> {
    // Placeholder: return minimal content. Replace with Puppeteer/pdfkit in production
    return Buffer.from('PDF content')
  }
}
