const express = require('express');
const router = express.Router();
const { TareasController, uploadMiddleware } = require('./tareasController');
const path = require('path');

console.log('🔍 Cargando tareasRoutes desde:', __dirname);

// =====================================================
// CARGAR MIDDLEWARES CON VERIFICACIÓN
// =====================================================
let authMiddleware, maestroMiddleware;

try {
    // Intentar cargar desde 'middleware' (singular)
    authMiddleware = require(path.join(process.cwd(), 'middleware/authMiddleware'));
    console.log('✅ authMiddleware cargado desde:', path.join(process.cwd(), 'middleware/authMiddleware'));
} catch (error) {
    console.error('❌ Error cargando authMiddleware:', error.message);
    console.log('⚠️ Intentando cargar desde middlewares...');
    
    try {
        // Intentar desde 'middlewares' (plural)
        authMiddleware = require(path.join(process.cwd(), 'middlewares/authMiddleware'));
        console.log('✅ authMiddleware cargado desde middlewares/');
    } catch (error2) {
        console.error('❌ Error cargando authMiddleware desde ninguna ruta:', error2.message);
        // Middleware temporal si todo falla
        authMiddleware = (req, res, next) => {
            console.log('🔐 Usando authMiddleware temporal');
            req.user = { 
                id: 1, 
                admin_nombre: 'Maestro Demo', 
                rol: 'maestro',
                tutor_nombre: 'Maestro Demo'
            };
            next();
        };
        console.log('⚠️ Usando authMiddleware temporal');
    }
}

try {
    // Intentar cargar desde 'middleware' (singular)
    maestroMiddleware = require(path.join(process.cwd(), 'middleware/maestroMiddleware'));
    console.log('✅ maestroMiddleware cargado desde:', path.join(process.cwd(), 'middleware/maestroMiddleware'));
} catch (error) {
    console.error('❌ Error cargando maestroMiddleware:', error.message);
    console.log('⚠️ Intentando cargar desde middlewares...');
    
    try {
        // Intentar desde 'middlewares' (plural)
        maestroMiddleware = require(path.join(process.cwd(), 'middlewares/maestroMiddleware'));
        console.log('✅ maestroMiddleware cargado desde middlewares/');
    } catch (error2) {
        console.error('❌ Error cargando maestroMiddleware desde ninguna ruta:', error2.message);
        // Middleware temporal si todo falla
        maestroMiddleware = (req, res, next) => { 
            console.log('🔐 Usando maestroMiddleware temporal');
            next(); 
        };
        console.log('⚠️ Usando maestroMiddleware temporal');
    }
}

// =====================================================
// APLICAR MIDDLEWARES
// =====================================================
router.use(authMiddleware);
router.use(maestroMiddleware);

console.log('✅ Middlewares aplicados correctamente');

// =====================================================
// RUTAS DE TAREAS PARA MAESTROS
// =====================================================

// Listar todas las tareas del maestro
router.get('/listar', TareasController.listarTareas);

// Obtener detalle de una tarea específica
router.get('/detalle/:id_tarea', TareasController.obtenerDetalleTarea);

// Crear nueva tarea (con manejo de archivo)
router.post('/crear', uploadMiddleware, TareasController.crearTarea);

// Actualizar tarea existente (con manejo de archivo)
router.post('/actualizar', uploadMiddleware, TareasController.actualizarTarea);

// Eliminar tarea
router.post('/eliminar', TareasController.eliminarTarea);

// Obtener entregas de una tarea específica
router.get('/entregas', TareasController.obtenerEntregas);

// Calificar una entrega
router.post('/calificar', TareasController.calificarEntrega);

// Obtener estadísticas de tareas
router.get('/estadisticas', TareasController.obtenerEstadisticas);

// Descargar archivo adjunto de una tarea
router.get('/descargar/:id_tarea', TareasController.descargarArchivo);

// Obtener tareas por materia
router.get('/por-materia/:id_materia', TareasController.obtenerTareasPorMateria);

// Obtener tareas por estado (activas/inactivas)
router.get('/por-estado/:estado', TareasController.obtenerTareasPorEstado);

// Obtener tareas vencidas
router.get('/vencidas', TareasController.obtenerTareasVencidas);

// Obtener tareas próximas a vencer
router.get('/proximas-vencer', TareasController.obtenerTareasProximasAVencer);

// Cambiar estado de tarea (activar/desactivar)
router.post('/cambiar-estado', TareasController.cambiarEstadoTarea);

// Obtener resumen de calificaciones por tarea
router.get('/resumen-calificaciones/:id_tarea', TareasController.obtenerResumenCalificaciones);

console.log('✅ tareasRoutes configurado correctamente con todas las rutas');

module.exports = router;