import { Router } from 'express'
import { BookingController } from '../controllers/BookingController'
import express from 'express'

const router = Router()
const bookingController = new BookingController()

// Stripe webhook expects raw body to verify signature
router.post('/stripe', express.raw({ type: 'application/json' }), bookingController.handleStripeWebhook.bind(bookingController))

// Partner webhooks (JSON)
router.post('/booking/:provider', express.json(), bookingController.handleBookingWebhook.bind(bookingController))

export { router as webhookRoutes }
