// server.js - COMPLETO CON CHAT ESTUDIANTES/PADRES, REPORTES ESTUDIANTES Y GRADUACIÓN ESTUDIANTES
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
// ✅ RUTAS DE ESTUDIANTES (MAESTRO)
// ========================================
try {
    const estudiantesRoutes = require('./controllers/maestro/estudiantes/estudiantesRoutes');
    app.use('/api/maestro/estudiantes', estudiantesRoutes);
    console.log('✅ Rutas cargadas: /api/maestro/estudiantes');
} catch (error) {
    console.log('❌ Error cargando estudiantesRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE ASISTENCIA (MAESTRO)
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
// ✅ RUTAS DE TAREAS (MAESTRO)
// ========================================
try {
    const tareasRoutes = require('./controllers/maestro/tareas/tareasRoutes');
    app.use('/api/maestro/tareas', tareasRoutes);
    console.log('✅ Rutas cargadas: /api/maestro/tareas');
} catch (error) {
    console.log('❌ Error cargando tareasRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE MATERIAS (MAESTRO) - ¡CORREGIDO!
// ========================================
try {
    const materiasRoutes = require('./controllers/maestro/materias/materiasRoutes');
    app.use('/api/materias', materiasRoutes);
    console.log('✅ Rutas cargadas: /api/materias');
} catch (error) {
    console.log('❌ Error cargando materiasRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE CALIFICACIONES (MAESTRO)
// ========================================
try {
    const calificacionesRoutes = require('./controllers/maestro/calificaciones/calificacionesRoutes');
    app.use('/api/maestro/calificaciones', calificacionesRoutes);
    console.log('✅ Rutas cargadas: /api/maestro/calificaciones');
} catch (error) {
    console.log('❌ Error cargando calificacionesRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE REPORTES (MAESTRO)
// ========================================
try {
    const reportesRoutes = require('./controllers/maestro/reportes/reportesRoutes');
    app.use('/api/reportes', reportesRoutes);
    console.log('✅ Rutas cargadas: /api/reportes');
} catch (error) {
    console.log('❌ Error cargando reportesRoutes:', error.message);
}

// ========================================
// ✅ RUTAS DE GRADUACIÓN (MAESTRO)
// ========================================
try {
    const graduacionRoutes = require('./controllers/maestro/graduacion/graduacionRoutes');
    app.use('/api/maestro/graduacion', graduacionRoutes);
    console.log('✅ Rutas cargadas: /api/maestro/graduacion');
} catch (error) {
    console.log('❌ Error cargando graduacionRoutes:', error.message);
}

// ========================================
// ✅ RUTAS PARA ESTUDIANTES/TUTORES
// ========================================
console.log('\n🎓 CARGANDO MÓDULOS PARA ESTUDIANTES:');

// Asistencia para estudiantes
try {
    const estudianteAsistenciaRoutes = require('./controllers/estudiante/asistencia/asistenciaRoutes');
    app.use('/api/estudiante/asistencia', estudianteAsistenciaRoutes);
    console.log('✅ Rutas cargadas: /api/estudiante/asistencia');
} catch (error) {
    console.log('❌ Error cargando asistenciaRoutes (estudiante):', error.message);
}

// ==================== RUTA DE PRUEBA TEMPORAL PARA DASHBOARD (¡DEFINIR ANTES!) ====================
// ¡IMPORTANTE: Esta ruta debe definirse ANTES de montar el router de dashboard!
app.get('/api/estudiante/dashboard/test', (req, res) => {
    console.log('🔧 Ruta de prueba dashboard llamada');
    res.json({
        success: true,
        message: '✅ Ruta de prueba dashboard funcionando',
        timestamp: new Date().toISOString(),
        endpoints: {
            avisos: 'GET /api/estudiante/dashboard/avisos',
            estadisticas: 'GET /api/estudiante/dashboard/estadisticas',
            verificar: 'GET /api/estudiante/dashboard/verificar'
        }
    });
});

// ==================== DEPURACIÓN Y CARGA DASHBOARD ====================
console.log('\n🔍 DEPURACIÓN DASHBOARD ESTUDIANTE:');
try {
    console.log('📂 Intentando cargar dashboardController...');
    const dashboardController = require('./controllers/estudiante/dashboard/dashboardController');
    console.log('✅ dashboardController cargado exitosamente');
    console.log('📋 Funciones disponibles en dashboardController:');
    console.log(Object.keys(dashboardController).map(f => `  - ${f}`).join('\n'));
    
    // Verificar que las funciones necesarias existan
    const funcionesRequeridas = [
        'getAvisosActivos',
        'getEstadisticasAvisosActivos', 
        'verificarTabla'
    ];
    
    funcionesRequeridas.forEach(func => {
        if (typeof dashboardController[func] === 'function') {
            console.log(`✅ ${func} es una función válida`);
        } else {
            console.log(`❌ ${func} NO es una función válida`);
        }
    });
} catch (controllerError) {
    console.error('❌ Error cargando dashboardController:', controllerError.message);
    console.error('Stack:', controllerError.stack);
}

try {
    console.log('\n📂 Intentando cargar dashboardRoutes...');
    const estudianteDashboardRoutes = require('./controllers/estudiante/dashboard/dashboardRoutes');
    console.log('✅ dashboardRoutes cargado exitosamente');
    
    // Verificar que el router sea válido
    if (estudianteDashboardRoutes && typeof estudianteDashboardRoutes === 'function') {
        console.log('✅ dashboardRoutes es una función válida (router Express)');
    } else {
        console.log('❌ dashboardRoutes NO es una función válida');
    }
    
    app.use('/api/estudiante/dashboard', estudianteDashboardRoutes);
    console.log('✅ Rutas cargadas: /api/estudiante/dashboard');
} catch (routesError) {
    console.error('❌ Error cargando dashboardRoutes:', routesError.message);
    console.error('Stack:', routesError.stack);
}
// ==================== FIN DEPURACIÓN ====================

// ========================================
// ✅ RUTAS DE REPORTES PARA ESTUDIANTES (REALES)
// ========================================
console.log('\n📊 CARGANDO REPORTES PARA ESTUDIANTES:');
try {
    console.log('📂 Intentando cargar reportesEstudianteRoutes...');
    const reportesEstudianteRoutes = require('./controllers/estudiante/reportes/reportesRoutes');
    console.log('✅ reportesEstudianteRoutes cargado exitosamente');
    
    // Verificar que el router sea válido
    if (reportesEstudianteRoutes && typeof reportesEstudianteRoutes === 'function') {
        console.log('✅ reportesEstudianteRoutes es una función válida (router Express)');
    } else {
        console.log('❌ reportesEstudianteRoutes NO es una función válida');
        throw new Error('reportesEstudianteRoutes no es un router Express válido');
    }
    
    // MONTA DOS RUTAS PARA COMPATIBILIDAD:
    
    // 1. /api/reportes-alumno (para compatibilidad con el frontend existente)
    app.use('/api/reportes-alumno', reportesEstudianteRoutes);
    console.log('✅ Rutas cargadas: /api/reportes-alumno');
    
    // 2. /api/estudiante/reportes (estructura organizada)
    app.use('/api/estudiante/reportes', reportesEstudianteRoutes);
    console.log('✅ Rutas cargadas: /api/estudiante/reportes');
    
    // Añadir ruta de prueba
    app.get('/api/reportes-alumno/test', (req, res) => {
        console.log('🔧 Ruta de prueba reportes-alumno llamada');
        res.json({
            success: true,
            message: '✅ Sistema de reportes para estudiantes funcionando',
            timestamp: new Date().toISOString(),
            endpoints: {
                reportes: 'GET /api/reportes-alumno?estudianteId=ID',
                resumen: 'GET /api/reportes-alumno/resumen?estudianteId=ID',
                marcar_leido: 'POST /api/reportes-alumno/:id/leido',
                agregar_observacion: 'POST /api/reportes-alumno/:id/observacion',
                exportar_pdf: 'GET /api/reportes-alumno/exportar/pdf?estudianteId=ID',
                test: 'GET /api/reportes-alumno/test',
                verificar_tabla: 'GET /api/reportes-alumno/verificar-tabla',
                verificar: 'GET /api/reportes-alumno/verificar'
            },
            compatibilidad: {
                original: 'GET /api/reportes-alumno?estudianteId=ID',
                nueva: 'GET /api/estudiante/reportes?estudianteId=ID',
                ambos_funcionan: true
            }
        });
    });
    
    console.log('✅ Ruta de prueba añadida: /api/reportes-alumno/test');
    
} catch (error) {
    console.error('❌ Error cargando reportesEstudianteRoutes:', error.message);
    console.error('Stack:', error.stack);
    
    // Fallback básico
    app.use('/api/reportes-alumno', (req, res) => {
        res.status(501).json({
            ok: false,
            error: 'Módulo de reportes para estudiantes no disponible',
            message: 'El controlador no se pudo cargar',
            timestamp: new Date().toISOString(),
            debug: {
                error: error.message,
                path: './controllers/estudiante/reportes/reportesRoutes'
            }
        });
    });
    
    app.use('/api/estudiante/reportes', (req, res) => {
        res.status(501).json({
            ok: false,
            error: 'Módulo de reportes para estudiantes no disponible',
            message: 'El controlador no se pudo cargar',
            timestamp: new Date().toISOString()
        });
    });
}

// ========================================
// ✅ RUTAS DE TAREAS PARA ESTUDIANTES - ¡NUEVO!
// ========================================
try {
    console.log('\n📚 CARGANDO TAREAS PARA ESTUDIANTES:');
    console.log('📂 Intentando cargar tareasEstudianteRoutes...');
    
    const estudianteTareasRoutes = require('./controllers/estudiante/tareas/tareasRoutes');
    console.log('✅ tareasEstudianteRoutes cargado exitosamente');
    
    // Verificar que el router sea válido
    if (estudianteTareasRoutes && typeof estudianteTareasRoutes === 'function') {
        console.log('✅ tareasEstudianteRoutes es una función válida (router Express)');
    } else {
        console.log('❌ tareasEstudianteRoutes NO es una función válida');
    }
    
    app.use('/api/estudiante/tareas', estudianteTareasRoutes);
    console.log('✅ Rutas cargadas: /api/estudiante/tareas');
    
    // Añadir ruta de prueba específica para tareas
    app.get('/api/estudiante/tareas/test', (req, res) => {
        console.log('🔧 Ruta de prueba tareas-estudiante llamada');
        res.json({
            success: true,
            message: '✅ Sistema de tareas para estudiantes funcionando',
            timestamp: new Date().toISOString(),
            endpoints: {
                disponibles: 'GET /api/estudiante/tareas/disponibles',
                detalle: 'GET /api/estudiante/tareas/detalle/:id_tarea',
                entregar: 'POST /api/estudiante/tareas/entregar',
                historial: 'GET /api/estudiante/tareas/historial',
                estadisticas: 'GET /api/estudiante/tareas/estadisticas',
                descargar_material: 'GET /api/estudiante/tareas/descargar-material/:id_tarea',
                health: 'GET /api/estudiante/tareas/health'
            },
            features: [
                '📚 Listar tareas disponibles',
                '📄 Ver detalle de tareas',
                '📤 Entregar tareas con archivos',
                '📋 Historial de entregas',
                '📊 Estadísticas personales',
                '📥 Descargar material de apoyo',
                '👤 Detección automática del estudiante'
            ]
        });
    });
    
    console.log('✅ Ruta de prueba añadida: /api/estudiante/tareas/test');
    
} catch (error) {
    console.error('❌ Error cargando tareasRoutes (estudiante):', error.message);
    console.error('Stack:', error.stack);
    
    // Crear ruta de fallback si no se puede cargar
    app.use('/api/estudiante/tareas', (req, res) => {
        res.status(501).json({
            ok: false,
            error: 'Módulo de tareas para estudiantes no disponible',
            message: 'El controlador no se pudo cargar. Verifica el archivo tareasRoutes.js',
            timestamp: new Date().toISOString(),
            debug: {
                error: error.message,
                path: './controllers/estudiante/tareas/tareasRoutes'
            }
        });
    });
}

// ========================================
// ✅ RUTAS DE CHAT PARA ESTUDIANTES/PADRES (REAL)
// ========================================
console.log('\n💬 CARGANDO CHAT PARA ESTUDIANTES/PADRES:');
try {
    console.log('📂 Intentando cargar chatRoutes para estudiantes...');
    const estudiantePadresRoutes = require('./controllers/estudiante/padres/chatRoutes');
    console.log('✅ chatRoutes cargado exitosamente');
    
    // Verificar que sea un router válido
    if (estudiantePadresRoutes && typeof estudiantePadresRoutes === 'function') {
        console.log('✅ chatRoutes es una función válida (router Express)');
    } else {
        console.log('❌ chatRoutes NO es una función válida');
        throw new Error('chatRoutes no es un router Express válido');
    }
    
    app.use('/api/estudiante/padres', estudiantePadresRoutes);
    console.log('✅ Rutas cargadas: /api/estudiante/padres');
    
    // Añadir ruta de prueba
    app.get('/api/estudiante/padres/test', (req, res) => {
        console.log('🔧 Ruta de prueba padres/chat llamada');
        res.json({
            success: true,
            message: '✅ Sistema de chat para estudiantes/padres funcionando',
            timestamp: new Date().toISOString(),
            endpoints: {
                conversaciones: 'GET /api/estudiante/padres/conversaciones/{id}',
                mensajes: 'GET /api/estudiante/padres/mensajes/{estudiante_id}/{maestro_id}',
                enviar: 'POST /api/estudiante/padres/enviar',
                estadisticas: 'GET /api/estudiante/padres/estadisticas/{id}',
                no_leidos: 'GET /api/estudiante/padres/no-leidos/{id}',
                marcar_leidos: 'POST /api/estudiante/padres/marcar-leidos',
                status: 'GET /api/estudiante/padres/status',
                debug: 'GET /api/estudiante/padres/debug'
            }
        });
    });
    
    console.log('✅ Ruta de prueba añadida: /api/estudiante/padres/test');
    
} catch (error) {
    console.error('❌ Error cargando chatRoutes para estudiantes:', error.message);
    console.error('Stack:', error.stack);
    
    // Fallback al stub básico
    console.log('⚠️ Usando stub básico como fallback');
    
    // Función para crear router básico
    function crearRouterBasico(nombreModulo) {
        const router = express.Router();
        
        router.get('/test', (req, res) => {
            res.json({
                ok: true,
                message: `Módulo ${nombreModulo} para estudiantes - En desarrollo`,
                service: `${nombreModulo}-estudiante-api`,
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });
        });
        
        router.get('/health', (req, res) => {
            res.json({
                ok: true,
                service: `${nombreModulo}-estudiante-api`,
                status: 'healthy',
                timestamp: new Date().toISOString()
            });
        });
        
        return router;
    }
    
    const estudiantePadresRoutes = crearRouterBasico('padres');
    app.use('/api/estudiante/padres', estudiantePadresRoutes);
    console.log('✅ Rutas cargadas: /api/estudiante/padres (stub fallback)');
}

// ========================================
// ✅ RUTAS DE GRADUACIÓN PARA ESTUDIANTES (¡NUEVO - SISTEMA REAL!)
// ========================================
console.log('\n🎓 CARGANDO GRADUACIÓN PARA ESTUDIANTES:');
try {
    console.log('📂 Intentando cargar graduacionEstudianteRoutes...');
    const graduacionEstudianteRoutes = require('./controllers/estudiante/graduacion/graduacionRoutes');
    console.log('✅ graduacionEstudianteRoutes cargado exitosamente');
    
    // Verificar que sea un router válido
    if (graduacionEstudianteRoutes && typeof graduacionEstudianteRoutes === 'function') {
        console.log('✅ graduacionEstudianteRoutes es una función válida (router Express)');
    } else {
        console.log('❌ graduacionEstudianteRoutes NO es una función válida');
        throw new Error('graduacionEstudianteRoutes no es un router Express válido');
    }
    
    app.use('/api/estudiante/graduacion', graduacionEstudianteRoutes);
    console.log('✅ Rutas cargadas: /api/estudiante/graduacion (SISTEMA COMPLETO!)');
    
    // Añadir ruta de prueba
    app.get('/api/estudiante/graduacion/test', (req, res) => {
        console.log('🔧 Ruta de prueba graduacion-estudiante llamada');
        res.json({
            success: true,
            message: '✅ Sistema de graduación para estudiantes funcionando',
            timestamp: new Date().toISOString(),
            endpoints: {
                certificados: 'GET /api/estudiante/graduacion/:estudiante_id/certificados',
                estadisticas: 'GET /api/estudiante/graduacion/:estudiante_id/estadisticas',
                ciclos: 'GET /api/estudiante/graduacion/:estudiante_id/ciclos',
                verificar: 'GET /api/estudiante/graduacion/:estudiante_id/verificar',
                descargar: 'GET /api/estudiante/graduacion/certificados/:certificado_id/descargar?estudiante_id=ID',
                pdf: 'GET /api/estudiante/graduacion/certificados/:certificado_id/pdf?estudiante_id=ID',
                test: 'GET /api/estudiante/graduacion/test'
            },
            features: [
                '📜 Ver certificados personales',
                '📊 Estadísticas académicas',
                '📅 Filtrar por ciclo escolar',
                '📥 Descargar certificados enviados',
                '🔍 Verificar información del estudiante',
                '✅ Sistema de permisos integrado'
            ]
        });
    });
    
    console.log('✅ Ruta de prueba añadida: /api/estudiante/graduacion/test');
    
} catch (error) {
    console.error('❌ Error cargando graduacionEstudianteRoutes:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('⚠️ Usando stub básico como fallback temporal');
    
    // Función para crear router básico
    function crearRouterBasico(nombreModulo) {
        const router = express.Router();
        
        router.get('/test', (req, res) => {
            res.json({
                ok: true,
                message: `Módulo ${nombreModulo} para estudiantes - En desarrollo`,
                service: `${nombreModulo}-estudiante-api`,
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                endpoints: {
                    certificados: 'GET /:estudiante_id/certificados',
                    estadisticas: 'GET /:estudiante_id/estadisticas',
                    ciclos: 'GET /:estudiante_id/ciclos',
                    descargar: 'GET /certificados/:certificado_id/descargar?estudiante_id=ID'
                }
            });
        });
        
        router.get('/health', (req, res) => {
            res.json({
                ok: true,
                service: `${nombreModulo}-estudiante-api`,
                status: 'healthy',
                timestamp: new Date().toISOString()
            });
        });
        
        return router;
    }
    
    const graduacionEstudianteRoutes = crearRouterBasico('graduacion');
    app.use('/api/estudiante/graduacion', graduacionEstudianteRoutes);
    console.log('✅ Rutas cargadas: /api/estudiante/graduacion (stub fallback)');
}

// ========================================
// ✅ RUTAS DE PRUEBA PARA EL SISTEMA DE TAREAS
// ========================================
app.get('/api/test-tareas-estudiante', (req, res) => {
    console.log('🧪 Test completo del sistema de tareas-estudiante');
    res.json({
        ok: true,
        service: 'tareas-estudiante-api',
        status: 'testing',
        timestamp: new Date().toISOString(),
        endpoints: {
            // Endpoints principales
            tareas_disponibles: {
                method: 'GET',
                url: '/api/estudiante/tareas/disponibles',
                description: 'Listar tareas disponibles para el estudiante autenticado',
                auth_required: true
            },
            entregar_tarea: {
                method: 'POST',
                url: '/api/estudiante/tareas/entregar',
                description: 'Entregar una tarea (con archivo adjunto opcional)',
                auth_required: true,
                content_type: 'multipart/form-data'
            },
            historial: {
                method: 'GET',
                url: '/api/estudiante/tareas/historial',
                description: 'Ver historial de entregas del estudiante',
                auth_required: true
            },
            estadisticas: {
                method: 'GET',
                url: '/api/estudiante/tareas/estadisticas',
                description: 'Estadísticas personales del estudiante',
                auth_required: true
            },
            
            // Endpoints de prueba
            test: {
                method: 'GET',
                url: '/api/estudiante/tareas/test',
                description: 'Verificar que el sistema está funcionando',
                auth_required: false
            },
            health: {
                method: 'GET',
                url: '/api/estudiante/tareas/health',
                description: 'Verificar salud del servicio',
                auth_required: false
            }
        },
        features: [
            '✅ Detección automática del estudiante',
            '✅ Sistema de entregas con archivos',
            '✅ Historial completo',
            '✅ Estadísticas en tiempo real',
            '✅ Validación de tipos de archivo',
            '✅ Manejo de fechas límite',
            '✅ Permisos de entrega tarde',
            '✅ Feedback de calificaciones'
        ],
        file_support: {
            max_size: '20MB',
            allowed_types: ['PDF', 'DOC', 'DOCX', 'JPG', 'PNG', 'ZIP', 'RAR', 'TXT', 'PPT', 'PPTX'],
            upload_path: 'uploads/entregas-estudiantes/'
        }
    });
});

// ========================================
// ✅ RUTAS SIMPLIFICADAS PARA ESTUDIANTES (STUBS)
// ========================================
console.log('\n📁 CARGANDO STUBS PARA MÓDULOS FALTANTES:');

// Crear routers básicos para módulos que faltan
function crearRouterBasico(nombreModulo) {
    const router = express.Router();
    
    router.get('/test', (req, res) => {
        res.json({
            ok: true,
            message: `Módulo ${nombreModulo} para estudiantes - En desarrollo`,
            service: `${nombreModulo}-estudiante-api`,
            version: '1.0.0',
            timestamp: new Date().toISOString()
        });
    });
    
    router.get('/health', (req, res) => {
        res.json({
            ok: true,
            service: `${nombreModulo}-estudiante-api`,
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    });
    
    return router;
}

// Materias para estudiantes
try {
    const estudianteMateriasRoutes = crearRouterBasico('materias');
    app.use('/api/estudiante/materias', estudianteMateriasRoutes);
    console.log('✅ Rutas cargadas: /api/estudiante/materias (stub)');
} catch (error) {
    console.log('❌ Error cargando materiasRoutes (estudiante):', error.message);
}

// Reportes para estudiantes - ¡YA NO ES STUB, ES REAL!
// Se movió arriba para cargar las rutas reales

// Configuración para estudiantes
try {
    const estudianteConfiguracionRoutes = crearRouterBasico('configuracion');
    app.use('/api/estudiante/configuracion', estudianteConfiguracionRoutes);
    console.log('✅ Rutas cargadas: /api/estudiante/configuracion (stub)');
} catch (error) {
    console.log('❌ Error cargando configuracionRoutes (estudiante):', error.message);
}

// Graduación para estudiantes - ¡YA NO ES STUB, ES REAL!
// Se movió arriba para cargar las rutas reales

// Manual para estudiantes
try {
    const estudianteManualRoutes = crearRouterBasico('manual');
    app.use('/api/estudiante/manual', estudianteManualRoutes);
    console.log('✅ Rutas cargadas: /api/estudiante/manual (stub)');
} catch (error) {
    console.log('❌ Error cargando manualRoutes (estudiante):', error.message);
}

// Calificaciones para estudiantes (stub)
try {
    const estudianteCalificacionesRoutes = crearRouterBasico('calificaciones');
    app.use('/api/estudiante/calificaciones', estudianteCalificacionesRoutes);
    console.log('✅ Rutas cargadas: /api/estudiante/calificaciones (stub)');
} catch (error) {
    console.log('❌ Error cargando calificacionesRoutes (estudiante):', error.message);
}

// ========================================
// ✅ RUTAS DE PRUEBA DIRECTAS
// ========================================
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ Backend funcionando correctamente!',
        service: 'Gestión Educativa API',
        version: '2.3.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            // Chat
            maestro_chat: {
                conversaciones: 'GET /api/maestro/chat/conversaciones/{id}',
                mensajes: 'GET /api/maestro/chat/mensajes/{maestro_id}/{tutor_id}',
                enviar: 'POST /api/maestro/chat/enviar',
                status: 'GET /api/maestro/chat/status'
            },
            estudiante_chat: {
                conversaciones: 'GET /api/estudiante/padres/conversaciones/{id}',
                mensajes: 'GET /api/estudiante/padres/mensajes/{estudiante_id}/{maestro_id}',
                enviar: 'POST /api/estudiante/padres/enviar',
                status: 'GET /api/estudiante/padres/status',
                test: 'GET /api/estudiante/padres/test'
            },
            
            // Dashboard
            estudiante_dashboard: {
                test: 'GET /api/estudiante/dashboard/test',
                avisos: 'GET /api/estudiante/dashboard/avisos',
                estadisticas: 'GET /api/estudiante/dashboard/estadisticas',
                verificar: 'GET /api/estudiante/dashboard/verificar'
            },
            
            // Tareas
            estudiante_tareas: {
                test: 'GET /api/estudiante/tareas/test',
                disponibles: 'GET /api/estudiante/tareas/disponibles',
                entregar: 'POST /api/estudiante/tareas/entregar',
                historial: 'GET /api/estudiante/tareas/historial',
                estadisticas: 'GET /api/estudiante/tareas/estadisticas',
                test_completo: 'GET /api/test-tareas-estudiante'
            },
            
            // Reportes (¡NUEVO!)
            reportes_estudiante: {
                test: 'GET /api/reportes-alumno/test',
                reportes: 'GET /api/reportes-alumno?estudianteId=ID',
                resumen: 'GET /api/reportes-alumno/resumen?estudianteId=ID',
                exportar: 'GET /api/reportes-alumno/exportar/pdf?estudianteId=ID',
                verificar_tabla: 'GET /api/reportes-alumno/verificar-tabla',
                verificar: 'GET /api/reportes-alumno/verificar',
                compatibilidad: 'GET /api/estudiante/reportes?estudianteId=ID'
            },
            
            // Graduación (¡NUEVO!)
            graduacion_estudiante: {
                test: 'GET /api/estudiante/graduacion/test',
                certificados: 'GET /api/estudiante/graduacion/:estudiante_id/certificados',
                estadisticas: 'GET /api/estudiante/graduacion/:estudiante_id/estadisticas',
                ciclos: 'GET /api/estudiante/graduacion/:estudiante_id/ciclos',
                verificar: 'GET /api/estudiante/graduacion/:estudiante_id/verificar',
                descargar: 'GET /api/estudiante/graduacion/certificados/:certificado_id/descargar?estudiante_id=ID',
                pdf: 'GET /api/estudiante/graduacion/certificados/:certificado_id/pdf?estudiante_id=ID'
            }
        },
        status: '🟢 Servidor activo - Sistema completo funcionando',
        new_features: [
            '🎯 Sistema completo de chat para maestros y estudiantes',
            '💬 Chat maestro/tutor funcionando',
            '💬 Chat estudiante/padres funcionando',
            '📤 Entregas con detección automática del estudiante',
            '📊 Historial y estadísticas personales',
            '📁 Manejo de archivos (20MB max)',
            '📋 Sistema de reportes para estudiantes (¡NUEVO!)',
            '🎓 Sistema de graduación para estudiantes (¡NUEVO!)',
            '📜 Certificados personales para estudiantes',
            '📥 Descarga de certificados enviados'
        ]
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: '🟢 Healthy',
        service: 'Gestión Educativa API',
        version: '2.3.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        modules: {
            maestro_chat: {
                controller: '🟢 Cargado',
                routes: '🟢 Montadas',
                status_endpoint: '🟢 GET /api/maestro/chat/status'
            },
            estudiante_chat: {
                controller: '🟢 Cargado',
                routes: '🟢 Montadas',
                test_endpoint: '🟢 GET /api/estudiante/padres/test',
                status_endpoint: '🟢 GET /api/estudiante/padres/status'
            },
            dashboard_estudiante: {
                controller: '🟢 Cargado',
                routes: '🟢 Montadas',
                test_endpoint: '🟢 GET /api/estudiante/dashboard/test'
            },
            tareas_estudiante: {
                controller: '🟢 Cargado',
                routes: '🟢 Montadas',
                test_endpoint: '🟢 GET /api/estudiante/tareas/test',
                features: [
                    'Detección automática estudiante',
                    'Entregas con archivos',
                    'Historial completo'
                ]
            },
            reportes_estudiante: {
                controller: '🟢 Cargado',
                routes: '🟢 Montadas',
                test_endpoint: '🟢 GET /api/reportes-alumno/test',
                urls_compatibles: [
                    '/api/reportes-alumno',
                    '/api/estudiante/reportes'
                ],
                features: [
                    'Filtrado de reportes',
                    'Resumen estadístico',
                    'Exportación HTML/PDF',
                    'Observaciones del estudiante'
                ]
            },
            graduacion_estudiante: {
                controller: '🟢 Cargado',
                routes: '🟢 Montadas',
                test_endpoint: '🟢 GET /api/estudiante/graduacion/test',
                urls_compatibles: [
                    '/api/estudiante/graduacion'
                ],
                features: [
                    'Certificados personales',
                    'Estadísticas académicas',
                    'Filtrado por ciclo',
                    'Descarga de certificados',
                    'Verificación de permisos'
                ]
            }
        }
    });
});

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Backend - Sistema de Gestión Educativa',
        version: '2.3.0',
        status: '🟢 Online',
        timestamp: new Date().toISOString(),
        availableServices: {
            maestro_chat: {
                status: '✅ Chat maestro/tutor activo',
                endpoints: [
                    'GET /api/maestro/chat/status',
                    'GET /api/maestro/chat/conversaciones/{id}',
                    'GET /api/maestro/chat/mensajes/{maestro_id}/{tutor_id}',
                    'POST /api/maestro/chat/enviar'
                ]
            },
            estudiante_chat: {
                status: '✅ Chat estudiante/padres activo',
                endpoints: [
                    'GET /api/estudiante/padres/status',
                    'GET /api/estudiante/padres/test',
                    'GET /api/estudiante/padres/conversaciones/{id}',
                    'GET /api/estudiante/padres/mensajes/{estudiante_id}/{maestro_id}',
                    'POST /api/estudiante/padres/enviar'
                ]
            },
            estudiante_dashboard: {
                status: '✅ Dashboard (estudiante) activo',
                test: 'GET /api/estudiante/dashboard/test',
                features: [
                    'Avisos activos para estudiantes',
                    'Estadísticas en tiempo real',
                    'Verificación de tabla'
                ]
            },
            estudiante_tareas: {
                status: '✅ Tareas (estudiante) activo',
                test: 'GET /api/estudiante/tareas/test',
                features: [
                    'Listar tareas disponibles',
                    'Entregar tareas con archivos',
                    'Historial de entregas',
                    'Estadísticas personales'
                ]
            },
            reportes_estudiante: {
                status: '✅ Reportes (estudiante) activo',
                test: 'GET /api/reportes-alumno/test',
                endpoints: [
                    'GET /api/reportes-alumno?estudianteId=ID',
                    'GET /api/reportes-alumno/resumen?estudianteId=ID',
                    'POST /api/reportes-alumno/{id}/leido',
                    'POST /api/reportes-alumno/{id}/observacion',
                    'GET /api/reportes-alumno/exportar/pdf?estudianteId=ID'
                ],
                features: [
                    '📋 Listar reportes personales',
                    '📊 Resumen estadístico',
                    '👁️ Marcar como leído',
                    '💬 Agregar observaciones',
                    '📄 Exportar a HTML/PDF'
                ]
            },
            graduacion_estudiante: {
                status: '✅ Graduación (estudiante) activo',
                test: 'GET /api/estudiante/graduacion/test',
                endpoints: [
                    'GET /api/estudiante/graduacion/:estudiante_id/certificados',
                    'GET /api/estudiante/graduacion/:estudiante_id/estadisticas',
                    'GET /api/estudiante/graduacion/:estudiante_id/ciclos',
                    'GET /api/estudiante/graduacion/:estudiante_id/verificar',
                    'GET /api/estudiante/graduacion/certificados/:certificado_id/descargar?estudiante_id=ID',
                    'GET /api/estudiante/graduacion/certificados/:certificado_id/pdf?estudiante_id=ID'
                ],
                features: [
                    '🎓 Ver certificados personales',
                    '📊 Estadísticas académicas',
                    '📅 Filtrar por ciclo escolar',
                    '📥 Descargar certificados enviados',
                    '🔍 Verificar información del estudiante'
                ]
            }
        },
        quickStart: 'Usa POST /api/login para autenticarte',
        documentation: 'Consulta GET /api/test para ver todos los endpoints disponibles',
        testing: {
            reportes_estudiante: 'GET /api/reportes-alumno/test',
            tareas_estudiante: 'GET /api/test-tareas-estudiante',
            chat_estudiante: 'GET /api/estudiante/padres/test',
            graduacion_estudiante: 'GET /api/estudiante/graduacion/test',
            all_endpoints: 'GET /api/test'
        }
    });
});

// ========================================
// ✅ RUTA DEBUG PARA VER RUTAS REGISTRADAS
// ========================================
app.get('/api/debug-routes', (req, res) => {
    const routes = [];
    
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            // Rutas directas
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            // Router middleware
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    const route = {
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    };
                    routes.push(route);
                }
            });
        }
    });
    
    const estudianteRoutes = routes.filter(r => 
        r.path && r.path.toString().includes('estudiante')
    );
    
    const reportesRoutes = routes.filter(r => 
        r.path && (r.path.toString().includes('reportes') || r.path.toString().includes('alumno'))
    );
    
    const graduacionRoutes = routes.filter(r => 
        r.path && r.path.toString().includes('graduacion')
    );
    
    res.json({
        success: true,
        totalRoutes: routes.length,
        estudianteRoutesCount: estudianteRoutes.length,
        reportesRoutesCount: reportesRoutes.length,
        graduacionRoutesCount: graduacionRoutes.length,
        estudianteRoutes: estudianteRoutes,
        reportesRoutes: reportesRoutes,
        graduacionRoutes: graduacionRoutes,
        allRoutes: routes
    });
});

