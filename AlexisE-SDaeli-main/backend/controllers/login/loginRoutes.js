// backend/controllers/login/loginRoutes.js
const express = require('express');
const router = express.Router();
const { login } = require('./loginController');

// Ruta principal de login - CON Y SIN SLASH
router.post('/', login);           // POST /api/login/
router.post('', login);            // POST /api/login (sin slash)

// Opcional: endpoints de prueba
router.get('/test', (req, res) => {
  res.json({ success: true, message: '✅ Endpoint de test de login funcionando' });
});

router.get('/status', (req, res) => {
  res.json({ success: true, message: '🟢 Login API activa', timestamp: new Date().toISOString() });
});

module.exports = router;