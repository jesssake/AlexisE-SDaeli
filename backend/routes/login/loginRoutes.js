// C:\Codigos\HTml\gestion-educativa\backend\routes\login\loginRoutes.js
const express = require('express');
const router = express.Router();
const loginController = require('../../controllers/login/loginController');

// POST /api/login
router.post('/login', loginController.login);

module.exports = router;
