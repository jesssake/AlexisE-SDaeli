const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboardController');

// Rutas CRUD de avisos
router.get('/avisos', dashboardController.getTodosAvisos);
router.get('/avisos/activos', dashboardController.getAvisosActivos);
router.patch('/avisos/:id/toggle', dashboardController.toggleAviso);
router.post('/avisos', dashboardController.crearAviso);
router.put('/avisos/:id', dashboardController.actualizarAviso);
router.delete('/avisos/:id', dashboardController.eliminarAviso);

module.exports = router;
