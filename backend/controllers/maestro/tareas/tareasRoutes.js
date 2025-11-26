// =======================================================================
// RUTAS DE TAREAS DEL MAESTRO
// Ruta real: backend/controllers/maestro/tareas/tareasRoutes.js
// =======================================================================

const express = require('express');
const router = express.Router();

const tareasController = require('./tareasController');

// ======================================
// CRUD PRINCIPAL DE TAREAS
// ======================================

// Listar todas las tareas (con materia incluida)
router.get('/listar', tareasController.listarTareas);

// Crear tarea (con archivo y materia)
router.post('/crear', tareasController.crearTarea);

// Actualizar tarea (archivo opcional + materia)
router.post('/actualizar', tareasController.actualizarTarea);

// Eliminar archivo adjunto de tarea
router.post('/eliminar-archivo', tareasController.eliminarArchivo);

// Eliminar tarea completa (incluye entregas)
router.post('/eliminar', tareasController.eliminarTarea);

// ======================================
// ENTREGAS
// ======================================

// Obtener entregas de una tarea
router.get('/entregas', tareasController.obtenerEntregas);

// Calificar una entrega
router.post('/calificar', tareasController.calificarEntrega);

module.exports = router;
