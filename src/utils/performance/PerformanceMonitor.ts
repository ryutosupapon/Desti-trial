export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  private navigationObserver: PerformanceObserver | null = null
  private resourceObserver: PerformanceObserver | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupObservers()
      this.trackPageLoad()
    }
  }

  private setupObservers(): void {
    if ('PerformanceObserver' in window) {
      this.navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming
            this.recordMetric('page_load_time', nav.loadEventEnd - nav.loadEventStart)
            this.recordMetric('dom_content_loaded', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart)
            this.recordMetric('first_paint', nav.loadEventStart - nav.fetchStart)
          }
        }
      })
      this.navigationObserver.observe({ entryTypes: ['navigation'] })

      this.resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const res = entry as PerformanceResourceTiming
            const time = res.responseEnd - res.startTime
            this.recordMetric('resource_load_time', time)
            if (time > 2000) console.warn('Slow resource detected:', res.name, time)
          }
        }
      })
      this.resourceObserver.observe({ entryTypes: ['resource'] })
    }
  }

  private trackPageLoad(): void {
    // Lazy import web-vitals in browser
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS((m: any) => this.recordMetric('cls', m.value))
        onFID((m: any) => this.recordMetric('fid', m.value))
        onFCP((m: any) => this.recordMetric('fcp', m.value))
        onLCP((m: any) => this.recordMetric('lcp', m.value))
        onTTFB((m: any) => this.recordMetric('ttfb', m.value))
      }).catch(() => {})
    }
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) this.metrics.set(name, [])
    const values = this.metrics.get(name)!
    values.push(value)
    if (values.length > 100) values.shift()
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {}
    for (const [name, values] of this.metrics.entries()) {
      if (!values.length) continue
      const avg = values.reduce((s, v) => s + v, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      result[name] = { avg, min, max, count: values.length }
    }
    return result
  }

  reportPerformanceIssue(issue: { type: 'slow_query' | 'slow_render' | 'memory_leak' | 'network_error'; details: any; timestamp: number }): void {
    console.warn('Performance issue detected:', issue)
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issue),
      }).catch(() => {})
    }
  }

  monitorMemoryUsage(): void {
    const perf: any = (typeof performance !== 'undefined' ? performance : null)
    if (perf && perf.memory) {
      const memory = perf.memory
      if (memory.usedJSHeapSize / memory.totalJSHeapSize > 0.9) {
        this.reportPerformanceIssue({
          type: 'memory_leak',
          details: {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          },
          timestamp: Date.now(),
        })
      }
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

if (typeof window !== 'undefined') {
  setInterval(() => performanceMonitor.monitorMemoryUsage(), 30_000)
}
