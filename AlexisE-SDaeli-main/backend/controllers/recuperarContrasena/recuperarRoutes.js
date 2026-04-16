// backend/controllers/recuperarContrasena/recuperarRoutes.js

const express = require('express');
const router = express.Router();
const recuperarController = require('./recuperarController');

// Rutas de recuperación de contraseña con preguntas de seguridad
router.post('/iniciar', recuperarController.iniciarRecuperacion);
router.post('/verificar-respuestas', recuperarController.verificarRespuestas);
router.get('/verificar-token/:token', recuperarController.verificarToken);
router.post('/restablecer/:token', recuperarController.restablecerPassword);

module.exports = router;