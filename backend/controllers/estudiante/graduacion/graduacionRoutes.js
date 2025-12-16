// C:\Codigos\HTml\gestion-educativa\backend\controllers\estudiante\graduacion\graduacionRoutes.js
const express = require('express');
const router = express.Router();

console.log('🎓 CARGANDO RUTAS DE GRADUACIÓN PARA ESTUDIANTES...');

// ✅ IMPORTACIÓN CORRECTA
const graduacionController = require('./graduacionController');

// =============================
// ✅ CORRECCIÓN: RUTAS ESTÁTICAS PRIMERO
// =============================

// 1. Rutas estáticas (sin parámetros)
router.get('/test', graduacionController.test);
router.get('/sistema/verificar', graduacionController.verificarSistema);

// 2. Rutas para certificados específicos
router.get('/certificados/:certificado_id/descargar', graduacionController.descargarCertificado);
router.get('/certificados/:certificado_id/pdf', graduacionController.generarPDFCertificado);

// 3. Rutas dinámicas (con parámetro estudiante_id) - DE ÚLTIMO
router.get('/:estudiante_id/certificados', graduacionController.getCertificadosEstudiante);
router.get('/:estudiante_id/estadisticas', graduacionController.getEstadisticasEstudiante);
router.get('/:estudiante_id/ciclos', graduacionController.getCiclosEstudiante);
router.get('/:estudiante_id/verificar', graduacionController.verificarEstudiante);
router.get('/:estudiante_id/resumen', graduacionController.getResumenEstudiante);

// =============================
// LOG DE RUTAS CARGADAS
// =============================
console.log('✅ [GRADUACIÓN] Rutas configuradas (ORDEN CORREGIDO):');
console.log('  🧪 GET    /test');
console.log('  🔧 GET    /sistema/verificar');
console.log('  📥 GET    /certificados/:certificado_id/descargar');
console.log('  📄 GET    /certificados/:certificado_id/pdf');
console.log('  📜 GET    /:estudiante_id/certificados');
console.log('  📊 GET    /:estudiante_id/estadisticas');
console.log('  📅 GET    /:estudiante_id/ciclos');
console.log('  🔍 GET    /:estudiante_id/verificar');
console.log('  📋 GET    /:estudiante_id/resumen');
console.log('  ✅ Total: 9 rutas configuradas');

module.exports = router;