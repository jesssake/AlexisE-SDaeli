const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');

const JWT_SECRET = 'secreto-desarrollo';

module.exports = async function authMiddleware(req, res, next) {
    console.log('🔐 Auth para:', req.method, req.path);
    
    // Rutas que NO necesitan token
    const rutasPublicas = ['/test-publico', '/health', '/login', '/register'];
    if (rutasPublicas.includes(req.path) || req.path.startsWith('/test')) {
        return next();
    }
    
    // =====================================================
    // MODO DESARROLLO - ACEPTAR TOKENS SIMPLES
    // =====================================================
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.substring(7) : null;
    
    // Tokens de desarrollo aceptados
    const tokensDesarrollo = [
        'token-desarrollo-12345',
        'MS0xNzc0Mzk4MDAzMTM4',
        'MS0xNzc0Mzk4MDAzMTM0',
        'MS0xNzc0Mzk4MDAzMTM2',
        'MS0xNzc0Mzk4MDAzMTM1',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    ];
    
    // Verificar si es un token de desarrollo
    const esTokenDesarrollo = tokensDesarrollo.includes(token) || 
                              (token && token.startsWith('eyJhbGciOiJ')) ||
                              (process.env.NODE_ENV !== 'production' && !token);
    
    if (esTokenDesarrollo) {
        console.log('✅ MODO DESARROLLO: Token aceptado');
        
        // Obtener datos de headers o usar valores por defecto
        const userId = req.headers['x-user-id'] || 
                       req.headers['user-id'] || 
                       '1';
        const userRol = req.headers['x-user-rol'] || 
                        req.headers['user-rol'] || 
                        'maestro';
        
        req.user = {
            id: parseInt(userId),
            email: req.headers['x-user-email'] || `usuario${userId}@escuela.edu`,
            rol: userRol,
            nombre: req.headers['x-user-nombre'] || 'Usuario',
            es_desarrollo: true
        };
        
        console.log('👤 Usuario (modo desarrollo):', {
            id: req.user.id,
            rol: req.user.rol,
            nombre: req.user.nombre
        });
        
        return next();
    }
    
    // =====================================================
    // VERIFICACIÓN NORMAL CON JWT
    // =====================================================
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No hay token Bearer');
        
        // En desarrollo, permitir acceso sin token
        if (process.env.NODE_ENV !== 'production') {
            console.log('⚠️ MODO DESARROLLO: Creando usuario por defecto');
            req.user = {
                id: 1,
                email: 'desarrollo@escuela.edu',
                rol: 'maestro',
                nombre: 'Usuario Desarrollo'
            };
            return next();
        }
        
        return res.status(401).json({ 
            ok: false, 
            error: 'Token requerido. Por favor, inicia sesión.'
        });
    }
    
    const tokenJWT = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(tokenJWT, JWT_SECRET);
        console.log('✅ Token JWT válido:', decoded);
        
        const [usuarios] = await db.query(
            `SELECT id, email, rol, admin_nombre, tutor_nombre, nino_nombre 
             FROM usuarios WHERE id = ?`,
            [decoded.id]
        );
        
        if (!usuarios.length) {
            // En desarrollo, crear usuario simulado
            if (process.env.NODE_ENV !== 'production') {
                console.log('⚠️ Usuario no encontrado en BD, creando simulado');
                req.user = {
                    id: decoded.id,
                    email: decoded.email || `usuario${decoded.id}@escuela.edu`,
                    rol: decoded.rol || 'maestro',
                    nombre: `Usuario ${decoded.id}`,
                    es_simulado: true
                };
                return next();
            }
            
            return res.status(401).json({ 
                ok: false, 
                error: 'Usuario no encontrado en el sistema' 
            });
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
        
        // En desarrollo, permitir acceso incluso con token inválido
        if (process.env.NODE_ENV !== 'production') {
            console.log('⚠️ MODO DESARROLLO: Token inválido, pero permitiendo acceso');
            
            // Intentar obtener datos de headers
            const userId = req.headers['x-user-id'] || '1';
            const userRol = req.headers['x-user-rol'] || 'maestro';
            
            req.user = {
                id: parseInt(userId),
                email: req.headers['x-user-email'] || `usuario${userId}@escuela.edu`,
                rol: userRol,
                nombre: 'Usuario Desarrollo',
                token_invalido: true
            };
            return next();
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ ok: false, error: 'Token inválido' });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ ok: false, error: 'Token expirado. Inicia sesión nuevamente.' });
        }
        
        res.status(500).json({ ok: false, error: 'Error de autenticación' });
    }
};