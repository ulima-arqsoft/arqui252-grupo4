const { initDatabase, run, close } = require('../src/database');
const { generateAllData } = require('./generateData');

/**
 * Poblar la base de datos con datos de prueba
 */
async function seedDatabase() {
  try {
    console.log(' Iniciando seed de base de datos...\n');
    
    // Inicializar base de datos
    await initDatabase();
    console.log(' Base de datos inicializada\n');
    
    // Generar datos
    const data = generateAllData();
    console.log(' Datos generados:');
    console.log(`  - ${data.users.length} usuarios`);
    console.log(`  - ${data.products.length} productos`);
    console.log(`  - ${data.purchases.length} compras\n`);
    
    // Limpiar datos existentes
    console.log(' Limpiando datos existentes...');
    await run('DELETE FROM purchases');
    await run('DELETE FROM products');
    await run('DELETE FROM users');
    console.log(' Datos limpiados\n');
    
    // Insertar usuarios
    console.log(' Insertando usuarios...');
    for (const user of data.users) {
      await run(
        `INSERT INTO users (username, email, password, role) 
         VALUES (?, ?, ?, ?)`,
        [user.username, user.email, user.password, user.role]
      );
    }
    console.log(` ${data.users.length} usuarios insertados\n`);
    
    // Insertar productos
    console.log(' Insertando productos...');
    for (const product of data.products) {
      await run(
        `INSERT INTO products (name, description, price, stock, category, available) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          product.name,
          product.description,
          product.price,
          product.stock,
          product.category,
          product.available ? 1 : 0
        ]
      );
    }
    console.log(` ${data.products.length} productos insertados\n`);
    
    // Insertar compras
    console.log(' Insertando compras...');
    for (const purchase of data.purchases) {
      await run(
        `INSERT INTO purchases (user_id, product_id, quantity, total, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          purchase.user_id,
          purchase.product_id,
          purchase.quantity,
          purchase.total,
          purchase.status
        ]
      );
    }
    console.log(` ${data.purchases.length} compras insertadas\n`);
    
    // Mostrar usuarios de prueba
    console.log('═══════════════════════════════════════════');
    console.log(' USUARIOS DE PRUEBA CREADOS:');
    console.log('═══════════════════════════════════════════');
    console.log('Usuario Admin:');
    console.log('  Email: admin@ejemplo.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('Usuarios normales:');
    for (let i = 1; i <= 3; i++) {
      console.log(`  Email: usuario${i}@ejemplo.com`);
      console.log(`  Password: password123`);
    }
    console.log('═══════════════════════════════════════════\n');
    
    console.log(' Seed completado exitosamente!');
    
  } catch (error) {
    console.error(' Error en seed:', error);
    process.exit(1);
  } finally {
    await close();
  }
}

// Ejecutar seed
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };