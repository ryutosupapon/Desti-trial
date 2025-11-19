import validator from 'validator'

export class InputValidator {
  static sanitizeHtml(input: string): string {
    // Use DOMPurify in browser, fallback to basic tag stripping in Node/test
    if (typeof window !== 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const DOMPurify = require('isomorphic-dompurify')
        return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
      } catch {}
    }
    // Basic removal of tags and scripts for non-browser environments
    return String(input).replace(/<[^>]*>/g, '')
  }

  static validateEmail(email: string): string {
    const sanitized = validator.normalizeEmail(email.toLowerCase()) || ''
    if (!validator.isEmail(sanitized)) throw new Error('Invalid email format')
    return sanitized
  }

  static validatePassword(password: string): void {
    if (!password || password.length < 8) throw new Error('Password must be at least 8 characters long')
    if (!/(?=.*[a-z])/.test(password)) throw new Error('Password must contain at least one lowercase letter')
    if (!/(?=.*[A-Z])/.test(password)) throw new Error('Password must contain at least one uppercase letter')
    if (!/(?=.*\d)/.test(password)) throw new Error('Password must contain at least one number')
    if (!/(?=.*[@$!%*?&])/.test(password)) throw new Error('Password must contain at least one special character')
    const commonPasswords = ['password','123456','123456789','qwerty','abc123','password123','admin','welcome','login','master']
    if (commonPasswords.includes(password.toLowerCase())) throw new Error('Password is too common, please choose a more secure one')
  }

  static validatePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (!validator.isMobilePhone(cleaned)) throw new Error('Invalid phone number format')
    return cleaned
  }

  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input) return ''
    const sanitized = this.sanitizeHtml(input).replace(/\s+/g, ' ').trim()
    if (sanitized.length > maxLength) throw new Error(`Input too long, maximum ${maxLength} characters allowed`)
    return sanitized
  }

  static validateFileUpload(file: { mimetype: string; size: number; originalname: string }): void {
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/heic']
    if (!allowed.includes(file.mimetype)) throw new Error('Invalid file type. Only images are allowed.')
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) throw new Error('File too large. Maximum size is 10MB.')
    const suspiciousExtensions = ['.php','.js','.html','.exe','.sh']
    const hasSuspicious = suspiciousExtensions.some(ext => file.originalname.toLowerCase().includes(ext))
    if (hasSuspicious) throw new Error('Suspicious file detected')
  }

  static validateSqlInput(input: string): string {
    const sqlKeywords = ['SELECT','INSERT','UPDATE','DELETE','DROP','CREATE','ALTER','EXEC','UNION','SCRIPT','--',';','XP_']
    const upper = input.toUpperCase()
    if (sqlKeywords.some(k => upper.includes(k))) throw new Error('Invalid characters detected in input')
    return input
  }

  static validateCoordinates(lat: number, lng: number): { lat: number; lng: number } {
    if (!validator.isFloat(lat.toString(), { min: -90, max: 90 })) throw new Error('Invalid latitude value')
    if (!validator.isFloat(lng.toString(), { min: -180, max: 180 })) throw new Error('Invalid longitude value')
    return { lat, lng }
  }

  static validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) throw new Error('Start date must be before end date')
    const now = new Date()
    if (startDate < now) throw new Error('Start date cannot be in the past')
    const maxDuration = 365 * 24 * 60 * 60 * 1000
    if (endDate.getTime() - startDate.getTime() > maxDuration) throw new Error('Trip duration cannot exceed 1 year')
  }

  static validateCurrency(currency: string): string {
    const supported = ['USD','EUR','GBP','CAD','AUD','JPY','CHF','CNY','INR']
    const up = currency.toUpperCase()
    if (!supported.includes(up)) throw new Error('Unsupported currency')
    return up
  }
}
