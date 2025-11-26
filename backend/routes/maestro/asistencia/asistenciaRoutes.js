// routes/maestro/asistencia/asistenciaRoutes.js
const express = require('express');
const router = express.Router();
const asistenciaController = require('../../../controllers/maestro/asistencia/asistenciaController');

// Obtener lista de alumnos + asistencias del día/hora
router.get('/lista', asistenciaController.getListaAsistencia);

// Guardar asistencias
router.post('/guardar', asistenciaController.guardarAsistencia);

module.exports = router;
