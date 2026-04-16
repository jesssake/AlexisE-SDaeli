// backend/controllers/estudiante/dashboard/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboardController');

// ========== DASHBOARD ESTUDIANTE ==========
router.get('/verificar', dashboardController.verificarTabla);
router.get('/avisos', dashboardController.getAvisosActivos);
router.get('/estadisticas', dashboardController.getEstadisticasAvisosActivos);

// ========== ADMIN CRUD ==========
router.get('/avisos/todos', dashboardController.getTodosAvisos);
router.patch('/avisos/:id/toggle', dashboardController.toggleAviso);
router.post('/avisos', dashboardController.crearAviso);
router.put('/avisos/:id', dashboardController.actualizarAviso);
router.delete('/avisos/:id', dashboardController.eliminarAviso);

module.exports = router;