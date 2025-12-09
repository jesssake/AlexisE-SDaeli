// backend/controllers/login/loginController.js
const pool = require('../../config/dbConfig');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_local';

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Faltan datos.' });
    }

    // 1️⃣ Buscar en usuarios (tutores)
    let [rows] = await pool.query(
      'SELECT id, tutor_nombre as nombre, tutor_email as email, tutor_password as password, nino_nombre FROM usuarios WHERE tutor_email = ? LIMIT 1',
      [email]
    );

    let user = null;
    let rol = null;

    if (rows && rows.length > 0) {
      user = rows[0];
      rol = 'TUTOR';  // Asignamos siempre 'TUTOR'
    } else {
      // 2️⃣ Si no lo encuentra, buscar en administradores
      [rows] = await pool.query(
        'SELECT id, admin_nombre as nombre, admin_email as email, admin_password as password FROM administradores WHERE admin_email = ? LIMIT 1',
        [email]
      );

      if (rows && rows.length > 0) {
        user = rows[0];
        rol = 'ADMIN'; // Asignamos siempre 'ADMIN'
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
    }

    // 3️⃣ Validar contraseña
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

    // 4️⃣ Generar JWT
    const token = jwt.sign(
      { id: user.id, rol: rol, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5️⃣ Preparar respuesta
    const usuario = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: rol,
      nino_nombre: user.nino_nombre || null
    };

    return res.json({ success: true, message: 'Login exitoso', user: usuario, token });

  } catch (error) {
    console.error('💥 Error en loginController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
}

module.exports = { login };
