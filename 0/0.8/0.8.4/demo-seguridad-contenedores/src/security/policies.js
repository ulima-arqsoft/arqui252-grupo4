/**
 * Políticas de Seguridad para el Sistema de Compras
 * Implementa validaciones y controles de seguridad
 */

/**
 * Validar compra según políticas de negocio y seguridad
 */
async function validatePurchase(productId, quantity) {
  const errors = [];

  // Validación 1: Producto ID debe ser un número positivo
  if (!productId || productId <= 0) {
    errors.push('ID de producto inválido');
  }

  // Validación 2: Cantidad debe ser positiva y razonable
  if (!quantity || quantity <= 0) {
    errors.push('Cantidad debe ser mayor a 0');
  }

  if (quantity > 100) {
    errors.push('Cantidad máxima excedida (máximo 100 unidades por compra)');
  }

  // Validación 3: Prevenir inyección SQL
  if (String(productId).includes("'") || String(productId).includes('"')) {
    errors.push('Caracteres no permitidos en ID de producto');
  }

  return {
    valid: errors.length === 0,
    error: errors.join(', ')
  };
}

/**
 * Verificar políticas de seguridad del contenedor
 */
async function checkSecurityPolicies(req) {
  const checks = {
    rateLimit: true,
    authentication: !!req.user,
    validToken: !!req.user?.userId,
    nonRootUser: process.getuid ? process.getuid() !== 0 : true,
    secureHeaders: !!req.headers['user-agent']
  };

  const allPassed = Object.values(checks).every(check => check === true);

  return {
    allowed: allPassed,
    checks: checks,
    reason: allPassed ? null : 'Una o más políticas de seguridad fallaron'
  };
}

/**
 * Política de Network - Simula validación de red
 */
function checkNetworkPolicy(sourceIP, destinationPort) {
  // Lista de IPs bloqueadas (ejemplo)
  const blockedIPs = ['192.168.1.100', '10.0.0.50'];
  
  // Puertos permitidos
  const allowedPorts = [80, 443, 3000];

  const checks = {
    ipAllowed: !blockedIPs.includes(sourceIP),
    portAllowed: allowedPorts.includes(destinationPort)
  };

  return {
    allowed: checks.ipAllowed && checks.portAllowed,
    checks: checks
  };
}

/**
 * Política de recursos - Verificar límites
 */
function checkResourceLimits() {
  const memUsage = process.memoryUsage();
  const memLimitMB = 512; // Límite simulado de 512MB
  const memUsedMB = memUsage.heapUsed / 1024 / 1024;

  return {
    withinLimits: memUsedMB < memLimitMB,
    usage: {
      memoryUsedMB: Math.round(memUsedMB),
      memoryLimitMB: memLimitMB,
      percentage: Math.round((memUsedMB / memLimitMB) * 100)
    }
  };
}

/**
 * Validar entrada de usuario (prevenir XSS, injection)
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Eliminar caracteres peligrosos
  return input
    .replace(/[<>]/g, '') // Prevenir XSS básico
    .replace(/['";]/g, '') // Prevenir SQL injection básico
    .trim();
}

/**
 * Política de secretos - Verificar que no haya secretos expuestos
 */
function checkSecretsExposure() {
  const exposedSecrets = [];

  // Verificar variables de entorno críticas
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default-secret-change-in-production') {
    exposedSecrets.push('JWT_SECRET no está configurado correctamente');
  }

  if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.length < 8) {
    exposedSecrets.push('DB_PASSWORD es demasiado débil');
  }

  return {
    secure: exposedSecrets.length === 0,
    issues: exposedSecrets
  };
}

/**
 * Generar reporte de seguridad
 */
async function generateSecurityReport(req) {
  const networkPolicy = checkNetworkPolicy(
    req.ip || '127.0.0.1', 
    parseInt(process.env.PORT || 3000)
  );
  
  const resourceLimits = checkResourceLimits();
  const secretsCheck = checkSecretsExposure();
  const securityPolicies = await checkSecurityPolicies(req);

  return {
    timestamp: new Date().toISOString(),
    networkPolicy: networkPolicy,
    resourceLimits: resourceLimits,
    secretsManagement: secretsCheck,
    applicationPolicies: securityPolicies,
    overallStatus: networkPolicy.allowed && 
                   resourceLimits.withinLimits && 
                   secretsCheck.secure && 
                   securityPolicies.allowed ? 'SECURE' : 'ATTENTION_REQUIRED'
  };
}

module.exports = {
  validatePurchase,
  checkSecurityPolicies,
  checkNetworkPolicy,
  checkResourceLimits,
  sanitizeInput,
  checkSecretsExposure,
  generateSecurityReport
};