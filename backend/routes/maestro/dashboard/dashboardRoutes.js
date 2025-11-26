// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\dashboard\dashboardRoutes.js
const express = require('express');
const router = express.Router();

// Como este archivo está EN la misma carpeta que dashboardController.js,
// el require es directo:
const dashboardController = require('./dashboardController');

// ======================
// 🔹 GET /api/maestro/dashboard/avisos
// ======================
router.get('/avisos', dashboardController.getAvisos);

// 🔹 GET /api/maestro/dashboard/avisos/activos
router.get('/avisos/activos', dashboardController.getAvisosActivos);

// 🔹 POST /api/maestro/dashboard/avisos
router.post('/avisos', dashboardController.crearAviso);

// 🔹 PUT /api/maestro/dashboard/avisos/:id
router.put('/avisos/:id', dashboardController.actualizarAviso);

// 🔹 DELETE /api/maestro/dashboard/avisos/:id
router.delete('/avisos/:id', dashboardController.eliminarAviso);

// 🔹 PATCH /api/maestro/dashboard/avisos/:id/toggle
router.patch('/avisos/:id/toggle', dashboardController.toggleAviso);

module.exports = router;
