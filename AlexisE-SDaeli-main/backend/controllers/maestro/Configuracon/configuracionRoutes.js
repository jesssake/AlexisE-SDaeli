// backend/controllers/maestro/Configuracon/configuracionRoutes.js
const express = require('express');
const router = express.Router();
const configuracionController = require('./configuracionController');

// Importar middleware de autenticación
const authMiddleware = require('../../../middlewares/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

/**
 * @route   GET /api/maestro/configuracion/perfil
 * @desc    Obtener perfil del usuario actual (nombre, email, rol, fecha registro)
 * @access  Private
 */
router.get('/perfil', configuracionController.obtenerPerfil);

/**
 * @route   POST /api/maestro/configuracion/actualizar
 * @desc    Actualizar datos del usuario (nombre, correo, contraseña)
 * @access  Private
 * @body    { nuevoNombre, nuevoCorreo, contrasenaActual, contrasenaNueva }
 */
router.post('/actualizar', configuracionController.actualizarUsuario);

/**
 * @route   POST /api/maestro/configuracion/auditoria
 * @desc    Insertar registro de auditoría
 * @access  Private
 * @body    { accion }
 */
router.post('/auditoria', configuracionController.insertarAuditoria);

/**
 * @route   GET /api/maestro/configuracion/historial
 * @desc    Obtener historial de auditoría del usuario
 * @access  Private
 */
router.get('/historial', configuracionController.obtenerHistorial);

module.exports = router;