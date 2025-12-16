const path = require('path');
const db = require(path.join(process.cwd(), 'config/dbConfig'));

/**
 * Middleware para verificar que el usuario es un estudiante
 * Este middleware se ejecuta después del authMiddleware
 */
module.exports = function estudianteMiddleware(req, res, next) {
    console.log('🔍 Middleware estudiante: Verificando rol...');
    
    try {
        // 1. Verificar que hay usuario autenticado (debe venir de authMiddleware)
        if (!req.user) {
            console.log('❌ No hay usuario en la request. ¿AuthMiddleware se ejecutó?');
            return res.status(401).json({
                ok: false,
                error: 'No autenticado. Inicia sesión primero.',
                timestamp: new Date().toISOString()
            });
        }
        
        console.log('👤 Usuario encontrado en request:', {
            id: req.user.id,
            rol: req.user.rol,
            nombre: req.user.nombre || req.user.tutor_nombre || req.user.nino_nombre || 'Sin nombre'
        });
        
        // 2. Opciones según entorno
        const esDesarrollo = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
        
        if (esDesarrollo) {
            console.log('🧪 MODO DESARROLLO: Validación de rol relajada');
            
            // En desarrollo, si no tiene rol, intentamos obtenerlo de la BD
            if (!req.user.rol) {
                console.log('🔍 Usuario sin rol, verificando en base de datos...');
                return verificarRolEnBD(req.user.id, req, res, next);
            }
            
            // Si tiene rol pero no es estudiante, permitimos si tiene permisos especiales
            if (req.user.rol !== 'estudiante') {
                console.log(`⚠️ Usuario con rol '${req.user.rol}' accediendo a sección estudiante`);
                
                // Si es maestro/admin, verificamos si tiene acceso especial
                if (req.user.rol === 'maestro' || req.user.rol === 'admin') {
                    console.log('🎓 Maestro/Admin accediendo a vista estudiante (permitido en desarrollo)');
                    return next();
                }
                
                // Si no es estudiante, maestro ni admin, verificamos en BD
                return verificarRolEnBD(req.user.id, req, res, next);
            }
            
            // Si es estudiante, permitir acceso
            console.log('✅ Usuario es estudiante, acceso permitido');
            return next();
        }
        
        // 3. MODO PRODUCCIÓN: Validación estricta
        console.log('🏭 MODO PRODUCCIÓN: Validación estricta de rol');
        
        if (!req.user.rol) {
            console.log('❌ Usuario sin rol definido');
            return res.status(403).json({
                ok: false,
                error: 'Tu cuenta no tiene un rol asignado. Contacta al administrador.',
                timestamp: new Date().toISOString()
            });
        }
        
        if (req.user.rol !== 'estudiante') {
            console.log(`❌ Acceso denegado: Rol '${req.user.rol}' no es estudiante`);
            return res.status(403).json({
                ok: false,
                error: 'Acceso restringido. Solo estudiantes pueden acceder a esta sección.',
                user_rol: req.user.rol,
                required_rol: 'estudiante',
                timestamp: new Date().toISOString()
            });
        }
        
        console.log('✅ Validación de rol exitosa');
        next();
        
    } catch (error) {
        console.error('💥 Error en middleware estudiante:', error);
        
        // En caso de error, permitir acceso para no bloquear el desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.log('🧪 Error en middleware, pero permitiendo acceso en desarrollo');
            return next();
        }
        
        res.status(500).json({
            ok: false,
            error: 'Error interno al verificar permisos',
            timestamp: new Date().toISOString(),
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Función auxiliar para verificar el rol en la base de datos
 */
async function verificarRolEnBD(userId, req, res, next) {
    try {
        console.log(`📊 Verificando rol en BD para usuario ID: ${userId}`);
        
        // Consultar la base de datos
        const [usuarios] = await db.query(
            'SELECT rol, nino_nombre, tutor_nombre FROM usuarios WHERE id = ?',
            [userId]
        );
        
        if (!usuarios || usuarios.length === 0) {
            console.log('❌ Usuario no encontrado en BD');
            
            if (process.env.NODE_ENV === 'development') {
                // En desarrollo, crear usuario simulado
                req.user = {
                    id: userId,
                    rol: 'estudiante',
                    nombre: 'Estudiante Simulado',
                    es_simulado: true
                };
                console.log('🧪 Usuario simulado creado para desarrollo');
                return next();
            }
            
            return res.status(404).json({
                ok: false,
                error: 'Usuario no encontrado en el sistema',
                timestamp: new Date().toISOString()
            });
        }
        
        const usuarioBD = usuarios[0];
        console.log('📋 Datos del usuario desde BD:', usuarioBD);
        
        // Actualizar los datos del usuario en la request
        req.user.rol = usuarioBD.rol;
        req.user.nombre = usuarioBD.nino_nombre || usuarioBD.tutor_nombre;
        
        console.log(`🎭 Rol obtenido desde BD: ${usuarioBD.rol}`);
        
        // Verificar si es estudiante
        if (usuarioBD.rol === 'estudiante') {
            console.log('✅ Usuario es estudiante (verificado en BD)');
            return next();
        }
        
        // Si no es estudiante
        console.log(`⚠️ Usuario tiene rol '${usuarioBD.rol}' en BD`);
        
        if (process.env.NODE_ENV === 'development') {
            // En desarrollo, permitir acceso a maestros/admins
            if (usuarioBD.rol === 'maestro' || usuarioBD.rol === 'admin') {
                console.log('🎓 Maestro/Admin accediendo a sección estudiante (permitido en desarrollo)');
                return next();
            }
        }
        
        // Denegar acceso
        return res.status(403).json({
            ok: false,
            error: `Tu rol actual (${usuarioBD.rol}) no te permite acceder a esta sección.`,
            required_rol: 'estudiante',
            timestamp: new Date().toISOString()
        });
        
    } catch (dbError) {
        console.error('💥 Error al consultar BD:', dbError);
        
        // En desarrollo, permitir acceso a pesar del error
        if (process.env.NODE_ENV === 'development') {
            console.log('🧪 Error de BD, pero permitiendo acceso en desarrollo');
            
            // Asegurar que el usuario tenga rol
            if (!req.user.rol) {
                req.user.rol = 'estudiante';
                req.user.nombre = req.user.nombre || 'Estudiante (Error BD)';
                req.user.db_error = true;
            }
            
            return next();
        }
        
        res.status(500).json({
            ok: false,
            error: 'Error al verificar permisos en la base de datos',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Middleware alternativo para desarrollo rápido (sin BD)
 */
module.exports.desarrolloSimple = function desarrolloSimpleMiddleware(req, res, next) {
    console.log('⚡ Middleware estudiante (modo desarrollo simple)');
    
    // Si no hay usuario, crear uno simulado
    if (!req.user) {
        req.user = {
            id: 1,
            rol: 'estudiante',
            nombre: 'Estudiante Demo',
            es_demo: true,
            timestamp: new Date().toISOString()
        };
        console.log('🧪 Usuario demo creado:', req.user);
    }
    
    // Asegurar que tenga rol
    if (!req.user.rol) {
        req.user.rol = 'estudiante';
    }
    
    next();
};

/**
 * Middleware que permite TODO (para emergencias/testing)
 */
module.exports.permiteTodo = function permiteTodoMiddleware(req, res, next) {
    console.log('🔥 Middleware estudiante (PERMITE TODO)');
    
    // Crear usuario si no existe
    if (!req.user) {
        req.user = {
            id: parseInt(Math.random() * 1000) + 1,
            rol: 'estudiante',
            nombre: 'Usuario Emergencia',
            es_emergencia: true,
            timestamp: new Date().toISOString()
        };
    }
    
    // Asegurar rol
    req.user.rol = 'estudiante';
    
    console.log('✅ Acceso permitido sin validaciones');
    next();
};

/**
 * Función para verificar si un usuario puede acceder como estudiante
 * (Útil para otras partes del código)
 */
module.exports.esEstudiante = function(user) {
    if (!user || !user.rol) return false;
    
    // En desarrollo, permitir maestros/admins también
    const esDesarrollo = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    
    if (esDesarrollo) {
        return user.rol === 'estudiante' || user.rol === 'maestro' || user.rol === 'admin';
    }
    
    return user.rol === 'estudiante';
};

/**
 * Información del middleware
 */
module.exports.info = {
    nombre: 'estudianteMiddleware',
    version: '1.0.0',
    descripcion: 'Middleware para verificar que el usuario es estudiante',
    funciones: [
        'Verificación de rol estudiante',
        'Consulta a BD si es necesario',
        'Modos desarrollo/producción',
        'Middlewares alternativos para testing'
    ],
    autor: 'Sistema de Gestión Educativa',
    fecha: '2024'
};

console.log('✅ Middleware estudiante cargado correctamente');