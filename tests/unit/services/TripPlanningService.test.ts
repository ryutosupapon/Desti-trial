import { TripPlanningService } from '../../../services/trip-service/src/services/TripPlanningService'
import { ContentApiService } from '../../../services/trip-service/src/services/ContentApiService'
import { RouteOptimizationService } from '../../../services/trip-service/src/services/RouteOptimizationService'
import { WeatherService } from '../../../services/trip-service/src/services/WeatherService'

jest.mock('../../../services/trip-service/src/services/ContentApiService')
jest.mock('../../../services/trip-service/src/services/RouteOptimizationService')
jest.mock('../../../services/trip-service/src/services/WeatherService')

describe('TripPlanningService', () => {
  let service: TripPlanningService
  let mockContentApi: jest.Mocked<ContentApiService>
  let mockRouteOptimizer: jest.Mocked<RouteOptimizationService>
  let mockWeatherService: jest.Mocked<WeatherService>

  beforeEach(() => {
    jest.clearAllMocks()
    mockContentApi = new ContentApiService() as any
    mockRouteOptimizer = new RouteOptimizationService() as any
    mockWeatherService = new WeatherService() as any
    service = new TripPlanningService() as any
    ;(service as any).contentApi = mockContentApi
    ;(service as any).routeOptimizer = mockRouteOptimizer
    ;(service as any).weatherService = mockWeatherService
  })

  describe('createTrip', () => {
    it('should create trip with valid data', async () => {
      const tripData = {
        name: 'Test Trip',
        description: 'A test trip',
        startDate: new Date('2024-06-15'),
        endDate: new Date('2024-06-20'),
        destinationIds: ['dest-1'],
        budgetLevel: 'midrange' as any,
        preferences: { travelStyle: ['adventure'], pace: 'moderate' as any },
      }
      const result = await service.createTrip('user-1', tripData)
      expect(result).toBeDefined()
      expect(result.name).toBe(tripData.name)
      expect(result.duration).toBe(5)
      expect(result.planningSteps.datesSet).toBe(true)
      expect(result.planningSteps.destinationChosen).toBe(true)
    })

    it('should handle photo intent extraction', async () => {
      const tripData = {
        name: 'Photo-Inspired Trip',
        startDate: new Date('2024-06-15'),
        endDate: new Date('2024-06-20'),
        destinationIds: ['dest-1'],
        budgetLevel: 'midrange' as any,
        inspirationPhotoIds: ['photo-1', 'photo-2'],
      }
      jest.spyOn(service as any, 'extractIntentFromPhotos').mockResolvedValue({ activities: [{ name: 'hiking', confidence: 0.9 }], style: ['nature'], mood: ['peaceful'] })
      const result = await service.createTrip('user-1', tripData)
      expect(result.extractedIntent).toBeDefined()
      expect(result.extractedIntent.activities).toEqual(expect.arrayContaining([{ name: 'hiking', confidence: 0.9 }]))
    })

    it('should validate date ranges', async () => {
      const invalidTripData = {
        name: 'Invalid Trip',
        startDate: new Date('2024-06-20'),
        endDate: new Date('2024-06-15'),
        destinationIds: ['dest-1'],
        budgetLevel: 'midrange' as any,
      }
      await expect(service.createTrip('user-1', invalidTripData)).rejects.toThrow('End date must be after start date')
    })
  })

  describe('generateItinerary', () => {
    let mockTrip: any
    beforeEach(() => {
      mockTrip = {
        id: 'trip-1',
        userId: 'user-1',
        duration: 3,
        destinationIds: ['dest-1'],
        extractedIntent: { activities: [{ name: 'hiking', confidence: 0.9 }, { name: 'museum visit', confidence: 0.7 }] },
        budgetLevel: 'midrange',
        dayPlans: [
          { id: 'day-1', dayNumber: 1, destinationId: 'dest-1', date: new Date('2024-06-15') },
          { id: 'day-2', dayNumber: 2, destinationId: 'dest-1', date: new Date('2024-06-16') },
          { id: 'day-3', dayNumber: 3, destinationId: 'dest-1', date: new Date('2024-06-17') },
        ],
      }
      jest.spyOn(service as any, 'getTripById').mockResolvedValue(mockTrip)
    })

    it('should generate activities for each day', async () => {
      ;(mockContentApi.searchActivities as jest.Mock).mockResolvedValue({
        activities: [
          { id: 'activity-1', name: 'Hiking Trail', category: 'outdoor', estimatedDuration: 180, rating: 4.5, address: '123 Trail St', coordinates: { lat: 40.7128, lng: -74.006 } },
          { id: 'activity-2', name: 'Art Museum', category: 'cultural', estimatedDuration: 120, rating: 4.2, address: '456 Museum Ave', coordinates: { lat: 40.7589, lng: -73.9851 } },
        ],
      })
      ;(mockRouteOptimizer.optimizeRoute as jest.Mock).mockResolvedValue({ order: [0, 1], travelTimes: [30], distances: [2000], totalTime: 30, totalDistance: 2000 })
      ;(mockWeatherService.getForecast as jest.Mock).mockResolvedValue({ date: new Date('2024-06-15'), description: 'Sunny', temperature: { high: 25, low: 15 }, precipitation: 0.1, windSpeed: 10, humidity: 60, conditions: ['clear'] })

      const result = await service.generateItinerary('trip-1')
      expect(result.status).toBe('planned')
      expect(result.dayPlans).toHaveLength(3)
      const firstDay = result.dayPlans[0]
      expect(firstDay.activities).toBeDefined()
      expect(firstDay.activities.length).toBeGreaterThan(0)
    })

    it('should respect budget constraints', async () => {
      ;(mockContentApi.searchActivities as jest.Mock).mockResolvedValue({
        activities: [
          { id: 'expensive-activity', name: 'Luxury Experience', pricing: { adult: 500, currency: 'USD' }, category: 'entertainment', rating: 4.8 },
          { id: 'budget-activity', name: 'Free Walking Tour', pricing: { free: true, currency: 'USD' }, category: 'cultural', rating: 4.3 },
        ],
      })
      mockTrip.budgetLevel = 'budget'
      const result = await service.generateItinerary('trip-1')
      const all = result.dayPlans.flatMap((d: any) => d.activities)
      const hasExpensive = all.some((a: any) => a.name === 'Luxury Experience')
      expect(hasExpensive).toBe(false)
    })

    it('should handle weather-dependent activities', async () => {
      ;(mockWeatherService.getForecast as jest.Mock).mockResolvedValue({ date: new Date('2024-06-15'), description: 'Heavy Rain', temperature: { high: 20, low: 12 }, precipitation: 0.9, windSpeed: 15, humidity: 85, conditions: ['rain'] })
      ;(mockContentApi.searchActivities as jest.Mock).mockResolvedValue({
        activities: [
          { id: 'outdoor-activity', name: 'Outdoor Concert', category: 'entertainment', weatherDependencies: ['sunny', 'no_rain'], rating: 4.0 },
          { id: 'indoor-activity', name: 'Indoor Museum', category: 'cultural', weatherDependencies: [], rating: 4.5 },
        ],
      })
      const result = await service.generateItinerary('trip-1')
      const firstDay = result.dayPlans[0]
      expect(firstDay.weatherInfo.recommendations).toContain('Consider indoor activities')
    })
  })

  describe('route optimization', () => {
    it('should optimize activity order for minimal travel time', async () => {
      const activities = [
        { location: { coordinates: { lat: 40.7128, lng: -74.006 } } },
        { location: { coordinates: { lat: 40.7589, lng: -73.9851 } } },
        { location: { coordinates: { lat: 40.6892, lng: -74.0445 } } },
      ]
      ;(mockRouteOptimizer.optimizeRoute as jest.Mock).mockResolvedValue({ order: [0, 2, 1], travelTimes: [15, 20], distances: [1200, 1800], totalTime: 35, totalDistance: 3000 })
      const result = await (service as any).optimizeDayRoute({ id: 'day-1', activities })
      expect(mockRouteOptimizer.optimizeRoute).toHaveBeenCalledWith([
        { lat: 40.7128, lng: -74.006 },
        { lat: 40.7589, lng: -73.9851 },
        { lat: 40.6892, lng: -74.0445 },
      ])
      expect(result.order).toEqual([0, 2, 1])
    })
  })
})
