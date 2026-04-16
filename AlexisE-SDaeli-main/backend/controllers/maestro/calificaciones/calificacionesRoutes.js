const express = require('express');
const router = express.Router();
const calificacionesController = require('./calificacionesController');

// Obtener todas las calificaciones
router.get('/completas', calificacionesController.obtenerCalificaciones);

// Obtener calificaciones por estudiante
router.get('/estudiante/:id', calificacionesController.obtenerCalificacionesPorEstudiante);

// Obtener resumen de calificaciones
router.get('/resumen', calificacionesController.obtenerResumenCalificaciones);

// Actualizar calificación de tarea
router.post('/actualizar', calificacionesController.actualizarCalificacion);

module.exports = router;