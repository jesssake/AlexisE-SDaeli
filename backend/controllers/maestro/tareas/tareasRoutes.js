const express = require('express');
const router = express.Router();
const { TareasController, uploadMiddleware } = require('./tareasController');

console.log('🔍 Cargando rutas de tareas...');

// =====================================================
// 🚀 RUTAS DE TAREAS PARA MAESTROS
// =====================================================

// Listar todas las tareas del maestro
router.get('/listar', (req, res) => {
    console.log('📥 GET /listar - Listando tareas del maestro');
    TareasController.listarTareas(req, res);
});

// Obtener detalle de una tarea específica
router.get('/detalle/:id_tarea', (req, res) => {
    console.log(`📥 GET /detalle/${req.params.id_tarea} - Obteniendo detalle`);
    TareasController.obtenerDetalleTarea(req, res);
});

// Crear nueva tarea (con manejo de archivo)
router.post('/crear', uploadMiddleware, (req, res) => {
    console.log('📝 POST /crear - Creando nueva tarea');
    TareasController.crearTarea(req, res);
});

// Actualizar tarea existente (con manejo de archivo)
router.post('/actualizar', uploadMiddleware, (req, res) => {
    console.log('🔄 POST /actualizar - Actualizando tarea');
    TareasController.actualizarTarea(req, res);
});

// Eliminar tarea
router.post('/eliminar', (req, res) => {
    console.log('🗑️ POST /eliminar - Eliminando tarea');
    TareasController.eliminarTarea(req, res);
});

// Obtener entregas de una tarea específica
router.get('/entregas', (req, res) => {
    console.log('📄 GET /entregas - Obteniendo entregas');
    TareasController.obtenerEntregas(req, res);
});

// Calificar una entrega
router.post('/calificar', (req, res) => {
    console.log('✍️ POST /calificar - Calificando entrega');
    TareasController.calificarEntrega(req, res);
});

// Obtener estadísticas de tareas
router.get('/estadisticas', (req, res) => {
    console.log('📊 GET /estadisticas - Obteniendo estadísticas');
    TareasController.obtenerEstadisticas(req, res);
});

// Descargar archivo adjunto de una tarea
router.get('/descargar/:id_tarea', (req, res) => {
    console.log(`📥 GET /descargar/${req.params.id_tarea} - Descargando archivo`);
    TareasController.descargarArchivo(req, res);
});

// Obtener tareas por materia
router.get('/por-materia/:id_materia', (req, res) => {
    console.log(`📚 GET /por-materia/${req.params.id_materia} - Tareas por materia`);
    TareasController.obtenerTareasPorMateria(req, res);
});

// Obtener tareas por estado (activas/inactivas)
router.get('/por-estado/:estado', (req, res) => {
    console.log(`🔘 GET /por-estado/${req.params.estado} - Tareas por estado`);
    TareasController.obtenerTareasPorEstado(req, res);
});

// Obtener tareas vencidas
router.get('/vencidas', (req, res) => {
    console.log('⏰ GET /vencidas - Tareas vencidas');
    TareasController.obtenerTareasVencidas(req, res);
});

// Obtener tareas próximas a vencer
router.get('/proximas-vencer', (req, res) => {
    console.log('🚨 GET /proximas-vencer - Tareas próximas a vencer');
    TareasController.obtenerTareasProximasAVencer(req, res);
});

// Cambiar estado de tarea (activar/desactivar)
router.post('/cambiar-estado', (req, res) => {
    console.log('🔄 POST /cambiar-estado - Cambiando estado de tarea');
    TareasController.cambiarEstadoTarea(req, res);
});

// Obtener resumen de calificaciones por tarea
router.get('/resumen-calificaciones/:id_tarea', (req, res) => {
    console.log(`📊 GET /resumen-calificaciones/${req.params.id_tarea} - Resumen de calificaciones`);
    TareasController.obtenerResumenCalificaciones(req, res);
});

// =====================================================
// 📊 ENDPOINTS DE SALUD Y PRUEBA
// =====================================================

// Endpoint de salud
router.get('/health', (req, res) => {
    console.log('❤️ GET /health - Verificando salud del servicio');
    res.json({
        ok: true,
        service: 'tareas-maestro-api',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            listar: 'GET /api/maestro/tareas/listar',
            crear: 'POST /api/maestro/tareas/crear',
            entregas: 'GET /api/maestro/tareas/entregas',
            calificar: 'POST /api/maestro/tareas/calificar',
            estadisticas: 'GET /api/maestro/tareas/estadisticas',
            test: 'GET /api/maestro/tareas/test'
        }
    });
});

// Endpoint de prueba simple
router.get('/test', (req, res) => {
    console.log('🧪 GET /test - Endpoint de prueba');
    res.json({
        ok: true,
        message: '✅ Sistema de tareas para maestros funcionando correctamente',
        service: 'tareas-maestro-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        features: [
            '📚 Gestión completa de tareas',
            '✍️ Calificación de entregas',
            '📊 Estadísticas detalladas',
            '📎 Manejo de archivos adjuntos',
            '👨‍🏫 Restricción por maestro',
            '📅 Filtros por trimestre y estado'
        ],
        testing: 'Para probar el sistema completo, visita GET /api/maestro/tareas/health'
    });
});

// Endpoint de verificación de base de datos
router.get('/verificar-db', async (req, res) => {
    try {
        console.log('🔍 GET /verificar-db - Verificando conexión a base de datos');
        const [result] = await db.query('SELECT COUNT(*) as count FROM tareas');
        res.json({
            ok: true,
            message: '✅ Conexión a base de datos exitosa',
            tareas_en_db: result[0].count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error verificando base de datos:', error);
        res.status(500).json({
            ok: false,
            error: 'Error al conectar con la base de datos',
            message: error.message
        });
    }
});

console.log('✅ tareasRoutes configurado con', router.stack.length, 'rutas');

module.exports = router;