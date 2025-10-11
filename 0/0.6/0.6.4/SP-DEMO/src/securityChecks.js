// securityChecks.js
// Función de validación de seguridad para arrancar el servicio.

const PAYMENT_GATEWAY_SECRET = process.env.PAYMENT_GATEWAY_SECRET;

/**
 * [DSA] Implementa el chequeo de Falla Segura. 
 * El proceso se termina (exit 1) si la clave es insegura.
 */
function failSecurelyCheck() {
    console.log("--- Verificación de Desarrollo Seguro de Aplicaciones (DSA) ---");

    if (!PAYMENT_GATEWAY_SECRET) {
        console.error("ERROR CRÍTICO: PAYMENT_GATEWAY_SECRET no está definido. Terminando.");
        process.exit(1); 
    }

    if (PAYMENT_GATEWAY_SECRET.length < 25) {
        console.error(`ERROR CRÍTICO: La clave es demasiado corta (${PAYMENT_GATEWAY_SECRET.length}). Se requiere un mínimo de 25.`);
        process.exit(1);
    }
    
    const lastFour = PAYMENT_GATEWAY_SECRET.slice(-4);
    console.log(`EXITOSO: Clave cargada y verificada. Longitud: ${PAYMENT_GATEWAY_SECRET.length}. Terminación: ****${lastFour}`);
    console.log("---------------------------------------------------------");
}

module.exports = {
    failSecurelyCheck
};