const express = require('express');
const router = express.Router();
const { TareasController, uploadMiddleware } = require('./tareasController');

console.log('🔍 Cargando rutas de tareas para estudiantes...');

// =====================================================
// 🎒 RUTAS DE TAREAS PARA ESTUDIANTES
// =====================================================

// Listar tareas disponibles para el estudiante
router.get('/listar', (req, res) => {
    console.log('📥 GET /listar - Listando tareas disponibles');
    TareasController.listarTareas(req, res);
});

// Obtener detalle de una tarea específica
router.get('/detalle/:id_tarea', (req, res) => {
    console.log(`📥 GET /detalle/${req.params.id_tarea} - Obteniendo detalle de tarea`);
    TareasController.obtenerDetalleTarea(req, res);
});

// Obtener entregas del estudiante
router.get('/mis-entregas', (req, res) => {
    console.log('📥 GET /mis-entregas - Obteniendo entregas del estudiante');
    TareasController.obtenerMisEntregas(req, res);
});

// Entregar una tarea (con manejo de archivo)
router.post('/entregar', uploadMiddleware, (req, res) => {
    console.log('📤 POST /entregar - Entregando tarea');
    TareasController.entregarTarea(req, res);
});

// Actualizar entrega existente
router.post('/actualizar-entrega', uploadMiddleware, (req, res) => {
    console.log('🔄 POST /actualizar-entrega - Actualizando entrega');
    TareasController.actualizarEntrega(req, res);
});

// Obtener estado de una tarea específica
router.get('/estado/:id_tarea', (req, res) => {
    console.log(`📊 GET /estado/${req.params.id_tarea} - Obteniendo estado de tarea`);
    TareasController.obtenerEstadoTarea(req, res);
});

// Obtener estadísticas del estudiante
router.get('/estadisticas', (req, res) => {
    console.log('📈 GET /estadisticas - Obteniendo estadísticas del estudiante');
    TareasController.obtenerEstadisticasEstudiante(req, res);
});

// Descargar archivo adjunto de una tarea
router.get('/descargar/:id_tarea', (req, res) => {
    console.log(`📥 GET /descargar/${req.params.id_tarea} - Descargando archivo de tarea`);
    TareasController.descargarArchivoTarea(req, res);
});

// Descargar archivo de entrega del estudiante
router.get('/descargar-entrega/:id_entrega', (req, res) => {
    console.log(`📥 GET /descargar-entrega/${req.params.id_entrega} - Descargando archivo de entrega`);
    TareasController.descargarArchivoEntrega(req, res);
});

// Obtener tareas por materia
router.get('/por-materia/:id_materia', (req, res) => {
    console.log(`📚 GET /por-materia/${req.params.id_materia} - Tareas por materia`);
    TareasController.obtenerTareasPorMateria(req, res);
});

// Obtener tareas por estado (pendientes/entregadas)
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

// Obtener tareas no entregadas
router.get('/no-entregadas', (req, res) => {
    console.log('📭 GET /no-entregadas - Tareas no entregadas');
    TareasController.obtenerTareasNoEntregadas(req, res);
});

// Obtener historial de calificaciones
router.get('/calificaciones', (req, res) => {
    console.log('📊 GET /calificaciones - Historial de calificaciones');
    TareasController.obtenerHistorialCalificaciones(req, res);
});

// =====================================================
// 📊 ENDPOINTS DE SALUD Y PRUEBA
// =====================================================

// Endpoint de salud
router.get('/health', (req, res) => {
    console.log('❤️ GET /health - Verificando salud del servicio de estudiantes');
    res.json({
        ok: true,
        service: 'tareas-estudiante-api',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
            listar: 'GET /api/estudiante/tareas/listar',
            entregar: 'POST /api/estudiante/tareas/entregar',
            misEntregas: 'GET /api/estudiante/tareas/mis-entregas',
            estadisticas: 'GET /api/estudiante/tareas/estadisticas',
            test: 'GET /api/estudiante/tareas/test'
        }
    });
});

// Endpoint de prueba simple
router.get('/test', (req, res) => {
    console.log('🧪 GET /test - Endpoint de prueba para estudiantes');
    res.json({
        ok: true,
        message: '✅ Sistema de tareas para estudiantes funcionando correctamente',
        service: 'tareas-estudiante-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        features: [
            '📚 Visualización de tareas asignadas',
            '📤 Entrega de tareas con archivos adjuntos',
            '📊 Seguimiento de calificaciones',
            '📅 Gestión de fechas límite',
            '👨‍🎓 Interfaz adaptada a estudiantes',
            '📱 Sistema responsivo y moderno'
        ],
        testing: 'Para probar el sistema completo, visita GET /api/estudiante/tareas/health'
    });
});

console.log('✅ tareasRoutes (estudiante) configurado con', router.stack.length, 'rutas');

module.exports = router;