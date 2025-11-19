import { Request } from 'express'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any
  meta?: any
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email?: string
    name?: string
  }
}
