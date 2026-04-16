// backend/controllers/estudiante/configuracion/configuracionRoutes.js

const express = require('express');
const router = express.Router();
const configuracionController = require('./configuracionController');

// Rutas GET (consulta)
router.get('/test-db', configuracionController.testConnection);
router.get('/tutor/:tutor_id/ninos', configuracionController.getNinosByTutor);
router.get('/tutor/:tutor_id/info', configuracionController.getTutorInfo);
router.get('/nino/:nino_id', configuracionController.getNinoById);

// Rutas POST (actualización)
router.post('/tutor/:tutor_id/perfil', configuracionController.actualizarPerfil);
router.post('/tutor/:tutor_id/password', configuracionController.cambiarPassword);
router.post('/nino/:nino_id', configuracionController.actualizarNino);

// Ruta de prueba
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ Rutas de configuración funcionando',
        endpoints: [
            'GET /api/configuracion/test',
            'GET /api/configuracion/test-db',
            'GET /api/configuracion/tutor/:tutor_id/ninos',
            'GET /api/configuracion/tutor/:tutor_id/info',
            'GET /api/configuracion/nino/:nino_id',
            'POST /api/configuracion/tutor/:tutor_id/perfil',
            'POST /api/configuracion/tutor/:tutor_id/password',
            'POST /api/configuracion/nino/:nino_id'
        ]
    });
});

module.exports = router;