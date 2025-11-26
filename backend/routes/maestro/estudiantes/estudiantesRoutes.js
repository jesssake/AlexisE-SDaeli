// routes/maestro/estudiantes/estudiantesRoutes.js
const express = require('express');
const router = express.Router();
const estudiantesController = require('../../../controllers/maestro/estudiantes/estudiantesController');

// Rutas para estudiantes
router.get('/', estudiantesController.getEstudiantes);
router.get('/metricas', estudiantesController.getMetricas);
router.get('/:id', estudiantesController.getEstudianteById);
router.post('/', estudiantesController.crearEstudiante);
router.put('/:id', estudiantesController.actualizarEstudiante);
router.delete('/:id', estudiantesController.eliminarEstudiante);

module.exports = router;
