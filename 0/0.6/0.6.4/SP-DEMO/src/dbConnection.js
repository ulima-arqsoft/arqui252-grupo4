// dbConnection.js
// Módulo de conexión a PostgreSQL con auditoría completa

const { Pool } = require('pg');

// Configuración del pool de conexiones
const pool = new Pool({
    host: process.env.DB_HOST || 'payment-db',
    user: process.env.DB_USER || 'safe_user',
    password: process.env.DB_PASSWORD,
    database: 'payments_data',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

/**
 * [DSA] Verifica que la conexión a la base de datos esté activa.
 * Se usa en el health check del servicio.
 * @throws {Error} Si no se puede conectar a la BD
 */
async function checkDatabaseConnection() {
    let client;
    try {
        client = await pool.connect();
        await client.query('SELECT NOW()');
        console.log('✅ Conexión a BD exitosa');
    } catch (error) {
        console.error('❌ Error de conexión a BD:', error.message);
        throw new Error('Database connection failed');
    } finally {
        if (client) client.release();
    }
}

/**
 * [DSA] Inicializa la tabla de logs si no existe.
 * Ejecutar al arrancar el servicio.
 */
async function initializeDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS payment_logs (
            id SERIAL PRIMARY KEY,
            transaction_id VARCHAR(100) UNIQUE NOT NULL,
            user_token VARCHAR(100) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(3) NOT NULL,
            payment_method VARCHAR(20) NOT NULL,
            suspicious_flags TEXT,
            metadata JSONB,
            timestamp TIMESTAMP DEFAULT NOW(),
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_transaction_id ON payment_logs(transaction_id);
        CREATE INDEX IF NOT EXISTS idx_timestamp ON payment_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_user_token ON payment_logs(user_token);
    `;

    try {
        await pool.query(createTableQuery);
        console.log('✅ [BD] Tabla payment_logs inicializada');
    } catch (error) {
        console.error('❌ Error al inicializar BD:', error.message);
        // No lanzamos error para permitir que el servicio arranque sin BD
    }
}

/**
 * [DSA] Registra una transacción en la base de datos.
 * Implementa el principio de Auditoría y Logging.
 */
async function logTransaction(transactionData) {
    const query = `
        INSERT INTO payment_logs (
            transaction_id, 
            user_token, 
            amount, 
            currency,
            payment_method,
            suspicious_flags,
            metadata,
            timestamp
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (transaction_id) DO NOTHING
    `;
    
    try {
        await pool.query(query, [
            transactionData.transactionId,
            transactionData.userToken,
            transactionData.amount,
            transactionData.currency,
            transactionData.paymentMethod,
            transactionData.suspiciousFlags,
            JSON.stringify(transactionData.metadata)
        ]);
        console.log(`📝 [AUDIT] Transacción ${transactionData.transactionId} registrada`);
    } catch (error) {
        console.error('⚠️ Error al registrar transacción:', error.message);
        // No lanzamos error para no afectar la respuesta al cliente
    }
}

/**
 * [DSA] Obtiene estadísticas de transacciones para análisis de fraude.
 * Solo para uso interno/admin.
 */
async function getTransactionStats(userToken, timeWindowMinutes = 60) {
    const query = `
        SELECT 
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount,
            MAX(amount) as max_amount
        FROM payment_logs
        WHERE user_token = $1
          AND timestamp > NOW() - INTERVAL '${timeWindowMinutes} minutes'
    `;

    try {
        const result = await pool.query(query, [userToken]);
        return result.rows[0];
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error.message);
        return null;
    }
}

/**
 * [DSA] Limpia logs antiguos (cumplimiento de retención de datos).
 * Ejecutar periódicamente (ej: cron job).
 */
async function cleanOldLogs(retentionDays = 90) {
    const query = `
        DELETE FROM payment_logs
        WHERE timestamp < NOW() - INTERVAL '${retentionDays} days'
    `;

    try {
        const result = await pool.query(query);
        console.log(`🗑️ [CLEANUP] ${result.rowCount} registros antiguos eliminados`);
        return result.rowCount;
    } catch (error) {
        console.error('Error limpiando logs:', error.message);
        return 0;
    }
}

// Manejador de cierre graceful
process.on('SIGTERM', async () => {
    console.log('🔄 Cerrando conexiones a la BD...');
    await pool.end();
    console.log('✅ Pool de BD cerrado correctamente');
});

module.exports = {
    checkDatabaseConnection,
    initializeDatabase,
    logTransaction,
    getTransactionStats,
    cleanOldLogs,
    pool
};