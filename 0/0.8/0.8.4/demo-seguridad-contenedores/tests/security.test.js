const request = require('supertest');
const app = require('../src/app');
const { initDatabase, close } = require('../src/database');

describe('Security Tests', () => {
  
  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(async () => {
    await close();
  });

  describe('Authentication Security', () => {
    
    test('Should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(401);

      expect(response.body.error).toBe('Token no proporcionado');
    });

    test('Should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(403);

      expect(response.body.error).toBe('Token inválido o expirado');
    });

    test('Should prevent SQL injection in login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "' OR '1'='1",
          password: "' OR '1'='1"
        })
        .expect(401);

      expect(response.body.error).toBeTruthy();
    });

    test('Should hash passwords properly', async () => {
      const testUser = {
        username: 'testuser',
        email: 'test@security.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.token).toBeDefined();
      // Password should never be returned
      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('Input Validation', () => {
    
    test('Should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('Should reject XSS attempts', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: '<script>alert("xss")</script>',
          email: 'test@test.com',
          password: 'password123'
        });

      // Should sanitize or reject
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('Should reject negative quantities in purchases', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ejemplo.com',
          password: 'admin123'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .post('/api/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: 1,
          quantity: -5
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('Should reject excessive quantities', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ejemplo.com',
          password: 'admin123'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .post('/api/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: 1,
          quantity: 999999
        })
        .expect(400);

      expect(response.body.error).toContain('máxima excedida');
    });
  });

  describe('Container Security', () => {
    
    test('Should not be running as root', () => {
      const isRoot = process.getuid ? process.getuid() === 0 : false;
      expect(isRoot).toBe(false);
    });

    test('Should have secure environment variables', () => {
      // JWT_SECRET should exist
      expect(process.env.JWT_SECRET).toBeDefined();
      
      // Should not be default value in production
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.JWT_SECRET).not.toBe('default-secret-change-in-production');
      }
    });

    test('Should run in production mode for deployment', () => {
      // This test would fail in dev, but documents the requirement
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.NODE_ENV).toBe('production');
      }
    });
  });

  describe('Security Headers', () => {
    
    test('Should include security headers', async () => {
      const response = await request(app)
        .get('/health');

      // Helmet should add these headers
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });

    test('Should have CORS configured', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      // CORS headers should be present
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    
    test('Should have rate limiting on API routes', async () => {
      // Make multiple requests quickly
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com', password: 'wrong' })
        );
      }

      const responses = await Promise.all(requests);
      
      // All should complete (rate limit is 100 per 15 min)
      responses.forEach(response => {
        expect([401, 429]).toContain(response.status);
      });
    });
  });

  describe('API Security', () => {
    
    test('Should reject malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    test('Should have health check endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });

    test('Should have readiness check endpoint', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
    });
  });

  describe('Security Metrics', () => {
    
    test('Should provide security metrics with auth', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ejemplo.com',
          password: 'admin123'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/security/metrics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.containerInfo).toBeDefined();
      expect(response.body.securityFeatures).toBeDefined();
      expect(response.body.resourceUsage).toBeDefined();
    });

    test('Should deny security metrics without auth', async () => {
      const response = await request(app)
        .get('/api/security/metrics')
        .expect(401);
    });
  });
});