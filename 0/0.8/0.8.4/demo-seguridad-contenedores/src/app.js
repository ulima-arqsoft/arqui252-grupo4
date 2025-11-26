const express = require('express');
const { authenticateToken, login, register } = require('./auth');
const db = require('./database');
const { validatePurchase, checkSecurityPolicies } = require('./security/policies');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validación de entrada
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const result = await register(username, email, password);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }

    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(401).json({ error: error.message });
  }
});

// ============================================
// RUTAS DE PRODUCTOS (Protegidas)
// ============================================
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const products = await db.all('SELECT * FROM products WHERE available = 1');
    res.json(products);
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// ============================================
// RUTAS DE COMPRAS (Protegidas)
// ============================================
app.post('/api/purchases', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.userId;

    // Validación de seguridad
    const securityCheck = await checkSecurityPolicies(req);
    if (!securityCheck.allowed) {
      return res.status(403).json({ 
        error: 'Política de seguridad violada', 
        details: securityCheck.reason 
      });
    }

    // Validar compra
    const validation = await validatePurchase(productId, quantity);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Obtener producto
    const product = await db.get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product || !product.available) {
      return res.status(404).json({ error: 'Producto no disponible' });
    }

    // Verificar stock
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    const total = product.price * quantity;

    // Crear compra
    const result = await db.run(
      `INSERT INTO purchases (user_id, product_id, quantity, total, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [userId, productId, quantity, total]
    );

    // Actualizar stock
    await db.run(
      'UPDATE products SET stock = stock - ? WHERE id = ?',
      [quantity, productId]
    );

    res.status(201).json({
      message: 'Compra realizada exitosamente',
      purchaseId: result.lastID,
      total: total,
      securityChecks: securityCheck.checks
    });
  } catch (error) {
    console.error('Error creando compra:', error);
    res.status(500).json({ error: 'Error al procesar compra' });
  }
});

app.get('/api/purchases', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const purchases = await db.all(
      `SELECT p.*, pr.name as product_name, pr.price 
       FROM purchases p 
       JOIN products pr ON p.product_id = pr.id 
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );
    
    res.json(purchases);
  } catch (error) {
    console.error('Error obteniendo compras:', error);
    res.status(500).json({ error: 'Error al obtener compras' });
  }
});

// ============================================
// ENDPOINT DE MÉTRICAS DE SEGURIDAD
// ============================================
app.get('/api/security/metrics', authenticateToken, async (req, res) => {
  try {
    const metrics = {
      containerInfo: {
        user: process.env.USER || 'unknown',
        nodeEnv: process.env.NODE_ENV || 'development',
        platform: process.platform,
        nodeVersion: process.version
      },
      securityFeatures: {
        helmet: true,
        rateLimit: true,
        authentication: true,
        cors: true,
        nonRootUser: process.getuid ? process.getuid() !== 0 : 'N/A'
      },
      resourceUsage: {
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
});

// ============================================
// Manejo de errores 404
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// ============================================
// Manejo global de errores
// ============================================
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;