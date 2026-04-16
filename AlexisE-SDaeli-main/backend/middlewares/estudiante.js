const path = require('path');
const db = require(path.join(process.cwd(), 'config/dbConfig'));

/**
 * Middleware para verificar que el usuario es un estudiante
 * Este middleware se ejecuta después del authMiddleware
 */
module.exports = function estudianteMiddleware(req, res, next) {
    console.log('🔍 Middleware estudiante: Verificando rol...');
    
    const esDesarrollo = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    
    try {
        // 1. Verificar que hay usuario autenticado
        if (!req.user) {
            console.log('❌ No hay usuario en la request');
            
            if (esDesarrollo) {
                console.log('🧪 MODO DESARROLLO: Creando usuario estudiante simulado');
                req.user = {
                    id: 1,
                    rol: 'estudiante',
                    nombre: 'Estudiante Demo',
                    email: 'demo@escuela.edu',
                    es_demo: true
                };
                return next();
            }
            
            return res.status(401).json({
                ok: false,
                error: 'No autenticado. Inicia sesión primero.'
            });
        }
        
        console.log('👤 Usuario en request:', {
            id: req.user.id,
            rol: req.user.rol,
            nombre: req.user.nombre || 'Sin nombre'
        });
        
        // 2. MODO DESARROLLO: Validación relajada
        if (esDesarrollo) {
            console.log('🧪 MODO DESARROLLO: Validación de rol relajada');
            
            // PERMITIR: maestro, admin, tutor, estudiante
            if (req.user.rol === 'maestro' || req.user.rol === 'admin' || req.user.rol === 'tutor') {
                console.log(`🎓 ${req.user.rol} accediendo a sección estudiante (permitido)`);
                return next();
            }
            
            // Si el usuario ya es estudiante, permitir
            if (req.user.rol === 'estudiante') {
                console.log('✅ Usuario es estudiante, acceso permitido');
                return next();
            }
            
            // Si no tiene rol, asignar estudiante por defecto
            if (!req.user.rol) {
                console.log('⚠️ Usuario sin rol, asignando "estudiante" en desarrollo');
                req.user.rol = 'estudiante';
                return next();
            }
            
            // Si tiene otro rol, permitir igual (modo desarrollo)
            console.log(`⚠️ Usuario con rol '${req.user.rol}', permitiendo acceso en desarrollo`);
            return next();
        }
        
        // 3. MODO PRODUCCIÓN: Validación estricta
        if (!req.user.rol) {
            return res.status(403).json({
                ok: false,
                error: 'Tu cuenta no tiene un rol asignado. Contacta al administrador.'
            });
        }
        
        // En producción, permitir estudiantes Y tutores
        if (req.user.rol !== 'estudiante' && req.user.rol !== 'tutor') {
            return res.status(403).json({
                ok: false,
                error: 'Acceso restringido. Solo estudiantes y tutores pueden acceder a esta sección.',
                user_rol: req.user.rol,
                required_rol: 'estudiante o tutor'
            });
        }
        
        console.log(`✅ Validación de rol exitosa: ${req.user.rol}`);
        next();
        
    } catch (error) {
        console.error('💥 Error en middleware estudiante:', error);
        
        if (esDesarrollo) {
            console.log('🧪 Error en middleware, pero permitiendo acceso en desarrollo');
            return next();
        }
        
        res.status(500).json({
            ok: false,
            error: 'Error interno al verificar permisos'
        });
    }
};

/**
 * Middleware alternativo para desarrollo rápido
 */
module.exports.desarrolloSimple = function desarrolloSimpleMiddleware(req, res, next) {
    console.log('⚡ Middleware estudiante (modo desarrollo simple)');
    
    if (!req.user) {
        req.user = {
            id: 1,
            rol: 'estudiante',
            nombre: 'Estudiante Demo',
            email: 'demo@escuela.edu',
            es_demo: true
        };
    }
    
    if (!req.user.rol) {
        req.user.rol = 'estudiante';
    }
    
    console.log('✅ Acceso permitido en modo desarrollo');
    next();
};

/**
 * Función para verificar si un usuario puede acceder como estudiante
 */
module.exports.esEstudiante = function(user) {
    if (!user || !user.rol) return false;
    
    const esDesarrollo = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    
    if (esDesarrollo) {
        return true; // En desarrollo, todos pueden acceder
    }
    
    // En producción, permitir estudiantes y tutores
    return user.rol === 'estudiante' || user.rol === 'tutor';
};

module.exports.info = {
    nombre: 'estudianteMiddleware',
    version: '1.2.0',
    descripcion: 'Middleware para verificar que el usuario es estudiante o tutor (modo desarrollo activado)',
    modo_desarrollo: true,
    roles_permitidos: ['estudiante', 'tutor', 'maestro', 'admin']
};

console.log('✅ Middleware estudiante cargado correctamente (modo desarrollo activado - permite tutores)');