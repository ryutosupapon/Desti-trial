import request from 'supertest'
import { app } from '../../services/api-gateway/src/app'

describe('Security Audit', () => {
  describe('Authentication & Authorization', () => {
    it('should reject requests without authentication', async () => {
      await request(app).get('/api/trips').expect(401)
    })
    it('should reject invalid JWT tokens', async () => {
      await request(app).get('/api/trips').set('Authorization', 'Bearer invalid-token').expect(403)
    })
    it('should prevent SQL injection in query parameters', async () => {
      const maliciousQuery = "'; DROP TABLE users; --"
      await request(app)
        .get('/api/destinations/search')
        .query({ query: maliciousQuery })
        .set('Authorization', 'Bearer valid-token')
        .expect(400)
    })
  })

  describe('Data Protection', () => {
    it('should not expose sensitive user data', async () => {
      const res = await request(app).get('/api/users/profile').set('Authorization', 'Bearer valid-token').expect(200)
      expect(res.body.data).not.toHaveProperty('password')
      expect(res.body.data).not.toHaveProperty('passwordHash')
      expect(res.body.data).not.toHaveProperty('resetToken')
    })
  })

  describe('File Upload Security', () => {
    it('should reject malicious file types', async () => {
      const maliciousFile = Buffer.from('<?php echo "hack"; ?>')
      await request(app)
        .post('/api/photos/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('photos', maliciousFile, 'malicious.php')
        .expect(400)
    })
    it('should limit file sizes', async () => {
      const largeFile = Buffer.alloc(11 * 1024 * 1024, 'a')
      await request(app)
        .post('/api/photos/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('photos', largeFile, 'large.jpg')
        .expect(413)
    })
    it('should scan uploaded files for malware', async () => {
      const eicar = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*')
      await request(app)
        .post('/api/photos/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('photos', eicar, 'test.jpg')
        .expect(400)
    })
  })

  describe('API Security', () => {
    it('should include security headers', async () => {
      const res = await request(app).get('/health').expect(200)
      expect(res.headers).toHaveProperty('x-frame-options')
      expect(res.headers).toHaveProperty('x-content-type-options')
      expect(res.headers).toHaveProperty('x-xss-protection')
    })
  })
})
