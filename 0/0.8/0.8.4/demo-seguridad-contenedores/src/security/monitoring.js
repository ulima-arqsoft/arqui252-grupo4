/**
 * Sistema de Monitoreo de Seguridad
 * Monitorea eventos de seguridad y métricas en tiempo real
 */

// Almacenamiento en memoria de eventos de seguridad
const securityEvents = [];
const MAX_EVENTS = 1000;

// Contadores de eventos
const eventCounters = {
  authAttempts: 0,
  authFailures: 0,
  authSuccess: 0,
  apiCalls: 0,
  suspiciousActivity: 0,
  rateLimitHits: 0
};

/**
 * Registrar evento de seguridad
 */
function logSecurityEvent(event) {
  const securityEvent = {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    type: event.type,
    severity: event.severity || 'info',
    source: event.source || 'unknown',
    message: event.message,
    metadata: event.metadata || {},
    userId: event.userId || null,
    ip: event.ip || null
  };

  securityEvents.unshift(securityEvent);

  // Mantener solo los últimos MAX_EVENTS eventos
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.pop();
  }

  // Actualizar contadores
  updateCounters(event.type);

  // Log a consola si es crítico
  if (event.severity === 'critical' || event.severity === 'high') {
    console.warn(` [SECURITY] ${event.type}: ${event.message}`);
  }

  return securityEvent;
}

/**
 * Generar ID único para evento
 */
