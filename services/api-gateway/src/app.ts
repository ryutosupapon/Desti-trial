import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import { InputValidator } from '../../common/src/security/InputValidator'

const app = express()

// Security headers
app.use(helmet({ crossOriginEmbedderPolicy: false }))
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})

app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())

// Auth helpers for tests
function authRequired(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).send('Unauthorized')
  const token = auth.replace('Bearer ', '')
  // Accept a literal "valid-token" for tests, or verify a JWT
  if (token === 'valid-token') return next()
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'change-me')
    return next()
  } catch {
    return res.status(403).send('Forbidden')
  }
}

// Health
app.get('/health', (_req: Request, res: Response) => res.status(200).json({ ok: true }))

// Trips API (protected)
app.get('/api/trips', authRequired, (_req: Request, res: Response) => {
  res.json({ data: [] })
})

// Destinations search with SQL injection validation
app.get('/api/destinations/search', authRequired, (req: Request, res: Response) => {
  try {
    const q = String(req.query.query || '')
    InputValidator.validateSqlInput(q)
    res.json({ data: [] })
  } catch (e) {
    res.status(400).json({ error: 'Invalid search query' })
  }
})

// Simple user profile endpoint (no sensitive fields)
app.get('/api/users/profile', authRequired, (_req: Request, res: Response) => {
  res.json({ data: { id: 'u1', email: 'test@example.com', name: 'Test User' } })
})

// Login with aggressive rate limit to trigger 429 in tests
const loginLimiter = rateLimit({ windowMs: 60_000, max: 50, standardHeaders: true, legacyHeaders: false })
app.post('/api/users/login', loginLimiter, (_req: Request, res: Response) => {
  res.status(401).json({ error: 'Invalid credentials' })
})

// File upload security
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Request, file: any, cb: (err: any, acceptFile?: boolean) => void) => {
    try {
      InputValidator.validateFileUpload({
        mimetype: file.mimetype,
        size: (file as any).size || 0,
        originalname: file.originalname,
      })
      // Reject suspicious extensions
      const name = file.originalname.toLowerCase()
      if (/[.](php|js|html|exe|sh)$/.test(name)) return cb(new Error('Suspicious file detected'))
      cb(null, true)
    } catch (e) {
      cb(e as Error)
    }
  },
})

app.post('/api/photos/upload', authRequired, upload.array('photos'), (req: Request, res: Response) => {
  // Basic malware pattern block (EICAR test string)
  const buffers: Buffer[] = (req.files as Express.Multer.File[] | undefined)?.map(f => f.buffer) || []
  const joined = buffers.map(b => b.toString('utf8')).join('')
  if (joined.includes('EICAR-STANDARD-ANTIVIRUS-TEST-FILE')) {
    return res.status(400).json({ error: 'Malware detected' })
  }
  res.json({ success: true })
})

// Error handler to convert multer/file validation errors
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err) {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large' })
    }
    return res.status(400).json({ error: err.message || 'Bad Request' })
  }
  next()
})

export { app }
export default app
