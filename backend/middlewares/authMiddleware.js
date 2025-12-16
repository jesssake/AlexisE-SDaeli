const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');

const JWT_SECRET = 'secreto-desarrollo';

module.exports = async function authMiddleware(req, res, next) {
    console.log('🔐 Auth para:', req.method, req.path);
    
    // Rutas que NO necesitan token
    if (req.path === '/test-publico' || req.path === '/health') {
        return next();
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ ok: false, error: 'Token requerido' });
    }
    
    const token = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const [usuarios] = await db.query(
            `SELECT id, email, rol, admin_nombre, tutor_nombre, nino_nombre 
             FROM usuarios WHERE id = ?`,
            [decoded.id]
        );
        
        if (!usuarios.length) {
            return res.status(401).json({ ok: false, error: 'Usuario no existe' });
        }
        
        const usuario = usuarios[0];
        req.user = {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
            nombre: usuario.admin_nombre || usuario.tutor_nombre || usuario.nino_nombre || 'Usuario'
        };
        
        console.log('✅ Auth OK:', req.user.id, req.user.rol);
        next();
        
    } catch (error) {
        console.log('❌ Auth error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ ok: false, error: 'Token inválido' });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ ok: false, error: 'Token expirado' });
        }
        
        res.status(500).json({ ok: false, error: 'Error de auth' });
    }
};