const express = require('express');
const router = express.Router();

// ================== DEPURACIÓN ==================
console.log('🗺️ [DEBUG] Rutas de reportes cargadas');
console.log('🗺️ [DEBUG] Ubicación: ' + __filename);

// ================== IMPORTAR CONTROLADOR ==================
console.log('📂 Intentando cargar controlador de reportes...');
let reportesAlumnoController;

try {
  // Intentar cargar el controlador desde la misma carpeta
  reportesAlumnoController = require('./reportesController');
  console.log('✅ Controlador de reportes cargado exitosamente');
  console.log('✅ Funciones disponibles en controlador:', Object.keys(reportesAlumnoController));
} catch (error) {
  console.error('❌ Error cargando controlador de reportes:', error.message);
  console.error('❌ Stack trace:', error.stack);
  
  // Crear controlador de stub temporal
  reportesAlumnoController = {
    getReportesEstudiante: (req, res) => {
      res.json({
        success: false,
        message: 'Controlador de reportes no disponible - Error en carga',
        error: error.message,
        debug: {
          rutaSolicitada: req.originalUrl,
          query: req.query,
          timestamp: new Date().toISOString()
        }
      });
    },
    test: (req, res) => {
      res.json({
        success: true,
        message: '⚠️ Ruta de test para reportes (STUB - Controlador no cargado)',
        error: error.message,
        timestamp: new Date().toISOString(),
        solucion: 'Verificar que reportesController.js existe en la misma carpeta'
      });
    }
  };
}

// ================== MIDDLEWARE DE LOGGING ==================
router.use((req, res, next) => {
  console.log(`📡 [Reportes] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log(`📡 [Reportes] Query params:`, req.query);
  console.log(`📡 [Reportes] Body:`, req.body);
  next();
});

// ================== RUTA DE VERIFICACIÓN ==================
router.get('/verificar', (req, res) => {
  console.log('🔍 Ruta de verificación accedida');
  res.json({
    success: true,
    message: '✅ Rutas de reportes funcionando correctamente',
    controladorCargado: typeof reportesAlumnoController.getReportesEstudiante !== 'undefined',
    rutasDisponibles: [
      { metodo: 'GET', ruta: '/', descripcion: 'Obtener reportes del estudiante' },
      { metodo: 'GET', ruta: '/resumen', descripcion: 'Obtener resumen de reportes' },
      { metodo: 'POST', ruta: '/:id/leido', descripcion: 'Marcar reporte como leído' },
      { metodo: 'POST', ruta: '/:id/observacion', descripcion: 'Agregar observación del alumno' },
      { metodo: 'GET', ruta: '/exportar/pdf', descripcion: 'Exportar reportes a HTML/PDF' },
      { metodo: 'GET', ruta: '/test', descripcion: 'Ruta de prueba' },
      { metodo: 'GET', ruta: '/verificar-tabla', descripcion: 'Verificar tabla de reportes' },
      { metodo: 'GET', ruta: '/verificar', descripcion: 'Verificar rutas (esta ruta)' }
    ],
    timestamp: new Date().toISOString()
  });
});

// ================== RUTA PARA VERIFICAR TABLA ==================
router.get('/verificar-tabla', reportesAlumnoController.verificarTabla || ((req, res) => {
  res.json({
    success: false,
    message: 'Función verificarTabla no disponible en el controlador'
  });
}));

// ================== RUTAS PARA ALUMNOS ==================
router.get('/', reportesAlumnoController.getReportesEstudiante);           // GET /api/reportes-alumno?estudianteId=ID
router.get('/resumen', reportesAlumnoController.getResumenEstudiante);    // GET /api/reportes-alumno/resumen?estudianteId=ID
router.post('/:id/leido', reportesAlumnoController.marcarComoLeido);      // POST /api/reportes-alumno/:id/leido
router.post('/:id/observacion', reportesAlumnoController.agregarObservacion); // POST /api/reportes-alumno/:id/observacion
router.get('/exportar/pdf', reportesAlumnoController.exportarPDF);        // GET /api/reportes-alumno/exportar/pdf?estudianteId=ID
router.get('/test', reportesAlumnoController.test);                       // GET /api/reportes-alumno/test

// ================== RUTA DE FALLBACK (CORREGIDA) ==================
// **CORRECCIÓN**: Quitar el '*', o usar '/*' en su lugar
router.use((req, res) => {
  console.log(`⚠️ [Reportes] Ruta no encontrada: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada en módulo de reportes',
    rutaSolicitada: req.originalUrl,
    rutasDisponibles: [
      'GET /',
      'GET /resumen',
      'POST /:id/leido',
      'POST /:id/observacion',
      'GET /exportar/pdf',
      'GET /test',
      'GET /verificar',
      'GET /verificar-tabla'
    ],
    timestamp: new Date().toISOString()
  });
});

// ================== MIDDLEWARE DE ERRORES ==================
router.use((error, req, res, next) => {
  console.error('🔥 [Reportes] Error en ruta:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno en módulo de reportes',
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

console.log('✅ Rutas de reportes configuradas correctamente');
console.log('✅ Total de rutas registradas: 8');
console.log('✅ Middlewares configurados: logging, verificación, fallback, errores');

module.exports = router;