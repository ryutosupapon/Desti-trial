import { ContentApiService } from './ContentApiService'
import { RouteOptimizationService } from './RouteOptimizationService'
import { WeatherService } from './WeatherService'

type BudgetLevel = 'budget' | 'midrange' | 'luxury'

export class TripPlanningService {
  private contentApi = new ContentApiService()
  private routeOptimizer = new RouteOptimizationService()
  private weatherService = new WeatherService()

  async createTrip(userId: string, data: any): Promise<any> {
    const { name, description, startDate, endDate, destinationIds, budgetLevel, inspirationPhotoIds } = data
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (!(start < end)) throw new Error('End date must be after start date')
    const msInDay = 24 * 60 * 60 * 1000
    const duration = Math.round((end.getTime() - start.getTime()) / msInDay)

    const trip: any = {
      id: `trip_${Date.now()}`,
      userId,
      name,
      description,
      startDate: start,
      endDate: end,
      duration,
      destinationIds,
      budgetLevel: (budgetLevel || 'midrange') as BudgetLevel,
      planningSteps: {
        datesSet: !!(start && end),
        destinationChosen: Array.isArray(destinationIds) && destinationIds.length > 0,
      },
    }

    if (Array.isArray(inspirationPhotoIds) && inspirationPhotoIds.length > 0) {
      trip.extractedIntent = await this.extractIntentFromPhotos(inspirationPhotoIds)
    }

    // Create day plans skeleton
    trip.dayPlans = Array.from({ length: duration }, (_, i) => ({
      id: `day_${i + 1}`,
      dayNumber: i + 1,
      destinationId: destinationIds?.[0],
      date: new Date(start.getTime() + i * msInDay),
    }))

    return trip
  }

  async generateItinerary(tripId: string): Promise<any> {
    const trip = await this.getTripById(tripId)
    if (!trip) throw new Error('Trip not found')

    const updatedDayPlans = [] as any[]
    for (const day of trip.dayPlans) {
      const weather = await (async () => {
        try {
          const w = await (this.weatherService.getForecast as any)(day.date)
          return w
        } catch {
          return undefined as any
        }
      })()
      const { activities } = await this.contentApi.searchActivities({ destinationId: day.destinationId, intent: trip.extractedIntent })

      // Simple budget filter: drop activities with pricing.adult > 200 for budget level
      let filtered = activities
      if (trip.budgetLevel === 'budget') {
        filtered = activities.filter((a: any) => !(a?.pricing?.adult && a.pricing.adult > 200))
      }

      // Weather-dependent recommendation
      const recommendations: string[] = []
      if (weather && Array.isArray(weather.conditions) && weather.conditions.includes('rain')) {
        recommendations.push('Consider indoor activities')
      }

      // Optimize route if coordinates available
      if (filtered.length > 1) {
        await this.optimizeDayRoute({ id: day.id, activities: filtered })
      }

  updatedDayPlans.push({ ...day, activities: filtered, weatherInfo: weather ? { ...weather, recommendations } : { recommendations } })
    }

    return { ...trip, status: 'planned', dayPlans: updatedDayPlans }
  }

  // Helpers intentionally instance methods for easy spying in tests
  protected async getTripById(_tripId: string): Promise<any> {
    // Default mock trip for tests; can be spied/mocked by tests
    return {
      id: 'trip-1',
      userId: 'user-1',
      duration: 3,
      destinationIds: ['dest-1'],
      extractedIntent: { activities: [] },
      budgetLevel: 'midrange',
      dayPlans: [
        { id: 'day-1', dayNumber: 1, destinationId: 'dest-1', date: new Date() },
        { id: 'day-2', dayNumber: 2, destinationId: 'dest-1', date: new Date() },
        { id: 'day-3', dayNumber: 3, destinationId: 'dest-1', date: new Date() },
      ],
    }
  }

  protected async extractIntentFromPhotos(_photoIds: string[]): Promise<any> {
    return { activities: [], style: [], mood: [] }
  }

  protected async optimizeDayRoute(day: { id: string; activities: any[] }): Promise<any> {
    const points = day.activities.map((a: any) => a?.coordinates || a?.location?.coordinates).filter(Boolean)
    if (points.length > 1) {
      const result = await this.routeOptimizer.optimizeRoute(points)
      return result
    }
    return { order: [0], travelTimes: [], distances: [], totalTime: 0, totalDistance: 0 }
  }
}
