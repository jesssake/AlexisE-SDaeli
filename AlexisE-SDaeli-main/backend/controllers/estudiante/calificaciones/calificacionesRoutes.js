// C:\Codigos\HTml\AlexisE-SDaeli-main\AlexisE-SDaeli-main\backend\controllers\estudiante\calificaciones\calificacionesRoutes.js
const express = require('express');
const router = express.Router();
const calificacionesController = require('./calificacionesController');

console.log('📚 Cargando rutas de calificaciones para estudiantes...');

// Obtener calificaciones por ID de estudiante
router.get('/:id', (req, res) => {
    console.log(`📥 GET /calificaciones/${req.params.id}`);
    calificacionesController.obtenerCalificacionesPorEstudiante(req, res);
});

// Obtener resumen de calificaciones
router.get('/:id/resumen', (req, res) => {
    console.log(`📊 GET /calificaciones/${req.params.id}/resumen`);
    calificacionesController.obtenerResumenCalificaciones(req, res);
});

// Obtener calificaciones por materia
router.get('/:estudiante_id/materia/:materia_id', (req, res) => {
    console.log(`📚 GET /calificaciones/${req.params.estudiante_id}/materia/${req.params.materia_id}`);
    calificacionesController.obtenerCalificacionesPorMateria(req, res);
});

// Endpoint de prueba
router.get('/test', (req, res) => {
    console.log('🧪 GET /calificaciones/test');
    calificacionesController.test(req, res);
});

console.log('✅ Rutas de calificaciones para estudiantes configuradas');
module.exports = router;