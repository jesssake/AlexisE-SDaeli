// C:\Codigos\HTml\gestion-educativa\backend\routes\usuarioRoutes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// 👤 OBTENER TODOS LOS USUARIOS
// GET http://localhost:3000/api/usuarios
router.get('/', usuarioController.getUsuarios);

// 👤 OBTENER USUARIO POR ID
// GET http://localhost:3000/api/usuarios/:id
router.get('/:id', usuarioController.getUsuarioById);

// 👤 REGISTRAR USUARIO (opcional)
// POST http://localhost:3000/api/usuarios/registrar
router.post('/registrar', usuarioController.registrarUsuario);

module.exports = router;
