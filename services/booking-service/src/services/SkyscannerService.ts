import axios, { AxiosInstance } from 'axios'

export interface FlightSearchQuery {
  originSkyId: string
  destinationSkyId: string
  outboundDate: string // YYYY-MM-DD
  returnDate?: string
  adults: number
  children?: number
  infants?: number
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first'
  currency?: string
  locale?: string
}

export interface FlightSearchResult {
  flights: Array<{
    id: string
    price: number
    currency: string
    deepLink: string
    legs: Array<{
      id: string
      origin: { skyId: string; name: string; displayCode: string }
      destination: { skyId: string; name: string; displayCode: string }
      departure: Date
      arrival: Date
      duration: number // minutes
      stops: number
      carriers: Array<{ name: string; displayCode: string }>
      segments: Array<{
        origin: { skyId: string; name: string }
        destination: { skyId: string; name: string }
        departure: Date
        arrival: Date
        carrier: { name: string; displayCode: string }
        flightNumber: string
        duration: number
      }>
    }>
    bookingOptions: Array<{
      price: number
      currency: string
      agent: { name: string }
      deepLink: string
    }>
  }>
  totalResults: number
}

export class SkyscannerService {
  private client: AxiosInstance
  private apiKey: string

  constructor() {
    this.apiKey = process.env.SKYSCANNER_API_KEY || ''
    this.client = axios.create({
      baseURL: 'https://partners.api.skyscanner.net',
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'skyscanner50.p.rapidapi.com',
      },
      timeout: 30000,
    })
  }

  async searchFlights(query: FlightSearchQuery): Promise<FlightSearchResult> {
    try {
      const sessionResponse = await this.createSearchSession(query)
      const sessionKey = sessionResponse.data.sessionKey

      let attempts = 0
      const maxAttempts = 10
      while (attempts < maxAttempts) {
        const resultsResponse = await this.getSearchResults(sessionKey)
        if (resultsResponse.data.status === 'UpdatesComplete') {
          return this.transformFlightResults(resultsResponse.data)
        }
        await new Promise((r) => setTimeout(r, 2000))
        attempts++
      }
      throw new Error('Flight search timeout')
    } catch (error) {
      console.error('Skyscanner API error:', error)
      throw new Error('Flight search failed')
    }
  }

  private async createSearchSession(query: FlightSearchQuery) {
    const body: any = {
      query: {
        market: 'US',
        locale: query.locale || 'en-US',
        currency: query.currency || 'USD',
        queryLegs: [
          {
            originPlaceId: query.originSkyId,
            destinationPlaceId: query.destinationSkyId,
            date: this.splitDate(query.outboundDate),
          },
        ],
        adults: query.adults,
        children: query.children || 0,
        infants: query.infants || 0,
        cabinClass: (query.cabinClass || 'economy').toUpperCase(),
        nearbyAirports: false,
      },
    }

    if (query.returnDate) {
      body.query.queryLegs.push({
        originPlaceId: query.destinationSkyId,
        destinationPlaceId: query.originSkyId,
        date: this.splitDate(query.returnDate),
      })
    }

    return await this.client.post('/apiservices/v3/flights/live/search/create', body)
  }

  private splitDate(iso: string) {
    const [year, month, day] = iso.split('-').map((s) => parseInt(s, 10))
    return { year, month, day }
  }

  private async getSearchResults(sessionKey: string) {
    return await this.client.get(`/apiservices/v3/flights/live/search/poll/${sessionKey}`, {
      params: {
        pageIndex: 0,
        pageSize: 50,
        includedCarriers: '',
        excludedCarriers: '',
        sortType: 'Price',
        sortOrder: 'Asc',
      },
    })
  }

  async getFlightDetails(flightId: string): Promise<any> {
    try {
      const response = await this.client.get(`/apiservices/v3/flights/${flightId}`)
      return response.data
    } catch (error) {
      console.error('Skyscanner flight details error:', error)
      throw new Error('Failed to get flight details')
    }
  }

  async searchAirports(query: string): Promise<
    Array<{ skyId: string; entityId: string; name: string; displayCode: string; cityName: string; countryName: string }>
  > {
    try {
      const response = await this.client.get('/apiservices/v3/autosuggest/flights', {
        params: {
          query,
          locale: 'en-US',
          searchTypes: 'PLACE_TYPE_AIRPORT,PLACE_TYPE_CITY',
        },
      })

      return (
        response.data.places?.map((place: any) => ({
          skyId: place.skyId,
          entityId: place.entityId,
          name: place.presentation.title,
          displayCode: place.presentation.suggestionTitle,
          cityName: place.parentPlace?.name || '',
          countryName: place.parentPlace?.parentPlace?.name || '',
        })) || []
      )
    } catch (error) {
      console.error('Skyscanner airport search error:', error)
      return []
    }
  }

  private transformFlightResults(rawData: any): FlightSearchResult {
    const flights =
      rawData.content?.results?.itineraries?.map((itinerary: any) => {
        const pricing = itinerary.pricing
        const legs =
          itinerary.legs?.map((leg: any) => ({
            id: leg.id,
            origin: { skyId: leg.origin.id, name: leg.origin.name, displayCode: leg.origin.displayCode },
            destination: { skyId: leg.destination.id, name: leg.destination.name, displayCode: leg.destination.displayCode },
            departure: new Date(leg.departure),
            arrival: new Date(leg.arrival),
            duration: leg.durationInMinutes,
            stops: leg.stops?.length || 0,
            carriers: leg.marketingCarriers?.map((carrier: any) => ({ name: carrier.name, displayCode: carrier.displayCode })) || [],
            segments:
              leg.segments?.map((segment: any) => ({
                origin: { skyId: segment.origin.id, name: segment.origin.name },
                destination: { skyId: segment.destination.id, name: segment.destination.name },
                departure: new Date(segment.departure),
                arrival: new Date(segment.arrival),
                carrier: { name: segment.marketingCarrier.name, displayCode: segment.marketingCarrier.displayCode },
                flightNumber: segment.flightNumber,
                duration: segment.durationInMinutes,
              })) || [],
          })) || []

        return {
          id: itinerary.id,
          price: pricing.price,
          currency: pricing.currency,
          deepLink: itinerary.deepLink,
          legs,
          bookingOptions:
            pricing.options?.map((option: any) => ({
              price: option.price,
              currency: option.currency,
              agent: { name: option.agent.name },
              deepLink: option.deepLink,
            })) || [],
        }
      }) || []

    return { flights, totalResults: rawData.content?.stats?.total || flights.length }
  }
}