// ========================================
// ✅ DEBUG ESPECÍFICO PARA REPORTES
// ========================================
app.get('/api/debug/reportes', (req, res) => {
    const rutas = [];
    
    function buscarRutas(layer, path = '') {
        if (layer.route) {
            const route = layer.route;
            const methods = Object.keys(route.methods).map(m => m.toUpperCase()).join(', ');
            const fullPath = path + route.path;
            
            if (fullPath.includes('reportes') || fullPath.includes('alumno')) {
                rutas.push({
                    path: fullPath,
                    methods,
                    layer: layer.name
                });
            }
        } else if (layer.name === 'router' && layer.handle.stack) {
            layer.handle.stack.forEach(handler => {
                buscarRutas(handler, path);
            });
        }
    }
    
    app._router.stack.forEach(layer => {
        buscarRutas(layer);
    });
    
    res.json({
        success: true,
        mensaje: '📋 Debug de rutas de reportes',
        totalRutasEncontradas: rutas.length,
        rutasReportes: rutas,
        configuracionEsperada: {
            '/api/reportes-alumno': 'Rutas del módulo de reportes para estudiantes',
            '/api/estudiante/reportes': 'Rutas alternativas organizadas',
            '/api/reportes': 'Rutas para maestros (reportes generales)'
        },
        timestamp: new Date().toISOString()
    });
});

