// server.js
// Punto de entrada principal con CORS arreglado

const http = require('http');
const { failSecurelyCheck } = require('./securityChecks');
const { rateLimit, MAX_REQUESTS_PER_MINUTE } = require('./rateLimiter');
const { handlePayment } = require('./paymentHandler');
const { checkDatabaseConnection } = require('./dbConnection');

const PORT = process.env.PORT || 8080;

// [DSA] Verificación de seguridad al arrancar
failSecurelyCheck();

// Servidor HTTP
const server = http.createServer(async (req, res) => {
  // ===== CORS COMPLETO (permite cualquier origen en desarrollo) =====
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Manejar preflight OPTIONS (importante para CORS)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // [DSA] Identificador real del cliente (IP)
  const clientIdentifier = req.socket.remoteAddress || 'unknown';

  // [DSA] Rate Limit
  if (!rateLimit(clientIdentifier)) {
    res.writeHead(429);
    return res.end(JSON.stringify({
      error: 'Bloqueado por seguridad. Demasiadas solicitudes.',
      hint: `Límite: ${MAX_REQUESTS_PER_MINUTE} solicitudes/minuto`
    }));
  }

  // === HEALTH CHECK ===
  if (req.url === '/health' && req.method === 'GET') {
    let dbStatus = 'DOWN';
    try {
      await checkDatabaseConnection();
      dbStatus = 'UP';
      res.writeHead(200);
      res.end(JSON.stringify({
        service: 'UP',
        database: dbStatus,
        message: 'Servicio de Pagos OK. BD Conectada.'
      }));
    } catch (error) {
      console.error('Error en Health Check:', error.message);
      res.writeHead(503);
      res.end(JSON.stringify({
        service: 'UP (con errores)',
        database: dbStatus,
        message: 'Servicio OK, pero BD inaccesible.'
      }));
    }
    return;
  }

  // === RUTA DE PAGO ===
  if (req.url === '/api/v1/payment' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const result = await handlePayment(data);
        
        res.writeHead(200);
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error('Error en /payment:', error.message);
        
        const isValidationError = error.message.includes('inválido') || error.message.includes('Datos inválidos');
        res.writeHead(isValidationError ? 400 : 500);
        res.end(JSON.stringify({
          error: isValidationError ? error.message : 'Error al procesar el pago',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }));
      }
    });
  } else {
    // 404 - Ruta no encontrada
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Microservicio DE PAGO listo en puerto ${PORT}`);
  console.log(`📊 Health Check: GET /health`);
  console.log(`🔒 Rate Limit: ${MAX_REQUESTS_PER_MINUTE} req/min`);
});