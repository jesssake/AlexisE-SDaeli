const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        ok: false,
        error: 'Acceso denegado. No hay token proporcionado.'
      });
    }
    
    // USAR LA CLAVE CORRECTA
    const JWT_SECRET = 'clave_secreta_local';
    
    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      error: 'Token inválido o expirado.'
    });
  }
};