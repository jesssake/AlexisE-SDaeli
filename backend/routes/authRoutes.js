// C:\Codigos\HTml\gestion-educativa\backend\routes\authRoutes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// 🔐 LOGIN ALTERNATIVO
// Endpoint final: POST http://localhost:3000/api/auth/login
router.post('/login', authController.loginAlternativo);

// (Opcional) LOGIN PRINCIPAL por aquí también
// Endpoint final: POST http://localhost:3000/api/auth/login-principal
router.post('/login-principal', authController.login);

module.exports = router;