function generateEventId() {
  return `SEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Actualizar contadores de eventos
 */
function updateCounters(eventType) {
  switch (eventType) {
    case 'auth_attempt':
      eventCounters.authAttempts++;
      break;
    case 'auth_failure':
      eventCounters.authFailures++;
      break;
    case 'auth_success':
      eventCounters.authSuccess++;
      break;
    case 'api_call':
      eventCounters.apiCalls++;
      break;
    case 'suspicious_activity':
      eventCounters.suspiciousActivity++;
      break;
    case 'rate_limit_hit':
      eventCounters.rateLimitHits++;
      break;
  }
}

/**
 * Obtener eventos de seguridad recientes
 */
function getRecentEvents(limit = 50, severity = null) {
  let events = securityEvents.slice(0, limit);
  
  if (severity) {
    events = events.filter(e => e.severity === severity);
  }
  
  return events;
}

/**
 * Obtener estadísticas de seguridad
 */
function getSecurityStats() {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  const recentEvents = securityEvents.filter(e => 
    new Date(e.timestamp).getTime() > oneHourAgo
  );

  const dailyEvents = securityEvents.filter(e => 
    new Date(e.timestamp).getTime() > oneDayAgo
  );

  return {
    totalEvents: securityEvents.length,
    recentEvents: recentEvents.length,
    dailyEvents: dailyEvents.length,
    counters: { ...eventCounters },
    eventsByType: getEventsByType(),
    eventsBySeverity: getEventsBySeverity(),
    authSuccessRate: calculateAuthSuccessRate(),
    suspiciousActivityRate: calculateSuspiciousRate()
  };
}

/**
 * Contar eventos por tipo
 */
function getEventsByType() {
  const counts = {};
  
  securityEvents.forEach(event => {
    counts[event.type] = (counts[event.type] || 0) + 1;
  });
  
  return counts;
}

/**
 * Contar eventos por severidad
 */
function getEventsBySeverity() {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };
  
  securityEvents.forEach(event => {
    if (counts[event.severity] !== undefined) {
      counts[event.severity]++;
    }
  });
  
  return counts;
}

/**
 * Calcular tasa de éxito de autenticación
 */
function calculateAuthSuccessRate() {
  const total = eventCounters.authAttempts;
  if (total === 0) return 100;
  
  return ((eventCounters.authSuccess / total) * 100).toFixed(2);
}

/**
 * Calcular tasa de actividad sospechosa
 */
function calculateSuspiciousRate() {
  const total = eventCounters.apiCalls;
  if (total === 0) return 0;
  
  return ((eventCounters.suspiciousActivity / total) * 100).toFixed(2);
}

/**
 * Detectar actividad sospechosa
 */
function detectSuspiciousActivity(req) {
  const suspicious = [];

  // 1. Múltiples intentos fallidos de autenticación
  const recentFailures = securityEvents.filter(e => 
    e.type === 'auth_failure' &&
    e.ip === req.ip &&
    (Date.now() - new Date(e.timestamp).getTime()) < 300000 // Últimos 5 minutos
  ).length;

  if (recentFailures >= 5) {
    suspicious.push({
      type: 'brute_force',
      severity: 'high',
      message: `${recentFailures} intentos fallidos de autenticación en 5 minutos`
    });
  }

  // 2. Acceso a múltiples recursos en poco tiempo
  const recentApiCalls = securityEvents.filter(e => 
    e.type === 'api_call' &&
    e.ip === req.ip &&
    (Date.now() - new Date(e.timestamp).getTime()) < 60000 // Último minuto
  ).length;

  if (recentApiCalls >= 100) {
    suspicious.push({
      type: 'rate_abuse',
      severity: 'medium',
      message: `${recentApiCalls} llamadas a la API en 1 minuto`
    });
  }

  // 3. User-Agent sospechoso
  const userAgent = req.headers['user-agent'] || '';
  const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];
  
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    suspicious.push({
      type: 'suspicious_agent',
      severity: 'low',
      message: `User-Agent sospechoso: ${userAgent}`
    });
  }

  return {
    isSuspicious: suspicious.length > 0,
    findings: suspicious
  };
}

/**
 * Monitorear uso de recursos
 */
function monitorResourceUsage() {
  const usage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  // Límites (MB)
  const memoryLimitMB = 512;
  const memoryUsedMB = usage.heapUsed / 1024 / 1024;
  const memoryPercentage = (memoryUsedMB / memoryLimitMB) * 100;

  const status = {
    memory: {
      usedMB: Math.round(memoryUsedMB),
      limitMB: memoryLimitMB,
      percentage: Math.round(memoryPercentage),
      status: memoryPercentage > 90 ? 'critical' : memoryPercentage > 75 ? 'warning' : 'ok'
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: process.uptime()
  };

  // Log si los recursos están altos
  if (status.memory.status === 'critical') {
    logSecurityEvent({
      type: 'resource_alert',
      severity: 'high',
      message: `Uso de memoria crítico: ${status.memory.percentage}%`,
      metadata: status.memory
    });
  }

  return status;
}

/**
 * Generar alerta de seguridad
 */
function generateAlert(alert) {
  const securityAlert = {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    type: 'security_alert',
    severity: alert.severity,
    title: alert.title,
    description: alert.description,
    recommendations: alert.recommendations || [],
    affectedResources: alert.affectedResources || []
  };

  console.error(` ALERTA DE SEGURIDAD [${alert.severity.toUpperCase()}]: ${alert.title}`);
  console.error(`   ${alert.description}`);

  return securityAlert;
}

/**
 * Middleware de monitoreo
 */
function monitoringMiddleware(req, res, next) {
  const startTime = Date.now();

  // Log de llamada a la API
  logSecurityEvent({
    type: 'api_call',
    severity: 'info',
    source: 'api',
    message: `${req.method} ${req.path}`,
    metadata: {
      method: req.method,
      path: req.path,
      query: req.query
    },
    userId: req.user?.userId,
    ip: req.ip
  });

  // Detectar actividad sospechosa
  const suspiciousCheck = detectSuspiciousActivity(req);
  if (suspiciousCheck.isSuspicious) {
    logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'high',
      source: 'detection',
      message: 'Actividad sospechosa detectada',
      metadata: suspiciousCheck.findings,
      ip: req.ip
    });
  }

  // Log de respuesta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (duration > 5000) {
      logSecurityEvent({
        type: 'slow_request',
        severity: 'warning',
        source: 'api',
        message: `Solicitud lenta: ${duration}ms`,
        metadata: {
          method: req.method,
          path: req.path,
          duration
        }
      });
    }
  });

  next();
}

/**
 * Limpiar eventos antiguos
 */
function cleanupOldEvents() {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  const initialLength = securityEvents.length;
  
  for (let i = securityEvents.length - 1; i >= 0; i--) {
    if (new Date(securityEvents[i].timestamp).getTime() < thirtyDaysAgo) {
      securityEvents.splice(i, 1);
    }
  }
  
  const removed = initialLength - securityEvents.length;
  if (removed > 0) {
    console.log(`🧹 Limpieza: ${removed} eventos antiguos eliminados`);
  }
}

// Limpiar eventos antiguos cada 24 horas
setInterval(cleanupOldEvents, 24 * 60 * 60 * 1000);

module.exports = {
  logSecurityEvent,
  getRecentEvents,
  getSecurityStats,
  detectSuspiciousActivity,
  monitorResourceUsage,
  generateAlert,
  monitoringMiddleware,
  cleanupOldEvents
};