// routes/maestro/tareas/tareasRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const tareasController = require('../../../controllers/maestro/tareas/tareasController');

// Configurar Multer para archivos
const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ===================== RUTAS =====================

// Listar tareas
router.get('/lista', tareasController.getTareas);

// Crear tarea
router.post('/crear', upload.single('archivo_adjunto'), tareasController.crearTarea);

// Actualizar tarea
router.put('/actualizar', upload.single('archivo_adjunto'), tareasController.actualizarTarea);

// Eliminar tarea
router.delete('/eliminar', tareasController.eliminarTarea);

// Obtener entregas
router.get('/entregas', tareasController.getEntregas);

// Calificar entrega
router.post('/calificar', tareasController.calificarEntrega);

// Subir archivo a tarea existente
router.post('/subir-archivo', upload.single('archivo_adjunto'), tareasController.subirArchivoTarea);

// Eliminar archivo adjunto
router.delete('/eliminar-archivo', tareasController.eliminarArchivoTarea);

module.exports = router;
