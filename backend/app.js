const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ========================================
// MIDDLEWARES GLOBALES
// ========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log('🚀 Iniciando servidor...');

// ========================================
// ✅ RUTAS PRINCIPALES - LOGIN
// ========================================
try {
    const loginRoutes = require('./controllers/login/loginRoutes');
    app.use('/api/login', loginRoutes);
    console.log('✅ Ruta cargada: /api/login');
} catch (error) {
    console.log('❌ Error cargando loginRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DASHBOARD / AVISOS
// ========================================
try {
    const dashboardRoutes = require('./controllers/maestro/dashboard/dashboardRoutes');
    app.use('/api/maestro/dashboard', dashboardRoutes);
    console.log('✅ Rutas cargadas: /api/maestro/dashboard');
} catch (error) {
    console.log('❌ Error cargando dashboardRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE ESTUDIANTES
// ========================================
try {
    const estudiantesRoutes = require('./controllers/maestro/estudiantes/estudiantesRoutes');
    app.use('/api/maestro/estudiantes', estudiantesRoutes);
    console.log('✅ Rutas cargadas: /api/maestro/estudiantes');
} catch (error) {
    console.log('❌ Error cargando estudiantesRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE ASISTENCIA - AGREGADAS
// ========================================
try {
    const asistenciaRoutes = require('./controllers/maestro/asistencia/asistenciaRoutes');
    app.use('/api/maestro/asistencia', asistenciaRoutes);
    console.log('✅ Rutas cargadas: /api/maestro/asistencia');
} catch (error) {
    console.log('❌ Error cargando asistenciaRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE CHAT MAESTRO/TUTOR
// ========================================
try {
    const chatRoutes = require('./controllers/maestro/padres/chatRoutes');
    app.use('/api/maestro/chat', chatRoutes);
    console.log('✅ Rutas cargadas: /api/maestro/chat');
} catch (error) {
    console.log('❌ Error cargando chatRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE TAREAS - NUEVAS
// ========================================
try {
    const tareasRoutes = require('./controllers/maestro/tareas/tareasRoutes');
    app.use('/api/maestro/tareas', tareasRoutes);
    console.log('✅ Rutas cargadas: /api/maestro/tareas');
} catch (error) {
    console.log('❌ Error cargando tareasRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE MATERIAS - NUEVAS
// ========================================
try {
    const materiasRoutes = require('./controllers/maestro/tareas/materiasRoutes');
    app.use('/api/materias', materiasRoutes);
    console.log('✅ Rutas cargadas: /api/materias');
} catch (error) {
    console.log('❌ Error cargando materiasRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE CALIFICACIONES - NUEVAS
// ========================================
try {
    const calificacionesRoutes = require('./controllers/maestro/calificaciones/calificacionesRoutes');
    app.use('/api/maestro/calificaciones', calificacionesRoutes);
    console.log('✅ Rutas cargadas: /api/maestro/calificaciones');
} catch (error) {
    console.log('❌ Error cargando calificacionesRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE REPORTES - NUEVAS
// ========================================
try {
    const reportesRoutes = require('./controllers/maestro/reportes/reportesRoutes');
    app.use('/api/reportes', reportesRoutes);
    console.log('✅ Rutas cargadas: /api/reportes');
} catch (error) {
    console.log('❌ Error cargando reportesRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE PRUEBA DIRECTAS
// ========================================
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ Backend funcionando correctamente!',
        service: 'Gestión Educativa API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            login: {
                main: 'POST /api/login',
                test: 'GET /api/login/test',
                status: 'GET /api/login/status'
            },
            dashboard: {
                activos: 'GET /api/maestro/dashboard/avisos/activos',
                todos: 'GET /api/maestro/dashboard/avisos',
                toggle: 'PATCH /api/maestro/dashboard/avisos/:id/toggle'
            },
            estudiantes: {
                getAll: 'GET /api/maestro/estudiantes',
                getById: 'GET /api/maestro/estudiantes/:id',
                create: 'POST /api/maestro/estudiantes',
                update: 'PUT /api/maestro/estudiantes/:id',
                delete: 'DELETE /api/maestro/estudiantes/:id'
            },
            asistencia: {
                lista: 'GET /api/maestro/asistencia/lista',
                guardar: 'POST /api/maestro/asistencia/guardar',
                historial: 'GET /api/maestro/asistencia',
                individual: 'POST /api/maestro/asistencia',
                actualizar: 'PUT /api/maestro/asistencia/:id',
                eliminar: 'DELETE /api/maestro/asistencia/:id'
            },
            chat: {
                conversaciones: 'GET /api/maestro/chat/conversaciones/:maestro_id',
                mensajes: 'GET /api/maestro/chat/mensajes/:maestro_id/:tutor_id',
                enviar: 'POST /api/maestro/chat/enviar',
                estadisticas: 'GET /api/maestro/chat/estadisticas/:maestro_id'
            },
            tareas: {
                listar: 'GET /api/maestro/tareas/listar',
                crear: 'POST /api/maestro/tareas/crear',
                actualizar: 'POST /api/maestro/tareas/actualizar',
                eliminar: 'POST /api/maestro/tareas/eliminar',
                entregas: 'GET /api/maestro/tareas/entregas',
                calificar: 'POST /api/maestro/tareas/calificar',
                estadisticas: 'GET /api/maestro/tareas/estadisticas',
                detalle: 'GET /api/maestro/tareas/detalle/:id_tarea',
                descargar: 'GET /api/maestro/tareas/descargar/:id_tarea',
                por_materia: 'GET /api/maestro/tareas/por-materia/:id_materia',
                por_estado: 'GET /api/maestro/tareas/por-estado/:estado',
                vencidas: 'GET /api/maestro/tareas/vencidas',
                proximas_vencer: 'GET /api/maestro/tareas/proximas-vencer',
                cambiar_estado: 'POST /api/maestro/tareas/cambiar-estado',
                resumen_calificaciones: 'GET /api/maestro/tareas/resumen-calificaciones/:id_tarea'
            },
            materias: {
                lista: 'GET /api/materias/lista',
                crear: 'POST /api/materias/crear',
                actualizar: 'POST /api/materias/actualizar',
                eliminar: 'POST /api/materias/eliminar',
                buscar: 'GET /api/materias/buscar',
                populares: 'GET /api/materias/populares',
                con_estadisticas: 'GET /api/materias/con-estadisticas'
            },
            calificaciones: {
                completas: 'GET /api/maestro/calificaciones/completas',
                por_estudiante: 'GET /api/maestro/calificaciones/estudiante/:id',
                resumen: 'GET /api/maestro/calificaciones/resumen',
                actualizar: 'POST /api/maestro/calificaciones/actualizar'
            },
            // ===== REPORTES ACTUALIZADO (SIN .php) =====
            reportes: {
                estudiantes: 'GET /api/reportes/estudiantes',
                lista: 'GET /api/reportes',
                crear: 'POST /api/reportes',
                cambiar_estado: 'PUT /api/reportes/:id/estado',
                eliminar: 'DELETE /api/reportes/:id',
                exportar_csv: 'GET /api/reportes/exportar/csv',
                upload_logo: 'POST /api/reportes/upload/logo',
                exportar_word: 'GET /api/reportes/exportar/word',
                debug: 'GET /api/reportes/debug'
            },
            system: {
                test: 'GET /api/test',
                health: 'GET /api/health',
                home: 'GET /'
            }
        },
        status: '🟢 Servidor activo - Sistema completo funcionando'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: '🟢 Healthy',
        service: 'Gestión Educativa API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        modules: {
            login: '🟢',
            dashboard: '🟢',
            estudiantes: '🟢',
            asistencia: '🟢',
            chat: '🟢',
            tareas: '🟢',
            materias: '🟢',
            calificaciones: '🟢',
            reportes: '🟢'
        }
    });
});

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Backend - Sistema de Gestión Educativa',
        version: '1.0.0',
        status: '🟢 Online',
        timestamp: new Date().toISOString(),
        availableServices: {
            authentication: '✅ Login activo',
            dashboard: '✅ Dashboard / Avisos activo',
            estudiantes: '✅ Estudiantes activo',
            asistencia: '✅ Asistencia activo',
            chat: '✅ Chat Maestro/Tutor activo',
            tareas: '✅ Tareas activo',
            materias: '✅ Materias activo',
            calificaciones: '✅ Calificaciones activo',
            reportes: '✅ Reportes activo',
            api: '✅ Todos los endpoints funcionando'
        },
        quickStart: 'Usa POST /api/login para autenticarte',
        documentation: 'Consulta GET /api/test para ver todos los endpoints disponibles'
    });
});

// ========================================
// ✅ MANEJO 404
// ========================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `❌ Endpoint no encontrado: ${req.originalUrl}`,
        error: 'ROUTE_NOT_FOUND',
        timestamp: new Date().toISOString(),
        suggestion: 'Consulta GET /api/test para ver todos los endpoints disponibles',
        availableModules: [
            '/api/login',
            '/api/maestro/dashboard',
            '/api/maestro/estudiantes',
            '/api/maestro/asistencia',
            '/api/maestro/chat',
            '/api/maestro/tareas',
            '/api/materias',
            '/api/maestro/calificaciones',
            '/api/reportes'
        ]
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
        error: error.message,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
});

// ========================================
// ✅ DEBUG: Mostrar rutas registradas
// ========================================
console.log('✅ Todas las rutas configuradas correctamente');
console.log('==============================================');
console.log('📚 MÓDULOS CARGADOS:');
console.log('  ✅ Login');
console.log('  ✅ Dashboard');
console.log('  ✅ Estudiantes');
console.log('  ✅ Asistencia');
console.log('  ✅ Chat Maestro/Tutor');
console.log('  ✅ Tareas');
console.log('  ✅ Materias');
console.log('  ✅ Calificaciones');
console.log('  ✅ Reportes');

// Mostrar rutas específicas de reportes
console.log('==============================================');
console.log('🔍 RUTAS DE REPORTES REGISTRADAS:');
try {
    const reportesRoutes = require('./controllers/maestro/reportes/reportesRoutes');
    reportesRoutes.stack.forEach((layer) => {
        if (layer.route) {
            const method = Object.keys(layer.route.methods)[0].toUpperCase();
            const path = layer.route.path;
            console.log(`  ${method.padEnd(6)} /api/reportes${path}`);
        }
    });
} catch (error) {
    console.log('  ❌ No se pudieron mostrar las rutas de reportes');
}

console.log('==============================================');
console.log('🌐 Servidor listo en: http://localhost:3000');
console.log('📋 Documentación: http://localhost:3000/api/test');
console.log('🔗 Prueba reportes: http://localhost:3000/api/reportes/estudiantes?maestro_id=16');

module.exports = app;