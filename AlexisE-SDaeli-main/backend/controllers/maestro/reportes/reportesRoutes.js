const express = require('express');
const router = express.Router();
const reportesController = require('./reportesController');
const multer = require('multer');
const path = require('path');

// Configurar multer para subida de logos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Crear carpeta si no existe
    const fs = require('fs');
    const dir = 'uploads/logos';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, etc.)'));
    }
  }
});

// ================== RUTAS DE ESTUDIANTES ==================
router.get('/estudiantes', reportesController.getEstudiantes);

// ================== RUTAS DE REPORTES CRUD ==================
router.get('/', reportesController.getReportes);           // GET /api/reportes
router.post('/', reportesController.crearReporte);         // POST /api/reportes
router.put('/:id/estado', reportesController.cambiarEstado); // PUT /api/reportes/:id/estado
router.delete('/:id', reportesController.eliminarReporte); // DELETE /api/reportes/:id

// ================== RUTAS DE EXPORTACIÓN ==================
router.get('/exportar/csv', reportesController.exportarCSV);
router.get('/exportar/word', reportesController.exportarWord);

// ================== RUTAS DE SUBIDA ==================
router.post('/upload/logo', upload.single('logo'), reportesController.uploadLogo);

// ================== RUTAS DE DEBUG ==================
router.get('/debug', reportesController.debugInfo);

// ================== RUTA DE PRUEBA ==================
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ Módulo de reportes funcionando correctamente',
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      estudiantes: 'GET /api/reportes/estudiantes?maestro_id=16',
      reportes: 'GET /api/reportes?maestroId=16&resumen=1',
      crear: 'POST /api/reportes',
      cambiar_estado: 'PUT /api/reportes/:id/estado',
      eliminar: 'DELETE /api/reportes/:id',
      exportar_csv: 'GET /api/reportes/exportar/csv?maestro_id=16',
      exportar_word: 'GET /api/reportes/exportar/word',
      upload_logo: 'POST /api/reportes/upload/logo',
      debug: 'GET /api/reportes/debug'
    }
  });
});

module.exports = router;