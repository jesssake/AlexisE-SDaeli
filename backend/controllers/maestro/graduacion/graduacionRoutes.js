// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\graduacion\graduacionRoutes.js
// VERSIÓN CORREGIDA - SIMPLE Y FUNCIONAL

const express = require('express');
const router = express.Router();

// ✅ IMPORTACIÓN CORRECTA - usando require
const graduacionController = require('./graduacionController');

// =============================
// RUTAS SIMPLIFICADAS
// =============================

// GET /api/maestro/graduacion/:maestro_id/alumnos
router.get('/:maestro_id/alumnos', graduacionController.getAlumnos);

// GET /api/maestro/graduacion/:maestro_id/config
router.get('/:maestro_id/config', graduacionController.getConfiguracion);

// GET /api/maestro/graduacion/:maestro_id/certificados
router.get('/:maestro_id/certificados', graduacionController.listarCertificados);

// GET /api/maestro/graduacion/:maestro_id/estadisticas
router.get('/:maestro_id/estadisticas', graduacionController.getEstadisticas);

// POST /api/maestro/graduacion/:maestro_id/certificados
router.post('/:maestro_id/certificados', graduacionController.crearCertificado);

// PUT /api/maestro/graduacion/certificados/:certificado_id/estado
router.put('/certificados/:certificado_id/estado', graduacionController.cambiarEstado);

// DELETE /api/maestro/graduacion/certificados/:certificado_id
router.delete('/certificados/:certificado_id', graduacionController.eliminarCertificado);

module.exports = router;