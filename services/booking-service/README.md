# Desti Booking Service

A standalone Node.js (TypeScript) microservice providing booking foundations for hotels and flights, including partner integrations, Stripe payments, and email notifications.

## Features
- TypeORM (Postgres) entities for Booking, BookingItem, Payment
- Booking.com and Skyscanner integration services (HTTP stubs)
- Booking orchestration (availability → booking → payment → confirmation)
- Stripe payment intents, refunds, and webhook handling
- Nodemailer email notifications (confirmation, cancellation, modification)
- Express controllers and routes with JWT auth middleware (dev header fallback)

## Getting started

1) Install dependencies

```bash
cd services/booking-service
npm install
```

2) Configure environment variables

```bash
cp .env.example .env
# edit .env with your values
```

3) Run the service (dev)

```bash
npm run dev
```

The service will start on http://localhost:4001 by default.

Health check: GET /health

## API overview
- POST /bookings/hotels — create hotel booking
- POST /bookings/flights — create flight booking
- GET /bookings/user — list user bookings
- GET /bookings/:bookingId — get a specific booking
- POST /bookings/:bookingId/cancel — cancel a booking
- PUT /bookings/:bookingId/modify — modify a booking
- POST /bookings/payment-intent — create Stripe payment intent
- GET /bookings/payment-methods/:customerId — list Stripe payment methods

Webhooks:
- POST /webhooks/stripe — Stripe webhook (raw body)
- POST /webhooks/booking/:provider — partner webhooks

## Auth
- Use Authorization: Bearer <JWT> header (JWT_SECRET).
- For local development, you can pass `x-user-id: <userId>` header to bypass JWT and inject a user id.

## Notes
- TypeORM `synchronize: true` is enabled for development. Use migrations for production.
- Partner integrations are stubs and will require valid credentials and endpoint adjustments.
- Email PDF attachment is a placeholder. Replace with a real PDF generator (Puppeteer/pdfkit) for production.
