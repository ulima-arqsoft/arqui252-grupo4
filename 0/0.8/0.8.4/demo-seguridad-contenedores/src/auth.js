const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

// SEGURIDAD: JWT Secret desde variable de entorno
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn(' ADVERTENCIA: Usando JWT_SECRET por defecto. Configure JWT_SECRET en producción.');
  return 'default-secret-change-in-production';
})();

const JWT_EXPIRES_IN = '24h';

/**
 * Middleware de autenticación JWT
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    
    req.user = user;
    next();
  });
}

/**
 * Registrar nuevo usuario
 */
async function register(username, email, password) {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await db.get(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // SEGURIDAD: Hash del password con bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const result = await db.run(
      `INSERT INTO users (username, email, password, role) 
       VALUES (?, ?, ?, 'user')`,
      [username, email, hashedPassword]
    );

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: result.lastID, 
        email: email,
        username: username,
        role: 'user'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      message: 'Usuario registrado exitosamente',
      token: token,
      user: {
        id: result.lastID,
        username: username,
        email: email,
        role: 'user'
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Login de usuario
 */
async function login(email, password) {
  try {
    // Buscar usuario
    const user = await db.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // SEGURIDAD: Comparar password hasheado
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Actualizar último login
    await db.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    return {
      message: 'Login exitoso',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  authenticateToken,
  register,
  login
};