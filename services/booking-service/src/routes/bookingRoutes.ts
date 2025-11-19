import { Router } from 'express'
import { BookingController } from '../controllers/BookingController'
import { authenticateToken } from '../middleware/auth'

const router = Router()
const bookingController = new BookingController()

router.use(authenticateToken)

router.post('/hotels', BookingController.hotelBookingValidation, bookingController.createHotelBooking.bind(bookingController))
router.post('/flights', bookingController.createFlightBooking.bind(bookingController))

router.get('/user', bookingController.getUserBookings.bind(bookingController))
router.get('/:bookingId', bookingController.getBooking.bind(bookingController))
router.post('/:bookingId/cancel', bookingController.cancelBooking.bind(bookingController))
router.put('/:bookingId/modify', bookingController.modifyBooking.bind(bookingController))

router.post('/payment-intent', bookingController.createPaymentIntent.bind(bookingController))
router.get('/payment-methods/:customerId', bookingController.getPaymentMethods.bind(bookingController))

export { router as bookingRoutes }
