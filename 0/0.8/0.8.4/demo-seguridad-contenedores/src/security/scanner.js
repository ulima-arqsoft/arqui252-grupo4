/**
 * Scanner de Seguridad
 * Simula el escaneo de vulnerabilidades en el contenedor
 */

/**
 * Escanear vulnerabilidades conocidas
 */
function scanVulnerabilities() {
  const vulnerabilities = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };

  // Verificar si se está ejecutando como root
  const isRoot = process.getuid ? process.getuid() === 0 : false;
  if (isRoot) {
    vulnerabilities.critical.push({
      id: 'VULN-001',
      title: 'Contenedor ejecutándose como root',
      description: 'El contenedor está ejecutándose con UID 0, lo que viola el principio de menor privilegio',
      remediation: 'Configurar USER en Dockerfile o securityContext en Kubernetes',
      cvss: 9.0
    });
  }

  // Verificar variables de entorno sensibles
  const sensitiveEnvVars = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN'];
  const exposedSecrets = Object.keys(process.env).filter(key =>
    sensitiveEnvVars.some(sensitive => key.includes(sensitive))
  );

  if (exposedSecrets.length > 0) {
    vulnerabilities.high.push({
      id: 'VULN-002',
      title: 'Variables de entorno sensibles expuestas',
      description: `Variables encontradas: ${exposedSecrets.join(', ')}`,
      remediation: 'Usar Docker Secrets o Kubernetes Secrets',
      cvss: 7.5
    });
  }

  // Verificar JWT_SECRET débil
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    vulnerabilities.medium.push({
      id: 'VULN-003',
      title: 'JWT Secret débil',
      description: 'El JWT secret es demasiado corto o predecible',
      remediation: 'Usar un secret de al menos 32 caracteres aleatorios',
      cvss: 5.5
    });
  }

  return {
    timestamp: new Date().toISOString(),
    totalVulnerabilities: 
      vulnerabilities.critical.length +
      vulnerabilities.high.length +
      vulnerabilities.medium.length +
      vulnerabilities.low.length,
    summary: {
      critical: vulnerabilities.critical.length,
      high: vulnerabilities.high.length,
      medium: vulnerabilities.medium.length,
      low: vulnerabilities.low.length
    },
    vulnerabilities
  };
}

/**
 * Escanear configuración del contenedor
 */
function scanContainerConfig() {
  const config = {
    user: process.env.USER || 'unknown',
    uid: process.getuid ? process.getuid() : 'N/A',
    gid: process.getgid ? process.getgid() : 'N/A',
    platform: process.platform,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  };

  const findings = [];

  // Verificar usuario
  if (config.uid === 0) {
    findings.push({
      severity: 'critical',
      message: 'Ejecutándose como root (UID 0)',
      status: 'fail'
    });
  } else {
    findings.push({
      severity: 'info',
      message: `Ejecutándose como usuario no privilegiado (UID ${config.uid})`,
      status: 'pass'
    });
  }

  // Verificar entorno
  if (config.environment !== 'production') {
    findings.push({
      severity: 'low',
      message: 'No está en modo producción',
      status: 'warning'
    });
  }

  return {
    config,
    findings,
    status: findings.some(f => f.status === 'fail') ? 'vulnerable' : 'secure'
  };
}

/**
 * Escanear dependencias (simulado)
 */
function scanDependencies() {
  const packageJson = require('../../../package.json');
  const dependencies = Object.keys(packageJson.dependencies || {});
  
  // Simulación de vulnerabilidades conocidas
  const knownVulnerabilities = {
    'express': [
      {
        version: '< 4.17.3',
        severity: 'medium',
        description: 'Open redirect vulnerability'
      }
    ]
  };

  const vulnerabilities = [];
  
  dependencies.forEach(dep => {
    if (knownVulnerabilities[dep]) {
      vulnerabilities.push({
        package: dep,
        vulnerabilities: knownVulnerabilities[dep]
      });
    }
  });

  return {
    totalDependencies: dependencies.length,
    vulnerableDependencies: vulnerabilities.length,
    vulnerabilities
  };
}

/**
 * Realizar escaneo completo
 */
function fullScan() {
  const startTime = Date.now();

  const results = {
    timestamp: new Date().toISOString(),
    scanDuration: 0,
    vulnerabilityScan: scanVulnerabilities(),
    containerConfig: scanContainerConfig(),
    dependencyScan: scanDependencies()
  };

  results.scanDuration = Date.now() - startTime;

  // Calcular score general
  const criticalCount = results.vulnerabilityScan.summary.critical;
  const highCount = results.vulnerabilityScan.summary.high;
  
  let score = 100;
  score -= criticalCount * 25;
  score -= highCount * 10;
  score -= results.vulnerabilityScan.summary.medium * 5;
  score = Math.max(0, score);

  results.securityScore = {
    score: score,
    grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F',
    status: score >= 75 ? 'secure' : score >= 50 ? 'warning' : 'critical'
  };

  return results;
}

/**
 * Generar reporte de seguridad en formato legible
 */
function generateReport(scanResults) {
  const lines = [];
  
  lines.push('╔════════════════════════════════════════════════════════╗');
  lines.push('║         REPORTE DE SEGURIDAD DEL CONTENEDOR           ║');
  lines.push('╠════════════════════════════════════════════════════════╣');
  lines.push(`║ Fecha: ${scanResults.timestamp.padEnd(40)} ║`);
  lines.push(`║ Duración: ${scanResults.scanDuration}ms${' '.repeat(40 - String(scanResults.scanDuration).length - 2)} ║`);
  lines.push('╠════════════════════════════════════════════════════════╣');
  lines.push(`║ SECURITY SCORE: ${scanResults.securityScore.score}/100 (${scanResults.securityScore.grade})${' '.repeat(25)} ║`);
  lines.push('╠════════════════════════════════════════════════════════╣');
  lines.push('║ VULNERABILIDADES:                                      ║');
  lines.push(`║   Critical: ${scanResults.vulnerabilityScan.summary.critical}${' '.repeat(44)} ║`);
  lines.push(`║   High:     ${scanResults.vulnerabilityScan.summary.high}${' '.repeat(44)} ║`);
  lines.push(`║   Medium:   ${scanResults.vulnerabilityScan.summary.medium}${' '.repeat(44)} ║`);
  lines.push(`║   Low:      ${scanResults.vulnerabilityScan.summary.low}${' '.repeat(44)} ║`);
  lines.push('╠════════════════════════════════════════════════════════╣');
  lines.push(`║ ESTADO: ${scanResults.securityScore.status.toUpperCase().padEnd(48)} ║`);
  lines.push('╚════════════════════════════════════════════════════════╝');
  
  return lines.join('\n');
}

module.exports = {
  scanVulnerabilities,
  scanContainerConfig,
  scanDependencies,
  fullScan,
  generateReport
};