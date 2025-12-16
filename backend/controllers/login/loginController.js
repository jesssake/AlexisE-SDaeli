// backend/controllers/login/loginController.js
const pool = require('../../config/dbConfig');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_local';

async function login(req, res) {
  try {
    const { email, password } = req.body;
    console.log('🔐 Intento de login para:', email);
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Faltan datos.' });
    }

    // 1️⃣ Buscar en usuarios (tutores/potenciales administradores)
    let [rows] = await pool.query(
      `SELECT 
        id, 
        tutor_nombre as nombre, 
        tutor_email as email, 
        tutor_password as password, 
        nino_nombre,
        rol,  -- IMPORTANTE: Leer el rol de la BD
        tutor_telefono,
        nino_condiciones,
        fecha_nacimiento
      FROM usuarios WHERE tutor_email = ? LIMIT 1`,
      [email]
    );

    let user = null;
    let rol = null;

    if (rows && rows.length > 0) {
      user = rows[0];
      // Usar el rol de la base de datos, o por defecto 'TUTOR'
      rol = user.rol || 'TUTOR';
      console.log(`✅ Usuario encontrado en tabla usuarios, rol: ${rol}`);
    } else {
      // 2️⃣ Si no lo encuentra, buscar en administradores
      [rows] = await pool.query(
        `SELECT 
          id, 
          admin_nombre as nombre, 
          admin_email as email, 
          admin_password as password,
          rol  -- IMPORTANTE: Leer el rol de la BD
        FROM administradores WHERE admin_email = ? LIMIT 1`,
        [email]
      );

      if (rows && rows.length > 0) {
        user = rows[0];
        // Usar el rol de la base de datos, o por defecto 'ADMIN'
        rol = user.rol || 'ADMIN';
        console.log(`✅ Usuario encontrado en tabla administradores, rol: ${rol}`);
      }
    }

    if (!user) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
    }

    // 3️⃣ Validar contraseña
    if (user.password !== password) {
      console.log('❌ Contraseña incorrecta para:', email);
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

    // 4️⃣ Generar JWT con el rol correcto
    const token = jwt.sign(
      { 
        id: user.id, 
        rol: rol, 
        email: user.email,
        nombre: user.nombre
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5️⃣ Preparar respuesta
    const usuario = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: rol,
      // Propiedades específicas
      ...(user.nino_nombre && { nino_nombre: user.nino_nombre }),
      ...(user.tutor_telefono && { tutor_telefono: user.tutor_telefono }),
      ...(user.nino_condiciones && { nino_condiciones: user.nino_condiciones }),
      ...(user.fecha_nacimiento && { fecha_nacimiento: user.fecha_nacimiento }),
      // Para distinguir entre tablas
      tipo: rol.includes('ADMIN') ? 'ADMINISTRADOR' : 'TUTOR'
    };

    console.log('✅ Login exitoso para:', {
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre
    });

    return res.json({ 
      success: true, 
      message: 'Login exitoso', 
      user: usuario, 
      token 
    });

  } catch (error) {
    console.error('💥 Error en loginController:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor.',
      error: error.message 
    });
  }
}

module.exports = { login };