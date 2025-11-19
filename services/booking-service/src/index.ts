import 'reflect-metadata'
import dotenv from 'dotenv'
import { AppDataSource } from './database'
import { app } from './app'

dotenv.config()

const port = parseInt(process.env.BOOKING_SERVICE_PORT || '4001', 10)

AppDataSource.initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`Booking service listening on http://localhost:${port}`)
    })
  })
  .catch((err: unknown) => {
    console.error('Failed to initialize database', err)
    process.exit(1)
  })
