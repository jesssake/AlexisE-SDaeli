const db = require('../../config/dbConfig');

exports.authenticateUser = (email, password) => {
  return new Promise((resolve, reject) => {
    // Primero buscar en usuarios
    const userQuery = 'SELECT id, tutor_nombre as nombre, tutor_email as email, rol FROM usuarios WHERE tutor_email = ? AND tutor_password = ?';
    
    // También buscar en administradores
    const adminQuery = 'SELECT id, admin_nombre as nombre, admin_email as email, rol FROM administradores WHERE admin_email = ? AND admin_password = ?';

    console.log('🔍 Buscando usuario:', email);

    // Buscar en usuarios primero
    db.query(userQuery, [email, password], (err, userResults) => {
      if (err) {
        console.error('❌ Error en consulta usuarios:', err);
        reject(err);
        return;
      }

      if (userResults.length > 0) {
        console.log('✅ Usuario tutor encontrado:', userResults[0].email);
        resolve(userResults[0]);
      } else {
        // Si no está en usuarios, buscar en administradores
        db.query(adminQuery, [email, password], (err, adminResults) => {
          if (err) {
            console.error('❌ Error en consulta administradores:', err);
            reject(err);
            return;
          }

          if (adminResults.length > 0) {
            console.log('✅ Administrador encontrado:', adminResults[0].email);
            resolve(adminResults[0]);
          } else {
            console.log('❌ Usuario no encontrado en ninguna tabla');
            resolve(null);
          }
        });
      }
    });
  });
};
