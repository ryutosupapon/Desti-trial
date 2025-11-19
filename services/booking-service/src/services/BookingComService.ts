import axios, { AxiosInstance } from 'axios'

export interface HotelSearchQuery {
  destination: string
  checkIn: string // YYYY-MM-DD
  checkOut: string
  adults: number
  children?: number
  rooms?: number
  currency?: string
  languageCode?: string
}

export interface HotelSearchResult {
  hotels: Array<{
    id: string
    name: string
    address: string
    coordinates: { lat: number; lng: number }
    rating: number
    reviewScore: number
    reviewCount: number
    images: string[]
    amenities: string[]
    rooms: Array<{
      id: string
      name: string
      description: string
      maxOccupancy: number
      price: number
      currency: string
      cancellationPolicy: string
      amenities: string[]
      images: string[]
    }>
    location: {
      distanceFromCenter: number
      nearbyAttractions: string[]
    }
  }>
  totalResults: number
}

export class BookingComService {
  private client: AxiosInstance
  private apiKey?: string

  constructor() {
    this.apiKey = process.env.BOOKING_COM_API_KEY
    this.client = axios.create({
      baseURL: 'https://distribution-xml.booking.com/json/bookings',
      headers: {
        'User-Agent': 'Desti/1.0',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  async searchHotels(query: HotelSearchQuery): Promise<HotelSearchResult> {
    try {
      const response = await this.client.get('/getHotels.json', {
        params: {
          username: process.env.BOOKING_COM_USERNAME,
          password: process.env.BOOKING_COM_PASSWORD,
          city: query.destination,
          checkin: query.checkIn,
          checkout: query.checkOut,
          adults: query.adults,
          children: query.children || 0,
          room1: query.adults,
          currency: query.currency || 'USD',
          languagecodes: query.languageCode || 'en',
          rows: 50,
          offset: 0,
        },
      })

      return this.transformHotelResults(response.data)
    } catch (error) {
      console.error('Booking.com API error:', error)
      throw new Error('Hotel search failed')
    }
  }

  async getHotelDetails(hotelId: string): Promise<any> {
    try {
      const response = await this.client.get('/getHotelDetails.json', {
        params: {
          username: process.env.BOOKING_COM_USERNAME,
          password: process.env.BOOKING_COM_PASSWORD,
          hotel_ids: hotelId,
          languagecodes: 'en',
        },
      })

      return response.data
    } catch (error) {
      console.error('Booking.com hotel details error:', error)
      throw new Error('Failed to get hotel details')
    }
  }

  async checkAvailability(
    hotelId: string,
    roomId: string,
    query: HotelSearchQuery
  ): Promise<{ available: boolean; price?: number; currency?: string; cancellationDeadline?: Date }>
  {
    try {
      const response = await this.client.get('/getBlockAvailability.json', {
        params: {
          username: process.env.BOOKING_COM_USERNAME,
          password: process.env.BOOKING_COM_PASSWORD,
          hotel_ids: hotelId,
          room_ids: roomId,
          checkin: query.checkIn,
          checkout: query.checkOut,
          adults: query.adults,
          children: query.children || 0,
        },
      })

      const availability = response.data?.[0]
      return {
        available: availability?.available === 1,
        price: availability?.price,
        currency: availability?.currency,
        cancellationDeadline: availability?.cancellation_deadline
          ? new Date(availability.cancellation_deadline)
          : undefined,
      }
    } catch (error) {
      console.error('Booking.com availability check error:', error)
      return { available: false }
    }
  }

  async makeReservation(bookingData: {
    hotelId: string
    roomId: string
    checkIn: string
    checkOut: string
    guests: Array<{ firstName: string; lastName: string }>
    contactEmail: string
    contactPhone: string
    specialRequests?: string
  }): Promise<{ bookingId: string; confirmationCode: string; status: string }> {
    try {
      const response = await this.client.post('/makeReservation.json', {
        username: process.env.BOOKING_COM_USERNAME,
        password: process.env.BOOKING_COM_PASSWORD,
        ...bookingData,
      })

      return {
        bookingId: response.data.booking_id,
        confirmationCode: response.data.confirmation_code,
        status: response.data.status,
      }
    } catch (error) {
      console.error('Booking.com reservation error:', error)
      throw new Error('Reservation failed')
    }
  }

  private transformHotelResults(rawData: any): HotelSearchResult {
    const hotels =
      rawData.result?.map((hotel: any) => ({
        id: hotel.hotel_id,
        name: hotel.hotel_name,
        address: hotel.address,
        coordinates: {
          lat: parseFloat(hotel.latitude),
          lng: parseFloat(hotel.longitude),
        },
        rating: hotel.class,
        reviewScore: hotel.review_score / 2,
        reviewCount: hotel.review_nr,
        images: hotel.main_photo_url ? [hotel.main_photo_url] : [],
        amenities: hotel.hotel_facilities?.split(',') || [],
        rooms:
          hotel.rooms?.map((room: any) => ({
            id: room.room_id,
            name: room.room_name,
            description: room.room_description,
            maxOccupancy: room.max_persons,
            price: parseFloat(room.price),
            currency: room.currency,
            cancellationPolicy: room.cancellation_policy,
            amenities: room.room_facilities?.split(',') || [],
            images: [],
          })) || [],
        location: {
          distanceFromCenter: hotel.distance,
          nearbyAttractions: [],
        },
      })) || []

    return { hotels, totalResults: rawData.total_count || hotels.length }
  }
}
