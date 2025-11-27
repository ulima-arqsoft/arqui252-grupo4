// src/app.js

document.addEventListener('DOMContentLoaded', fetchProducts);

/**
 * Carga los productos desde el endpoint del backend y los renderiza.
 */
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        const list = document.getElementById('product-list');
        list.innerHTML = ''; // Limpiar la lista
        
        products.forEach(p => {
            const item = document.createElement('li');
            item.textContent = `${p.name} - $${p.price.toFixed(2)}`;
            list.appendChild(item);
        });
    } catch (error) {
        console.error("Error al cargar productos:", error);
        document.getElementById('product-list').innerHTML = '<p style="color: red;">Error al conectar con la API del backend.</p>';
    }
}

/**
 * Función para probar la Network Policy (conexión saliente bloqueada).
 * Nota: Esta función es llamada directamente desde un botón en index.html,
 * pero es mejor tener la lógica aquí.
 */
async function testAttack() {
    const statusElement = document.getElementById('attack-status');
    statusElement.textContent = 'Iniciando prueba de conexión externa...';

    try {
        const response = await fetch('/api/attack-test');
        const result = await response.text();
        statusElement.textContent = `Resultado del Test: ${result}`;
        
        // Si el código de estado es 500 (o si la red falla), es probable que K8s o la política haya bloqueado el intento.
        if (response.status === 500) {
             statusElement.style.color = 'green';
             statusElement.textContent += " (¡Bloqueo Exitoso de Egress!)";
        } else {
             statusElement.style.color = 'red';
             statusElement.textContent += " (¡Conexión Externa Exitosa! La Network Policy falló o no está aplicada.)";
        }
    } catch (error) {
        // Un error de red aquí es una buena señal en K8s con Network Policy
        statusElement.textContent = `Error de red al intentar la prueba. Esto puede indicar que la Network Policy está bloqueando la solicitud.`;
        statusElement.style.color = 'green';
    }
}

// Para que la función testAttack sea accesible globalmente desde index.html
window.testAttack = testAttack;