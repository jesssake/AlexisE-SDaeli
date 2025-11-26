const express = require('express');
const router = express.Router();

// Ruta temporal para recuperación
router.post('/solicitar', (req, res) => {
  res.json({ message: 'Módulo de recuperación en desarrollo' });
});

module.exports = router;
