// rateLimiter.js
// Rate Limiter mejorado con limpieza automática.

const requestCounts = new Map();
const MAX_REQUESTS_PER_MINUTE = 5;
const WINDOW_MS = 60 * 1000; // 1 minuto

/**
 * [DSA] Limpieza automática de entradas antiguas.
 * Previene memory leaks en el Map.
 */
function cleanOldEntries() {
  const now = Date.now();
  requestCounts.forEach((timestamps, key) => {
    const validTimestamps = timestamps.filter(time => time > now - WINDOW_MS);
    if (validTimestamps.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, validTimestamps);
    }
  });
}

/**
 * Middleware de Rate Limiting.
 * @param {string} clientIdentifier - IP del cliente
 * @returns {boolean} - true si permite, false si bloquea
 */
function rateLimit(clientIdentifier) {
  cleanOldEntries();

  const currentRequests = requestCounts.get(clientIdentifier) || [];

  if (currentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    console.warn(`🚫 [RATE LIMIT] IP bloqueada: ${clientIdentifier}`);
    return false;
  }

  currentRequests.push(Date.now());
  requestCounts.set(clientIdentifier, currentRequests);
  
  const remaining = MAX_REQUESTS_PER_MINUTE - currentRequests.length;
  console.log(`✅ [RATE LIMIT] IP: ${clientIdentifier}, Restantes: ${remaining}`);
  return true;
}

module.exports = {
  rateLimit,
  MAX_REQUESTS_PER_MINUTE
};