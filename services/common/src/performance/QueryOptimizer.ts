import type { DataSource, SelectQueryBuilder } from 'typeorm'
import { performance } from 'perf_hooks'

export class QueryOptimizer {
  private slowQueryThreshold = 1000
  private queryCache = new Map<string, { data: any; timestamp: number }>()

  constructor(private dataSource: DataSource) {
    this.setupQueryLogging()
  }

  private setupQueryLogging(): void {
    const logger: any = (this.dataSource as any).logger
    if (!logger || typeof logger.logQuery !== 'function') return
    const originalLogQuery = logger.logQuery.bind(logger)
    logger.logQuery = (query: string, parameters?: any[]) => {
      const start = performance.now()
      const result = originalLogQuery(query, parameters)
      const duration = performance.now() - start
      if (duration > this.slowQueryThreshold) {
        console.warn(`Slow query detected (${Math.round(duration)}ms):`, {
          query: query.substring(0, 200),
          parameters: parameters?.slice(0, 5),
          duration,
        })
      }
      return result
    }
  }

  optimizeSelectQuery<T>(qb: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
    return qb.cache(60_000).limit(100)
  }

  paginateQuery<T>(qb: SelectQueryBuilder<T>, page = 1, limit = 20): SelectQueryBuilder<T> {
    const offset = (page - 1) * limit
    return qb.limit(limit).offset(offset)
  }

  async cacheQuery<T>(cacheKey: string, queryFn: () => Promise<T>, ttlMs = 300_000): Promise<T> {
    const cached = this.queryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < ttlMs) return cached.data
    const data = await queryFn()
    this.queryCache.set(cacheKey, { data, timestamp: Date.now() })
    return data
  }

  async batchLoad<T, K>(ids: K[], loadFn: (ids: K[]) => Promise<T[]>, keyFn: (item: T) => K): Promise<Map<K, T>> {
    const results = await loadFn(ids)
    const map = new Map<K, T>()
    for (const item of results) map.set(keyFn(item), item)
    return map
  }

  async analyzeIndexUsage(_tableName: string): Promise<{ unusedIndexes: string[]; missingIndexes: string[]; recommendations: string[] }> {
    // Placeholder implementation; hook up to pg_stat_statements in production environments.
    return { unusedIndexes: [], missingIndexes: [], recommendations: [] }
  }

  getMemoryUsage(): { heapUsed: number; heapTotal: number; external: number; rss: number } {
    const usage = process.memoryUsage()
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
    }
  }

  clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > 300_000) this.queryCache.delete(key)
    }
  }
}

// Usage: instantiate in each service with its DataSource
// const queryOptimizer = new QueryOptimizer(AppDataSource)
// setInterval(() => queryOptimizer.clearExpiredCache(), 300_000)
