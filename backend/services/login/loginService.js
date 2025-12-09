// C:\Codigos\HTml\gestion-educativa\backend\services\login\loginService.js
const db = require('../../config/dbConfig');

exports.authenticateUser = async (email, password) => {
  try {
    console.log('🔍 Buscando usuario con email:', email);
    
    // 1. Buscar en administradores
    const [admins] = await db.execute(
      'SELECT id, admin_nombre as nombre, admin_email as email, rol FROM administradores WHERE admin_email = ? AND admin_password = ?',
      [email, password]
    );

    if (admins.length > 0) {
      console.log('✅ Administrador encontrado:', admins[0].email);
      return admins[0];
    }

    // 2. Buscar en usuarios (tutores)
    const [users] = await db.execute(
      'SELECT id, tutor_nombre as nombre, tutor_email as email, "TUTOR" as rol FROM usuarios WHERE tutor_email = ? AND tutor_password = ?',
      [email, password]
    );

    if (users.length > 0) {
      console.log('✅ Tutor encontrado:', users[0].email);
      return users[0];
    }

    console.log('❌ Usuario no encontrado');
    return null;

  } catch (error) {
    console.error('💥 Error en authenticateUser:', error);
    throw error;
  }
};