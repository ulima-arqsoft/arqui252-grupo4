// src/server.js
const express = require('express');
const app = express();
const path = require('path');

// --- Secrets Management (Obteniendo variables de entorno) ---
const PORT = process.env.PORT || 3000;
// La clave de conexión real (simulada por ahora)
const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING || 'sqlite://dev.db'; 
const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'development') {
    console.warn(`[SECRETS] Usando cadena de conexión por defecto: ${DB_CONNECTION_STRING}`);
} else {
    // Si estuviéramos en K8s, esta variable vendría de un Secret
    console.log('[SECRETS] Usando cadena de conexión de entorno seguro.');
}
// -----------------------------------------------------------

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json()); // Habilitar lectura de JSON en el cuerpo de la solicitud

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Endpoint de la API (simulado)
app.get('/api/products', (req, res) => {
    // Simulación de productos
    const products = [
        { id: 1, name: 'Laptop Segura X', price: 1200.00 },
        { id: 2, name: 'Monitor Firewall Pro', price: 350.00 },
        { id: 3, name: 'Cable Ethernet Blindado', price: 15.00 }
    ];
    res.json(products);
});

// Endpoint vulnerable para demostrar Network Policies (simulado)
// Si esta API estuviera comprometida, intentaría hacer una conexión externa
app.get('/api/attack-test', async (req, res) => {
    console.log("Intentando conexión externa a un servidor malicioso...");
    // Simulamos que el atacante intenta hacer una llamada saliente (EGRESS)
    try {
        // En un escenario real, aquí habría una llamada a 'fetch' o 'axios'
        const externalServer = 'http://external-malicious-server.com/data';
        // Si la Network Policy está activa, esta llamada fallará.
        console.log(`Intento de conexión a: ${externalServer}`);
        res.status(200).send(`Intento de conexión externa registrado. Verifique la Network Policy.`);
    } catch (error) {
        res.status(500).send("Fallo al intentar la conexión externa (¡Bien! La Network Policy podría estar funcionando).");
    }
});


app.listen(PORT, () => {
    console.log(`[INFO] Servidor de compras ejecutándose en http://localhost:${PORT}`);
});