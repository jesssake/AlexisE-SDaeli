// C:\Codigos\HTml\gestion-educativa\backend\controllers\estudiante\asistencia\asistenciaRoutes.js
const express = require('express');
const router = express.Router();
const asistenciaController = require('./asistenciaController');

// ================================
// 🔹 RUTAS PRINCIPALES
// ================================

// GET /api/estudiante/asistencia/:estudiante_id
// Obtener asistencia de un estudiante específico
router.get('/:estudiante_id', asistenciaController.obtenerAsistenciaEstudiante);

// GET /api/estudiante/asistencia/:estudiante_id/resumen-mensual
// Obtener resumen mensual
router.get('/:estudiante_id/resumen-mensual', asistenciaController.obtenerResumenMensual);

// GET /api/estudiante/asistencia/:estudiante_id/por-rango
// Obtener asistencia por rango de fechas
router.get('/:estudiante_id/por-rango', asistenciaController.obtenerAsistenciaPorRango);

// GET /api/estudiante/asistencia/:estudiante_id/estadisticas
// Obtener estadísticas detalladas
router.get('/:estudiante_id/estadisticas', asistenciaController.obtenerEstadisticasDetalladas);

// GET /api/estudiante/asistencia/:estudiante_id/hoy
// Verificar asistencia del día de hoy
router.get('/:estudiante_id/hoy', asistenciaController.verificarAsistenciaHoy);

// GET /api/estudiante/asistencia/:estudiante_id/reporte
// Generar reporte de asistencia
router.get('/:estudiante_id/reporte', asistenciaController.generarReporteAsistencia);

// ================================
// 🔹 RUTAS DE PRUEBA Y DIAGNÓSTICO
// ================================

// GET /api/estudiante/asistencia/test
// Endpoint de prueba
router.get('/test', (req, res) => {
  res.json({
    ok: true,
    message: "✅ API de asistencia para estudiantes funcionando correctamente",
    timestamp: new Date().toISOString(),
    endpoints: {
      obtener_asistencia: "GET /api/estudiante/asistencia/:estudiante_id",
      resumen_mensual: "GET /api/estudiante/asistencia/:estudiante_id/resumen-mensual",
      por_rango: "GET /api/estudiante/asistencia/:estudiante_id/por-rango",
      estadisticas: "GET /api/estudiante/asistencia/:estudiante_id/estadisticas",
      verificar_hoy: "GET /api/estudiante/asistencia/:estudiante_id/hoy",
      generar_reporte: "GET /api/estudiante/asistencia/:estudiante_id/reporte"
    }
  });
});

// GET /api/estudiante/asistencia/status
// Verificar estado de la API
router.get('/status', (req, res) => {
  res.json({
    ok: true,
    status: "🟢 Activo",
    servicio: "Asistencia para Estudiantes",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;