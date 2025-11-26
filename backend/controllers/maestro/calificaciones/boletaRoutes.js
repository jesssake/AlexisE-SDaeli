// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\calificaciones\boletaRoutes.js

const express = require('express');
const router = express.Router();

// Controlador que genera la boleta en PDF
const boletaController = require('./boletaController');

// POST /api/boleta/generar
// Body esperado:
// {
//   alumno_id: number,
//   trimestre_id: number,
//   escuela?: string,
//   logoBase64?: string
// }
router.post('/generar', boletaController.generarBoleta);

module.exports = router;
