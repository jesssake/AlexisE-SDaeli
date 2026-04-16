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

    // 1️⃣ Buscar en usuarios (tutores)
    let [rows] = await pool.query(
      `SELECT 
        id, 
        tutor_nombre as nombre, 
        tutor_email as email, 
        tutor_password as password, 
        nino_nombre,
        rol,
        tutor_telefono,
        nino_condiciones,
        fecha_nacimiento
      FROM usuarios WHERE tutor_email = ? LIMIT 1`,
      [email]
    );

    let user = null;
    let tipo = 'TUTOR'; // Por defecto

    if (rows && rows.length > 0) {
      user = rows[0];
      console.log(`✅ Usuario encontrado en tabla usuarios`);
    } else {
      // 2️⃣ Buscar en administradores (maestros, admins, etc.)
      [rows] = await pool.query(
        `SELECT 
          id, 
          admin_nombre as nombre, 
          admin_email as email, 
          admin_password as password,
          rol
        FROM administradores WHERE admin_email = ? LIMIT 1`,
        [email]
      );

      if (rows && rows.length > 0) {
        user = rows[0];
        console.log(`✅ Usuario encontrado en tabla administradores, rol: ${user.rol}`);
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

    // 4️⃣ Determinar tipo según la tabla de origen
    // Si viene de administradores, es personal escolar (maestro/admin)
    // Si viene de usuarios, es tutor/padre
    const esPersonalEscolar = email.includes('@escuela') || 
                             email.includes('@gestion') || 
                             user.rol === 'maestro' ||
                             user.rol === 'admin' ||
                             user.rol === 'superadmin';
    
    tipo = esPersonalEscolar ? 'ADMINISTRADOR' : 'TUTOR';
    
    // También podemos usar el rol directamente
    if (user.rol === 'maestro') {
      tipo = 'MAESTRO';
    }

    // 5️⃣ Generar JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        rol: user.rol || (esPersonalEscolar ? 'MAESTRO' : 'TUTOR'),
        email: user.email,
        nombre: user.nombre
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 6️⃣ Preparar respuesta
    const usuario = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol || (esPersonalEscolar ? 'MAESTRO' : 'TUTOR'),
      tipo: tipo,
      // Propiedades específicas
      ...(user.nino_nombre && { nino_nombre: user.nino_nombre }),
      ...(user.tutor_telefono && { tutor_telefono: user.tutor_telefono }),
      ...(user.nino_condiciones && { nino_condiciones: user.nino_condiciones }),
      ...(user.fecha_nacimiento && { fecha_nacimiento: user.fecha_nacimiento })
    };

    console.log('✅ Login exitoso para:', {
      email: usuario.email,
      rol: usuario.rol,
      tipo: usuario.tipo,
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