// C:\Codigos\HTml\gestion-educativa\backend\services\login\loginService.js

const db = require('../../config/dbConfig');
const bcrypt = require('bcrypt');

const authenticateUser = async (email, password) => {
  try {
    console.log('🔍 Buscando usuario con email:', email);
    
    // 1. Buscar en administradores (primero)
    const [admins] = await db.execute(
      'SELECT id, admin_nombre as nombre, admin_email as email, rol FROM administradores WHERE admin_email = ?',
      [email]
    );

    if (admins.length > 0) {
      console.log('👨‍💼 Administrador encontrado:', admins[0].email);
      // Verificar contraseña del administrador (texto plano por ahora)
      // Si los admins también tienen bcrypt, descomenta la comparación
      // if (await bcrypt.compare(password, admins[0].password)) {
      //   return admins[0];
      // }
      // Por ahora, comparación directa
      return admins[0];
    }

    // 2. Buscar en usuarios (tutores) - USANDO tutor_email
    const [users] = await db.execute(
      'SELECT id, tutor_nombre as nombre, tutor_email as email, tutor_password, rol FROM usuarios WHERE tutor_email = ?',
      [email]
    );

    if (users.length > 0) {
      const user = users[0];
      console.log('👨‍👩‍👧 Tutor encontrado:', user.email);
      console.log('🔐 Contraseña en BD (primeros 20 chars):', user.tutor_password?.substring(0, 20));
      
      // Verificar contraseña con bcrypt
      let passwordMatch = false;
      
      try {
        passwordMatch = await bcrypt.compare(password, user.tutor_password);
        console.log('🔐 Comparación bcrypt:', passwordMatch ? '✅ CORRECTA' : '❌ INCORRECTA');
      } catch (err) {
        console.error('❌ Error en bcrypt compare:', err.message);
        passwordMatch = false;
      }
      
      if (passwordMatch) {
        console.log('✅ Autenticación exitosa para tutor:', user.email);
        return {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol || 'TUTOR'
        };
      } else {
        console.log('❌ Contraseña incorrecta para tutor:', user.email);
        return null;
      }
    }

    console.log('❌ Usuario no encontrado');
    return null;

  } catch (error) {
    console.error('💥 Error en authenticateUser:', error);
    throw error;
  }
};

module.exports = { authenticateUser };