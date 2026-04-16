// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\graduacion\graduacionRoutes.js
// VERSIÓN COMPLETA CON MULTER PARA SUBIR PDFS

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========================================
// CONFIGURACIÓN DE MULTER PARA PDFS
// ========================================
const uploadDir = path.join(__dirname, '../../../../uploads/certificados');

// Crear directorio si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Directorio creado:', uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `temp_${uniqueSuffix}.pdf`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});

// ✅ IMPORTACIÓN CORRECTA
const graduacionController = require('./graduacionController');

// ========================================
// RUTAS
// ========================================

// GET - Obtener alumnos
router.get('/:maestro_id/alumnos', graduacionController.getAlumnos);

// GET - Obtener configuración
router.get('/:maestro_id/config', graduacionController.getConfiguracion);

// GET - Listar certificados
router.get('/:maestro_id/certificados', graduacionController.listarCertificados);

// GET - Obtener estadísticas
router.get('/:maestro_id/estadisticas', graduacionController.getEstadisticas);

// POST - Crear certificado (solo datos, sin PDF)
router.post('/:maestro_id/certificados', graduacionController.crearCertificado);

// 🔥 NUEVO: POST - Crear certificado con PDF (multipart/form-data)
router.post(
  '/:maestro_id/certificados-con-pdf', 
  upload.single('pdf'), 
  graduacionController.guardarCertificadoConPDF
);

// PUT - Cambiar estado del certificado
router.put('/certificados/:certificado_id/estado', graduacionController.cambiarEstado);

// DELETE - Eliminar certificado
router.delete('/certificados/:certificado_id', graduacionController.eliminarCertificado);

// ========================================
// LOG DE RUTAS CARGADAS
// ========================================
console.log('✅ [MAESTRO GRADUACIÓN] Rutas configuradas:');
console.log('  📜 GET    /:maestro_id/alumnos');
console.log('  ⚙️ GET    /:maestro_id/config');
console.log('  📋 GET    /:maestro_id/certificados');
console.log('  📊 GET    /:maestro_id/estadisticas');
console.log('  ➕ POST   /:maestro_id/certificados');
console.log('  🔥 POST   /:maestro_id/certificados-con-pdf (con multer)');
console.log('  🔄 PUT    /certificados/:certificado_id/estado');
console.log('  🗑️ DELETE /certificados/:certificado_id');

module.exports = router;