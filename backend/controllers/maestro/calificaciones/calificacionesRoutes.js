const express = require('express');
const router = express.Router();
const controller = require('./calificacionesController');

// Rutas existentes
router.get('/trimestres', controller.obtenerTrimestres);
router.get('/lista', controller.obtenerCalificaciones);
router.post('/guardar', controller.guardarPorcentajes);

// Nuevas rutas para promedios automáticos
router.get('/completas', controller.obtenerCalificacionesCompletas);
router.get('/test', controller.testConnection); // Ruta de prueba

module.exports = router;