import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Booking } from './entities/Booking'
import { BookingItem } from './entities/BookingItem'
import { Payment } from './entities/Payment'
import dotenv from 'dotenv'

dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [Booking, BookingItem, Payment],
  synchronize: true, // For development only; use migrations in prod
  logging: !isProd,
})
