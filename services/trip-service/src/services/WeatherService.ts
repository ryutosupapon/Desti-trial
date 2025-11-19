export class WeatherService {
  async getForecast(_date: Date): Promise<{ date: Date; description: string; temperature: { high: number; low: number }; precipitation: number; windSpeed: number; humidity: number; conditions: string[] }> {
    const date = new Date()
    return { date, description: 'Sunny', temperature: { high: 25, low: 15 }, precipitation: 0, windSpeed: 5, humidity: 50, conditions: ['clear'] }
  }
}
