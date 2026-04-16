// app.js - Configuración de la aplicación Express
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ========================================
// MIDDLEWARES GLOBALES - CONFIGURACIÓN CORS COMPLETA
// ========================================
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Accept',
        'X-User-Id',
        'X-User-Rol',
        'X-Requested-With'
    ],
    exposedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Rol']
}));

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================================
// MIDDLEWARE DE DEBUG - MUESTRA TODOS LOS HEADERS
// ========================================
app.use((req, res, next) => {
    console.log('\n🔍 ===== REQUEST RECIBIDO =====');
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:');
    console.log('  • Authorization:', req.headers.authorization ? '✅ Presente' : '❌ Ausente');
    console.log('  • X-User-Id:', req.headers['x-user-id'] || '❌ Ausente');
    console.log('  • X-User-Rol:', req.headers['x-user-rol'] || '❌ Ausente');
    console.log('  • Content-Type:', req.headers['content-type'] || 'No especificado');
    console.log('==============================\n');
    next();
});

console.log('🚀 Iniciando aplicación...');

// ========================================
// ✅ SERVICIO DE LOGIN
// ========================================
const loginService = require('./services/login/loginService');

// ========================================
// ✅ RUTA DE LOGIN DIRECTA (POST) - PRIORIDAD MÁXIMA
// ========================================
app.post('/api/login', async (req, res) => {
    console.log('📥 POST /api/login - Recibida petición');
    console.log('📧 Email:', req.body.email);
    console.log('🔐 Password proporcionada:', req.body.password ? '✅ Sí' : '❌ No');
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y password son requeridos'
            });
        }

        // Usar el servicio de login real
        const user = await loginService.authenticateUser(email, password);
        
        if (user) {
            console.log('✅ Usuario autenticado:', user.email, 'Rol:', user.rol);
            
            // Generar token simple
            const token = Buffer.from(`${user.id}-${Date.now()}`).toString('base64');
            
            // Determinar tipo de usuario
            const tipo = user.rol === 'ADMIN' || user.rol === 'SUPERADMIN' || user.rol === 'MAESTRO' 
                ? 'MAESTRO' 
                : 'TUTOR';
            
            const response = {
                success: true,
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                rol: user.rol,
                tipo: tipo,
                token: token,
                message: 'Login exitoso'
            };
            
            // Si es TUTOR, incluir información del niño
            if (user.rol === 'TUTOR' && user.nino_id) {
                response.nino_id = user.nino_id;
                response.nino_nombre = user.nino_nombre;
                console.log('👶 Tutor asociado al niño ID:', user.nino_id);
            }
            
            // Si es MAESTRO, incluir información adicional
            if (user.rol === 'MAESTRO' || user.rol === 'ADMIN' || user.rol === 'SUPERADMIN') {
                response.admin_nombre = user.nombre;
                console.log('👨‍🏫 Maestro/Admin autenticado');
            }
            
            res.json(response);
        } else {
            console.log('❌ Credenciales inválidas');
            res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }
    } catch (error) {
        console.error('💥 Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// ========================================
// ✅ RUTAS PRINCIPALES - LOGIN (router)
// ========================================
try {
    const loginRoutes = require('./controllers/login/loginRoutes');
    app.use('/api/login', loginRoutes);
    console.log('✅ Ruta cargada: /api/login (router)');
} catch (error) {
    console.log('❌ Error cargando loginRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE RECUPERACIÓN DE CONTRASEÑA
// ========================================
try {
    const recuperarRoutes = require('./controllers/recuperarContrasena/recuperarRoutes');
    app.use('/api/recuperar', recuperarRoutes);
    console.log('✅ /api/recuperar (recuperación con preguntas de seguridad)');
} catch (error) {
    console.log('❌ Error cargando recuperarRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE AUTENTICACIÓN (validar token)
// ========================================
try {
    const authRoutes = require('./routes/authRoutes');
    app.use('/api/auth', authRoutes);
    console.log('✅ /api/auth (validar-token)');
} catch (error) {
    console.log('❌ Error cargando authRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE MAESTRO
// ========================================
console.log('\n👨‍🏫 CARGANDO MÓDULOS PARA MAESTRO:');

// Dashboard
try {
    const dashboardRoutes = require('./controllers/maestro/dashboard/dashboardRoutes');
    app.use('/api/maestro/dashboard', dashboardRoutes);
    console.log('✅ /api/maestro/dashboard');
} catch (error) {
    console.log('❌ Error cargando dashboardRoutes:', error.message);
}

// Estudiantes
try {
    const estudiantesRoutes = require('./controllers/maestro/estudiantes/estudiantesRoutes');
    app.use('/api/maestro/estudiantes', estudiantesRoutes);
    console.log('✅ /api/maestro/estudiantes');
} catch (error) {
    console.log('❌ Error cargando estudiantesRoutes:', error.message);
}

// Asistencia
try {
    const asistenciaRoutes = require('./controllers/maestro/asistencia/asistenciaRoutes');
    app.use('/api/maestro/asistencia', asistenciaRoutes);
    console.log('✅ /api/maestro/asistencia');
} catch (error) {
    console.log('❌ Error cargando asistenciaRoutes:', error.message);
}

// Chat Maestro/Tutor
try {
    const chatRoutes = require('./controllers/maestro/padres/chatRoutes');
    app.use('/api/maestro/chat', chatRoutes);
    console.log('✅ /api/maestro/chat');
} catch (error) {
    console.log('❌ Error cargando chatRoutes:', error.message);
}

// Tareas
try {
    const tareasRoutes = require('./controllers/maestro/tareas/tareasRoutes');
    app.use('/api/maestro/tareas', tareasRoutes);
    console.log('✅ /api/maestro/tareas');
} catch (error) {
    console.log('❌ Error cargando tareasRoutes:', error.message);
}

// Materias
try {
    const materiasRoutes = require('./controllers/maestro/materias/materiasRoutes');
    app.use('/api/materias', materiasRoutes);
    console.log('✅ /api/materias');
} catch (error) {
    console.log('❌ Error cargando materiasRoutes:', error.message);
}

// Calificaciones
try {
    const calificacionesRoutes = require('./controllers/maestro/calificaciones/calificacionesRoutes');
    app.use('/api/maestro/calificaciones', calificacionesRoutes);
    console.log('✅ /api/maestro/calificaciones');
} catch (error) {
    console.log('❌ Error cargando calificacionesRoutes:', error.message);
}

// Reportes
try {
    const reportesRoutes = require('./controllers/maestro/reportes/reportesRoutes');
    app.use('/api/reportes', reportesRoutes);
    console.log('✅ /api/reportes');
} catch (error) {
    console.log('❌ Error cargando reportesRoutes:', error.message);
}

// Graduación
try {
    const graduacionRoutes = require('./controllers/maestro/graduacion/graduacionRoutes');
    app.use('/api/maestro/graduacion', graduacionRoutes);
    console.log('✅ /api/maestro/graduacion');
} catch (error) {
    console.log('❌ Error cargando graduacionRoutes:', error.message);
}

// ========================================
// ✅ CONFIGURACIÓN PARA MAESTRO
// ========================================
try {
    const configuracionRoutes = require('./controllers/maestro/Configuracon/configuracionRoutes');
    app.use('/api/maestro/configuracion', configuracionRoutes);
    console.log('✅ /api/maestro/configuracion');
    
    // Ruta de prueba
    app.get('/api/maestro/configuracion/test', (req, res) => {
        res.json({
            success: true,
            message: '✅ Configuración para maestros funcionando',
            timestamp: new Date().toISOString()
        });
    });
} catch (error) {
    console.log('❌ Error cargando configuracionRoutes:', error.message);
}

// ========================================
// ✅ RUTAS PARA ESTUDIANTES/TUTORES
// ========================================
console.log('\n🎓 CARGANDO MÓDULOS PARA ESTUDIANTES:');

// Asistencia
try {
    const estudianteAsistenciaRoutes = require('./controllers/estudiante/asistencia/asistenciaRoutes');
    app.use('/api/estudiante/asistencia', estudianteAsistenciaRoutes);
    console.log('✅ /api/estudiante/asistencia');
} catch (error) {
    console.log('❌ Error cargando asistencia:', error.message);
}

// Dashboard
try {
    const estudianteDashboardRoutes = require('./controllers/estudiante/dashboard/dashboardRoutes');
    app.use('/api/estudiante/dashboard', estudianteDashboardRoutes);
    console.log('✅ /api/estudiante/dashboard');
} catch (error) {
    console.log('❌ Error cargando dashboard:', error.message);
}

// Dashboard test route
app.get('/api/estudiante/dashboard/test', (req, res) => {
    res.json({ success: true, message: 'Dashboard test OK' });
});

// Reportes (doble ruta para compatibilidad)
try {
    const reportesEstudianteRoutes = require('./controllers/estudiante/reportes/reportesRoutes');
    app.use('/api/reportes-alumno', reportesEstudianteRoutes);
    app.use('/api/estudiante/reportes', reportesEstudianteRoutes);
    console.log('✅ /api/reportes-alumno y /api/estudiante/reportes');
    
    app.get('/api/reportes-alumno/test', (req, res) => {
        res.json({ success: true, message: 'Reportes test OK' });
    });
} catch (error) {
    console.log('❌ Error cargando reportes:', error.message);
}

// Tareas
try {
    const estudianteTareasRoutes = require('./controllers/estudiante/tareas/tareasRoutes');
    app.use('/api/estudiante/tareas', estudianteTareasRoutes);
    console.log('✅ /api/estudiante/tareas');
    
    app.get('/api/estudiante/tareas/test', (req, res) => {
        res.json({ success: true, message: 'Tareas test OK' });
    });
} catch (error) {
    console.log('❌ Error cargando tareas:', error.message);
}

// Chat/Padres
try {
    const estudiantePadresRoutes = require('./controllers/estudiante/padres/chatRoutes');
    app.use('/api/estudiante/padres', estudiantePadresRoutes);
    console.log('✅ /api/estudiante/padres');
    
    app.get('/api/estudiante/padres/test', (req, res) => {
        res.json({ success: true, message: 'Chat test OK' });
    });
} catch (error) {
    console.log('❌ Error cargando chat:', error.message);
}

// Graduación
try {
    const graduacionEstudianteRoutes = require('./controllers/estudiante/graduacion/graduacionRoutes');
    app.use('/api/estudiante/graduacion', graduacionEstudianteRoutes);
    console.log('✅ /api/estudiante/graduacion');
    
    app.get('/api/estudiante/graduacion/test', (req, res) => {
        res.json({ success: true, message: 'Graduación test OK' });
    });
} catch (error) {
    console.log('❌ Error cargando graduación:', error.message);
}

// Calificaciones (REAL)
try {
    const estudianteCalificacionesRoutes = require('./controllers/estudiante/calificaciones/calificacionesRoutes');
    app.use('/api/estudiante/calificaciones', estudianteCalificacionesRoutes);
    console.log('✅ /api/estudiante/calificaciones (REAL)');
    
    app.get('/api/estudiante/calificaciones/test', (req, res) => {
        res.json({ success: true, message: 'Calificaciones test OK' });
    });
} catch (error) {
    console.log('❌ Error cargando calificaciones reales:', error.message);
    // Fallback a stub
    const router = express.Router();
    router.get('/test', (req, res) => {
        res.json({ ok: true, message: 'Calificaciones stub' });
    });
    app.use('/api/estudiante/calificaciones', router);
    console.log('⚠️ Usando stub de calificaciones');
}

// ========================================
// ✅ CONFIGURACIÓN PARA ESTUDIANTES/TUTORES (REAL)
// ========================================
try {
    // Importar las rutas REALES de configuración
    const configuracionRoutes = require('./controllers/estudiante/configuracion/configuracionRoutes');
    
    // Montar las rutas en diferentes endpoints para compatibilidad
    app.use('/api/estudiante/configuracion', configuracionRoutes);
    app.use('/api/configuracion', configuracionRoutes);  // Endpoint principal para el frontend
    
    console.log('✅ /api/estudiante/configuracion (REAL)');
    console.log('✅ /api/configuracion (REAL)');
    
    // Ruta de prueba adicional
    app.get('/api/configuracion/test', (req, res) => {
        res.json({ 
            success: true, 
            message: '✅ Configuración para estudiantes/tutores funcionando',
            endpoints: [
                { method: 'GET', path: '/api/configuracion/tutor/:tutor_id/ninos', description: 'Lista de niños del tutor' },
                { method: 'GET', path: '/api/configuracion/tutor/:tutor_id/info', description: 'Información del tutor' },
                { method: 'GET', path: '/api/configuracion/nino/:nino_id', description: 'Información de un niño específico' }
            ]
        });
    });
} catch (error) {
    console.log('❌ Error cargando configuracionRoutes REALES:', error.message);
    // Fallback a stub si no funciona
    const router = express.Router();
    router.get('/test', (req, res) => {
        res.json({ ok: true, message: 'Configuración stub - Implementar rutas reales' });
    });
    app.use('/api/estudiante/configuracion', router);
    app.use('/api/configuracion', router);
    console.log('⚠️ Usando stub de configuración');
}

// ========================================
// ✅ STUBS PARA MÓDULOS NO IMPLEMENTADOS
// ========================================
function crearStub(nombre) {
    const router = express.Router();
    router.get('/test', (req, res) => {
        res.json({ ok: true, message: `Módulo ${nombre} - En desarrollo` });
    });
    return router;
}

// Materias (stub)
app.use('/api/estudiante/materias', crearStub('materias'));
console.log('✅ /api/estudiante/materias (stub)');

// Manual (stub)
app.use('/api/estudiante/manual', crearStub('manual'));
console.log('✅ /api/estudiante/manual (stub)');

// ========================================
// ✅ RUTAS DE UTILIDAD
// ========================================

// Test general
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ Backend funcionando',
        version: '2.5.0',
        timestamp: new Date().toISOString(),
        credentials: {
            admin: 'admin@escuela.com / Admin123',
            maestro: 'juan.perez@escuela.edu / 2025Eliana_Obil',
            tutor: 'tutor@example.com / Tutor123'
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: '🟢 Healthy',
        service: 'Gestión Educativa API',
        version: '2.5.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Debug login
app.get('/api/debug-login', (req, res) => {
    res.json({
        success: true,
        message: 'Login funcionando',
        routes: {
            direct_post: 'POST /api/login',
            router_post: 'POST /api/login (router)'
        }
    });
});

// Debug routes
app.get('/api/debug-routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router' && middleware.handle.stack) {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    routes.push({
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json({ total: routes.length, routes });
});

// ========================================
// ✅ MANEJO 404
// ========================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `❌ Endpoint no encontrado: ${req.originalUrl}`,
        suggestion: 'Consulta GET /api/test'
    });
});

// ========================================
// ✅ MANEJO DE ERRORES GLOBAL
// ========================================
app.use((error, req, res, next) => {
    console.error('💥 Error global:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
    });
});

module.exports = app;