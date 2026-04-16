const express = require('express');
const router = express.Router();
const {
  getTodosAvisos,
  getAvisosActivos,
  toggleAviso,
  crearAviso,
  actualizarAviso,
  eliminarAviso,
  getAvisoById
} = require('./dashboardController');

// =====================================================
// 📢 RUTAS DE AVISOS
// =====================================================

// Obtener avisos activos
router.get('/avisos/activos', getAvisosActivos);

// Obtener todos los avisos
router.get('/avisos', getTodosAvisos);

// Obtener aviso por ID
router.get('/avisos/:id', getAvisoById);

// Crear nuevo aviso
router.post('/avisos', crearAviso);

// Actualizar aviso
router.put('/avisos/:id', actualizarAviso);

// Eliminar aviso
router.delete('/avisos/:id', eliminarAviso);

// Alternar estado del aviso (activar/ocultar) - ✅ AHORA ES POST
router.post('/avisos/:id/toggle', toggleAviso);

module.exports = router;