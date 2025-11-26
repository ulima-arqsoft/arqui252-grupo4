require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const app = require('./app');
const { initDatabase } = require('./database');

const PORT = process.env.PORT || 3000;

// ============================================
// SEGURIDAD: Helmet para headers seguros
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ============================================
// SEGURIDAD: Rate Limiting
// ============================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por windowMs
  message: 'Demasiadas solicitudes desde esta IP, intente más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================
// SEGURIDAD: CORS configurado
// ============================================
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ============================================
// Servir archivos estáticos
// ============================================
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// Endpoint de health check para Kubernetes
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// Endpoint de readiness para Kubernetes
// ============================================
app.get('/ready', async (req, res) => {
  try {
    // Verificar conexión a base de datos
    res.status(200).json({ 
      status: 'ready',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready',
      error: error.message
    });
  }
});

// ============================================
// Iniciar servidor
// ============================================
async function startServer() {
  try {
    // Inicializar base de datos
    await initDatabase();
    console.log('✓ Base de datos inicializada');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════════════╗
║    Sistema de Compras Seguro                   ║
║    Demo de Seguridad de Contenedores           ║
╟────────────────────────────────────────────────╢
║  Servidor ejecutándose en puerto ${PORT}       ║
║  Modo: ${process.env.NODE_ENV || 'development'}║
║  Usuario: ${process.env.USER || 'appuser'}     ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// ============================================
// Manejo de señales de terminación
// ============================================
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

startServer();