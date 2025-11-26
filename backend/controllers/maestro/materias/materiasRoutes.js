const express = require('express');
const router = express.Router();
const materiasCtrl = require('./materiasController');

// LISTAR
router.get('/lista', materiasCtrl.listarMaterias);

// CREAR
router.post('/crear', materiasCtrl.crearMateria);

// ACTUALIZAR
router.post('/actualizar', materiasCtrl.actualizarMateria);

// ELIMINAR
router.post('/eliminar', materiasCtrl.eliminarMateria);

module.exports = router;
