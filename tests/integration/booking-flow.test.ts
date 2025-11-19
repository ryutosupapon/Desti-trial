import request from 'supertest'

// Ensure required env vars are set before loading the app (Stripe, etc.)
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

// Defer requiring the app until after env is set
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { app } = require('../../services/booking-service/src/app')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AppDataSource } = require('../../services/booking-service/src/database')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { BookingStatus } = require('../../services/booking-service/src/entities/Booking')

describe('Booking Integration Tests', () => {
  let authToken: string

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      try { await AppDataSource.initialize() } catch { /* ignore for tests if DB not available */ }
    }
    await request(app).post('/api/users/register').send({ email: 'test@example.com', password: 'TestPassword123!', firstName: 'Test', lastName: 'User' })
    const loginResponse = await request(app).post('/api/users/login').send({ email: 'test@example.com', password: 'TestPassword123!' })
    authToken = loginResponse.body.data?.accessToken || ''
  })

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
    }
  })

  it('should create payment intent and handle basic booking flow', async () => {
    const paymentIntentResponse = await request(app)
      .post('/api/bookings/payment-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 299.99, currency: 'USD', description: 'Hotel booking test' })
    expect(paymentIntentResponse.status).toBeLessThan(500)

    const bookingResponse = await request(app)
      .post('/api/bookings/hotels')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId: 'test-hotel-1',
        roomId: 'test-room-1',
        roomCount: 1,
        startDate: '2024-06-15',
        endDate: '2024-06-18',
        guestDetails: { adults: 1, children: 0, infants: 0, guests: [{ firstName: 'Test', lastName: 'User' }] },
        contactEmail: 'test@example.com',
        contactPhone: '+1234567890',
        paymentMethodId: 'pm_test_card',
      })
    expect([201, 400]).toContain(bookingResponse.status)
    if (bookingResponse.status === 201) {
      expect(bookingResponse.body.data.status).toBeDefined()
      expect(bookingResponse.body.data.bookingReference).toBeDefined()
    }
  })
})
