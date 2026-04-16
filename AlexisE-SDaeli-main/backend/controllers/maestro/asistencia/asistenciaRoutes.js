// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\asistencia\asistenciaRoutes.js

const express = require('express');
const router = express.Router();

const asistenciaController = require('./asistenciaController');

// ===============================
// 🔹 GET listado por fecha + hora
// GET /api/maestro/asistencia/lista
// ===============================
router.get('/lista', asistenciaController.obtenerLista);

// ===============================
// 🔹 POST para guardar TODA la lista
// POST /api/maestro/asistencia/guardar
// ===============================
router.post('/guardar', asistenciaController.guardarLista);

// ===============================
// 🔹 GET historial completo
// GET /api/maestro/asistencia
// ===============================
router.get('/', asistenciaController.obtenerAsistencias);

// ===============================
// 🔹 CRUD opcional
// ===============================
router.post('/', asistenciaController.registrarAsistencia);
router.put('/:id', asistenciaController.actualizarAsistencia);
router.delete('/:id', asistenciaController.eliminarAsistencia);

module.exports = router;
