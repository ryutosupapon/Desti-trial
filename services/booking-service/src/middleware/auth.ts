import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import jwt from 'jsonwebtoken'

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Dev fallback: allow user id from header
    const devUserId = req.header('x-user-id')
    if (devUserId) {
      req.user = { id: devUserId }
      return next()
    }

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' })

    const secret = process.env.JWT_SECRET || 'change-me'
    const payload = jwt.verify(token, secret) as any
    req.user = { id: payload.sub || payload.id, email: payload.email, name: payload.name }
    next()
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}
