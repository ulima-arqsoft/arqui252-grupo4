const request = require('supertest');
const app = require('../src/app');
const { initDatabase, close } = require('../src/database');

describe('Application Tests', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(async () => {
    await close();
  });

  describe('Health Checks', () => {
    
    test('GET /health should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    test('GET /ready should return ready status', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
      expect(response.body.database).toBe('connected');
    });
  });

  describe('Authentication', () => {
    
    test('POST /api/auth/register should create new user', async () => {
      const newUser = {
        username: 'testuser',
        email: 'testuser@test.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.message).toBe('Usuario registrado exitosamente');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.password).toBeUndefined();

      testUserId = response.body.user.id;
      authToken = response.body.token;
    });

    test('POST /api/auth/register should reject duplicate email', async () => {
      const duplicateUser = {
        username: 'testuser2',
        email: 'testuser@test.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(response.body.error).toContain('ya está registrado');
    });

    test('POST /api/auth/login should authenticate user', async () => {
      const credentials = {
        email: 'admin@ejemplo.com',
        password: 'admin123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.message).toBe('Login exitoso');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      
      authToken = response.body.token;
    });

    test('POST /api/auth/login should reject invalid credentials', async () => {
      const credentials = {
        email: 'admin@ejemplo.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.error).toBe('Credenciales inválidas');
    });

    test('POST /api/auth/login should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' })
        .expect(400);

      expect(response.body.error).toContain('requeridos');
    });
  });

  describe('Products', () => {
    
    test('GET /api/products should return products with auth', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const product = response.body[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('stock');
    });

    test('GET /api/products should reject without auth', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(401);

      expect(response.body.error).toBe('Token no proporcionado');
    });

    test('GET /api/products/:id should return single product', async () => {
      const response = await request(app)
        .get('/api/products/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
    });

    test('GET /api/products/:id should return 404 for invalid id', async () => {
      const response = await request(app)
        .get('/api/products/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Producto no encontrado');
    });
  });

  describe('Purchases', () => {
    
    test('POST /api/purchases should create purchase', async () => {
      const purchase = {
        productId: 1,
        quantity: 2
      };

      const response = await request(app)
        .post('/api/purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .send(purchase)
        .expect(201);

      expect(response.body.message).toBe('Compra realizada exitosamente');
      expect(response.body.purchaseId).toBeDefined();
      expect(response.body.total).toBeDefined();
    });

    test('POST /api/purchases should validate product exists', async () => {
      const purchase = {
        productId: 99999,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .send(purchase)
        .expect(404);

      expect(response.body.error).toBe('Producto no disponible');
    });

    test('POST /api/purchases should validate stock', async () => {
      const purchase = {
        productId: 1,
        quantity: 999999
      };

      const response = await request(app)
        .post('/api/purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .send(purchase)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('GET /api/purchases should return user purchases', async () => {
      const response = await request(app)
        .get('/api/purchases')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const purchase = response.body[0];
        expect(purchase).toHaveProperty('id');
        expect(purchase).toHaveProperty('product_name');
        expect(purchase).toHaveProperty('total');
        expect(purchase).toHaveProperty('status');
      }
    });

    test('POST /api/purchases should reject without auth', async () => {
      const purchase = {
        productId: 1,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/purchases')
        .send(purchase)
        .expect(401);

      expect(response.body.error).toBe('Token no proporcionado');
    });
  });

  describe('Error Handling', () => {
    
    test('Should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body.error).toBe('Endpoint no encontrado');
    });

    test('Should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });
});