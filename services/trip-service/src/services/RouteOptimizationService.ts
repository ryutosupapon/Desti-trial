export class RouteOptimizationService {
  async optimizeRoute(coords: Array<{ lat: number; lng: number }>): Promise<{ order: number[]; travelTimes: number[]; distances: number[]; totalTime: number; totalDistance: number }> {
    // Identity order for default
    const order = coords.map((_, i) => i)
    return { order, travelTimes: [], distances: [], totalTime: 0, totalDistance: 0 }
  }
}
