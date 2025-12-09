const path = require('path');
const db = require(path.join(process.cwd(), 'config/dbConfig'));

module.exports = async function maestroMiddleware(req, res, next) {
  try {
    const userId = req.user.id;
    
    console.log('🔍 maestroMiddleware: Verificando usuario ID:', userId);
    
    // CORRECCIÓN: Tabla 'administradores' y columna 'rol'
    const [admin] = await db.query(
      'SELECT rol FROM administradores WHERE id = ?',
      [userId]
    );
    
    if (admin.length) {
      const userRol = (admin[0].rol || '').toLowerCase();
      console.log('🔍 Rol en base de datos:', admin[0].rol, '-> Normalizado:', userRol);
      
      // Permitir 'superadmin' también (en minúsculas para comparar)
      if (userRol === 'maestro' || userRol === 'admin' || userRol === 'superadmin') {
        console.log('✅ Usuario tiene acceso (maestro/admin/superadmin)');
        return next();
      }
    }
    
    // Si no está en administradores, buscar en usuarios
    const [usuario] = await db.query(
      'SELECT rol FROM usuarios WHERE id = ?',
      [userId]
    );
    
    if (usuario.length) {
      const userRol = (usuario[0].rol || '').toLowerCase();
      if (userRol === 'maestro') {
        console.log('✅ Usuario es maestro (usuarios)');
        return next();
      }
    }
    
    console.log('❌ Usuario no tiene rol de maestro o admin');
    console.log('❌ Admin encontrado:', admin);
    console.log('❌ Usuario encontrado:', usuario);
    
    return res.status(403).json({
      ok: false,
      error: 'Acceso denegado. Solo para maestros o administradores.'
    });
    
  } catch (error) {
    console.error('Error en middleware de maestro:', error);
    res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
};