// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\estudiantes\estudiantesRoutes.js
const express = require('express');
const router = express.Router();

// Controlador
const estudiantesController = require('./estudiantesController');

// GET → obtener todos los estudiantes (usuarios)
router.get('/', estudiantesController.obtenerEstudiantes);

// POST → crear estudiante
router.post('/', estudiantesController.crearEstudiante);

// PUT → actualizar estudiante
router.put('/:id', estudiantesController.actualizarEstudiante);

// DELETE → eliminar estudiante
router.delete('/:id', estudiantesController.eliminarEstudiante);

module.exports = router;