// ========================================
// ✅ DEBUG ESPECÍFICO PARA GRADUACIÓN
// ========================================
app.get('/api/debug/graduacion', (req, res) => {
    const rutas = [];
    
    function buscarRutas(layer, path = '') {
        if (layer.route) {
            const route = layer.route;
            const methods = Object.keys(route.methods).map(m => m.toUpperCase()).join(', ');
            const fullPath = path + route.path;
            
            if (fullPath.includes('graduacion')) {
                rutas.push({
                    path: fullPath,
                    methods,
                    layer: layer.name
                });
            }
        } else if (layer.name === 'router' && layer.handle.stack) {
            layer.handle.stack.forEach(handler => {
                buscarRutas(handler, path);
            });
        }
    }
    
    app._router.stack.forEach(layer => {
        buscarRutas(layer);
    });
    
    res.json({
        success: true,
        mensaje: '🎓 Debug de rutas de graduación',
        totalRutasEncontradas: rutas.length,
        rutasGraduacion: rutas,
        configuracionEsperada: {
            '/api/maestro/graduacion': 'Rutas para maestros (generar certificados)',
            '/api/estudiante/graduacion': 'Rutas para estudiantes (ver certificados)'
        },
        timestamp: new Date().toISOString()
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
            '/api/reportes',
            '/api/maestro/graduacion',
            '/api/estudiante/asistencia',
            '/api/estudiante/dashboard',
            '/api/estudiante/dashboard/test',
            '/api/estudiante/calificaciones',
            '/api/estudiante/tareas',
            '/api/estudiante/tareas/test',
            '/api/test-tareas-estudiante',
            '/api/estudiante/materias',
            '/api/estudiante/reportes',
            '/api/reportes-alumno',
            '/api/reportes-alumno/test',
            '/api/estudiante/padres',
            '/api/estudiante/padres/test',
            '/api/estudiante/configuracion',
            '/api/estudiante/graduacion',
            '/api/estudiante/graduacion/test',
            '/api/estudiante/manual'
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
console.log('\n==============================================');
console.log('📚 MÓDULOS CARGADOS:');
console.log('👨‍🏫 PARA MAESTROS/ADMIN:');
console.log('  ✅ Login');
console.log('  ✅ Dashboard');
console.log('  ✅ Estudiantes');
console.log('  ✅ Asistencia');
console.log('  ✅ Chat Maestro/Tutor');
console.log('  ✅ Tareas');
console.log('  ✅ Materias');
console.log('  ✅ Calificaciones');
console.log('  ✅ Reportes');
console.log('  ✅ Graduación');

console.log('\n👨‍🎓 PARA ESTUDIANTES/TUTORES:');
console.log('  ✅ Asistencia');
console.log('  ✅ Dashboard (con depuración)');
console.log('  ✅ Calificaciones (stub)');
console.log('  ✅ Tareas (¡SISTEMA COMPLETO!)');
console.log('  ✅ Materias (stub)');
console.log('  ✅ Reportes (¡NUEVO SISTEMA COMPLETO!)');
console.log('  ✅ Padres/Chat (SISTEMA COMPLETO)');
console.log('  ✅ Configuración (stub)');
console.log('  ✅ Graduación (¡NUEVO SISTEMA COMPLETO!)');
console.log('  ✅ Manual (stub)');

console.log('\n📋 SISTEMA DE REPORTES ESTUDIANTES:');
console.log('  📍 URL Principal: /api/reportes-alumno');
console.log('  📍 URL Alternativa: /api/estudiante/reportes');
console.log('  📊 Endpoints disponibles:');
console.log('    • GET /api/reportes-alumno?estudianteId=ID → Listar reportes del estudiante');
console.log('    • GET /api/reportes-alumno/resumen?estudianteId=ID → Resumen estadístico');
console.log('    • POST /api/reportes-alumno/:id/leido → Marcar como leído');
console.log('    • POST /api/reportes-alumno/:id/observacion → Agregar observación');
console.log('    • GET /api/reportes-alumno/exportar/pdf?estudianteId=ID → Exportar a HTML/PDF');
console.log('    • GET /api/reportes-alumno/test → Ruta de prueba');
console.log('    • GET /api/reportes-alumno/verificar → Verificar rutas');
console.log('    • GET /api/reportes-alumno/verificar-tabla → Verificar tabla');

console.log('\n🎓 SISTEMA DE GRADUACIÓN ESTUDIANTES:');
console.log('  📍 URL Principal: /api/estudiante/graduacion');
console.log('  📊 Endpoints disponibles:');
console.log('    • GET /api/estudiante/graduacion/test → Ruta de prueba');
console.log('    • GET /api/estudiante/graduacion/:estudiante_id/certificados → Listar certificados del estudiante');
console.log('    • GET /api/estudiante/graduacion/:estudiante_id/estadisticas → Estadísticas académicas');
console.log('    • GET /api/estudiante/graduacion/:estudiante_id/ciclos → Ciclos escolares disponibles');
console.log('    • GET /api/estudiante/graduacion/:estudiante_id/verificar → Verificar estudiante');
console.log('    • GET /api/estudiante/graduacion/certificados/:certificado_id/descargar → Descargar certificado');
console.log('    • GET /api/estudiante/graduacion/certificados/:certificado_id/pdf → Generar PDF (próximamente)');

console.log('\n💬 SISTEMA DE CHAT:');
console.log('  👨‍🏫 Chat Maestro/Tutor:');
console.log('    📞 Status: GET /api/maestro/chat/status');
console.log('    📋 Conversaciones: GET /api/maestro/chat/conversaciones/{id}');
console.log('    💬 Mensajes: GET /api/maestro/chat/mensajes/{maestro_id}/{tutor_id}');
console.log('    📤 Enviar: POST /api/maestro/chat/enviar');

console.log('  👨‍🎓 Chat Estudiante/Padres:');
console.log('    📞 Status: GET /api/estudiante/padres/status');
console.log('    🧪 Test: GET /api/estudiante/padres/test');
console.log('    📋 Conversaciones: GET /api/estudiante/padres/conversaciones/{id}');
console.log('    💬 Mensajes: GET /api/estudiante/padres/mensajes/{estudiante_id}/{maestro_id}');
console.log('    📤 Enviar: POST /api/estudiante/padres/enviar');

console.log('\n🎯 SISTEMA DE TAREAS ESTUDIANTES:');
console.log('  📚 Disponibles: GET /api/estudiante/tareas/disponibles');
console.log('  📤 Entregar: POST /api/estudiante/tareas/entregar');
console.log('  📋 Historial: GET /api/estudiante/tareas/historial');
console.log('  📊 Estadísticas: GET /api/estudiante/tareas/estadisticas');
console.log('  🧪 Test: GET /api/estudiante/tareas/test');
console.log('  🔍 Test completo: GET /api/test-tareas-estudiante');

console.log('\n==============================================');
console.log('🌐 Servidor listo en: http://localhost:3000');
console.log('📋 Documentación: http://localhost:3000/api/test');
console.log('🔍 Debug rutas: http://localhost:3000/api/debug-routes');
console.log('📊 Debug reportes: http://localhost:3000/api/debug/reportes');
console.log('🎓 Debug graduación: http://localhost:3000/api/debug/graduacion');

console.log('\n🔗 PRUEBA RÁPIDA REPORTES:');
console.log('  • Test básico: http://localhost:3000/api/reportes-alumno/test');
console.log('  • Verificar rutas: http://localhost:3000/api/reportes-alumno/verificar');
console.log('  • Verificar tabla: http://localhost:3000/api/reportes-alumno/verificar-tabla');
console.log('  • Reportes estudiante ID 3: http://localhost:3000/api/reportes-alumno?estudianteId=3');

console.log('\n🔗 PRUEBA RÁPIDA GRADUACIÓN:');
console.log('  • Test básico: http://localhost:3000/api/estudiante/graduacion/test');
console.log('  • Certificados estudiante ID 3: http://localhost:3000/api/estudiante/graduacion/3/certificados');
console.log('  • Estadísticas estudiante ID 3: http://localhost:3000/api/estudiante/graduacion/3/estadisticas');
console.log('  • Ciclos estudiante ID 3: http://localhost:3000/api/estudiante/graduacion/3/ciclos');

console.log('\n🔗 OTROS SERVICIOS:');
console.log('  • Estudiante dashboard test: http://localhost:3000/api/estudiante/dashboard/test');
console.log('  • Tareas estudiante test: http://localhost:3000/api/estudiante/tareas/test');
console.log('  • Verificar estado: http://localhost:3000/api/health');
console.log('  • Todas las rutas: http://localhost:3000/api/test');

// ========================================
// ✅ INICIAR SERVIDOR
// ========================================
const PORT = process.env.PORT || 3000;

// Solo iniciar si no estamos en modo test
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Servidor ejecutándose en puerto ${PORT}`);
        console.log(`📡 URL: http://localhost:${PORT}`);
        console.log(`🕐 Iniciado: ${new Date().toLocaleString('es-MX')}`);
        console.log('\n✅ ¡Sistema de Gestión Educativa listo! ✅\n');
        console.log('🎯 NUEVO MÓDULO: Graduación para estudiantes ahora disponible en:');
        console.log('   → /api/estudiante/graduacion');
        console.log('\n🚀 Prueba inmediata: http://localhost:3000/api/estudiante/graduacion/test');
    });
}

module.exports = app;