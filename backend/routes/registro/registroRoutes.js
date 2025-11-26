// routes/registro/registroRoutes.js
const express = require('express');
const router = express.Router();
const registroController = require('../../controllers/registro/registroController');

// POST /api/registro/completo
router.post('/completo', registroController.registroCompleto);

// GET /api/registro/validar-email/:email
router.get('/validar-email/:email', registroController.validarEmail);

module.exports = router;
