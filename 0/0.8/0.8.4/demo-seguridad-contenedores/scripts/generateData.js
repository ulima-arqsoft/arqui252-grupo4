const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * Generar usuarios de prueba
 */
function generateUsers(count = 5) {
  const users = [];
  const roles = ['user', 'admin', 'moderator'];
  
  for (let i = 1; i <= count; i++) {
    users.push({
      username: `usuario${i}`,
      email: `usuario${i}@ejemplo.com`,
      password: bcrypt.hashSync('password123', 10),
      role: roles[i % roles.length]
    });
  }
  
  // Usuario admin por defecto
  users.push({
    username: 'admin',
    email: 'admin@ejemplo.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin'
  });
  
  return users;
}

/**
 * Generar productos de prueba
 */
function generateProducts(count = 20) {
  const categories = ['Electrónica', 'Ropa', 'Hogar', 'Deportes', 'Libros', 'Juguetes'];
  const adjectives = ['Premium', 'Económico', 'Deluxe', 'Básico', 'Pro'];
  const products = [
    'Laptop', 'Teclado', 'Mouse', 'Monitor', 'Auriculares',
    'Camiseta', 'Pantalón', 'Zapatos', 'Chaqueta', 'Gorra',
    'Silla', 'Mesa', 'Lámpara', 'Alfombra', 'Espejo',
    'Balón', 'Raqueta', 'Bicicleta', 'Pesas', 'Colchoneta',
    'Novela', 'Manual', 'Cómic', 'Revista', 'Diccionario',
    'Muñeca', 'Carro', 'Puzzle', 'Peluche', 'Robot'
  ];
  
  const result = [];
  
  for (let i = 0; i < count; i++) {
    const productName = products[i % products.length];
    const adjective = adjectives[i % adjectives.length];
    const category = categories[i % categories.length];
    
    result.push({
      name: `${adjective} ${productName}`,
      description: `Descripción detallada del ${productName.toLowerCase()} de categoría ${category}`,
      price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
      stock: Math.floor(Math.random() * 100) + 10,
      category: category,
      available: Math.random() > 0.1 // 90% disponibles
    });
  }
  
  return result;
}

/**
 * Generar compras de prueba
 */
function generatePurchases(userCount = 5, productCount = 20, purchaseCount = 30) {
  const purchases = [];
  const statuses = ['pending', 'processing', 'completed', 'cancelled'];
  
  for (let i = 0; i < purchaseCount; i++) {
    const userId = Math.floor(Math.random() * userCount) + 1;
    const productId = Math.floor(Math.random() * productCount) + 1;
    const quantity = Math.floor(Math.random() * 5) + 1;
    const price = parseFloat((Math.random() * 500 + 10).toFixed(2));
    
    purchases.push({
      user_id: userId,
      product_id: productId,
      quantity: quantity,
      total: parseFloat((price * quantity).toFixed(2)),
      status: statuses[Math.floor(Math.random() * statuses.length)]
    });
  }
  
  return purchases;
}

/**
 * Generar todos los datos
 */
function generateAllData() {
  const users = generateUsers(10);
  const products = generateProducts(50);
  const purchases = generatePurchases(users.length, products.length, 100);
  
  return {
    users,
    products,
    purchases,
    metadata: {
      generatedAt: new Date().toISOString(),
      counts: {
        users: users.length,
        products: products.length,
        purchases: purchases.length
      }
    }
  };
}

// Si se ejecuta directamente
if (require.main === module) {
  const data = generateAllData();
  console.log(JSON.stringify(data, null, 2));
}

module.exports = {
  generateUsers,
  generateProducts,
  generatePurchases,
  generateAllData
};