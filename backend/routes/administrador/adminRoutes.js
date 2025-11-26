const express = require('express');
const router = express.Router();

// Ruta temporal para admin
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Módulo de administración en desarrollo' });
});

module.exports = router;
