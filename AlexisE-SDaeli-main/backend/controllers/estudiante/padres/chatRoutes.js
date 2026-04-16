// C:\Codigos\HTml\gestion-educativa\backend\controllers\estudiante\padres\chatRoutes.js
const express = require('express');
const router = express.Router();

console.log('🔍 Cargando chatController para estudiante/padres...');

let chatController;
try {
    chatController = require('./chatController');
    console.log('✅ chatController cargado exitosamente');
} catch (error) {
    console.error('❌ Error cargando chatController:', error.message);
    
    // Controlador de emergencia
    chatController = {
        getConversaciones: async (req, res) => {
            console.log('📞 Controlador emergente: getConversaciones');
            res.status(503).json({
                success: false,
                message: 'Servicio temporalmente no disponible'
            });
        },
        
        getMensajes: async (req, res) => {
            console.log('💬 Controlador emergente: getMensajes');
            res.status(503).json({
                success: false,
                message: 'Servicio temporalmente no disponible'
            });
        },
        
        enviarMensaje: async (req, res) => {
            console.log('📤 Controlador emergente: enviarMensaje');
            res.status(503).json({
                success: false,
                message: 'Servicio temporalmente no disponible'
            });
        },
        
        getEstadisticas: async (req, res) => {
            console.log('📊 Controlador emergente: getEstadisticas');
            res.status(503).json({
                success: false,
                message: 'Servicio temporalmente no disponible'
            });
        },
        
        getMensajesNoLeidos: async (req, res) => {
            console.log('📨 Controlador emergente: getMensajesNoLeidos');
            res.status(503).json({
                success: false,
                message: 'Servicio temporalmente no disponible'
            });
        },
        
        marcarMensajesLeidos: async (req, res) => {
            console.log('📖 Controlador emergente: marcarMensajesLeidos');
            res.status(503).json({
                success: false,
                message: 'Servicio temporalmente no disponible'
            });
        }
    };
}

// Middleware de validación
const validateId = (req, res, next) => {
    const id = req.params.estudiante_id || req.params.maestro_id;
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
            success: false,
            message: 'ID inválido'
        });
    }
    next();
};

// 🔹 RUTAS PRINCIPALES
router.get('/conversaciones/:estudiante_id', validateId, (req, res) => {
    console.log(`🌐 RUTA: GET /conversaciones/${req.params.estudiante_id}`);
    return chatController.getConversaciones(req, res);
});

router.get('/mensajes/:estudiante_id/:maestro_id', validateId, (req, res) => {
    console.log(`🌐 RUTA: GET /mensajes/${req.params.estudiante_id}/${req.params.maestro_id}`);
    return chatController.getMensajes(req, res);
});

router.post('/enviar', (req, res) => {
    console.log('🌐 RUTA: POST /enviar');
    return chatController.enviarMensaje(req, res);
});

router.get('/estadisticas/:estudiante_id', validateId, (req, res) => {
    console.log(`🌐 RUTA: GET /estadisticas/${req.params.estudiante_id}`);
    return chatController.getEstadisticas(req, res);
});

router.get('/no-leidos/:estudiante_id', validateId, (req, res) => {
    console.log(`🌐 RUTA: GET /no-leidos/${req.params.estudiante_id}`);
    return chatController.getMensajesNoLeidos(req, res);
});

router.post('/marcar-leidos', (req, res) => {
    console.log('🌐 RUTA: POST /marcar-leidos');
    return chatController.marcarMensajesLeidos(req, res);
});

router.post('/iniciar-conversacion', (req, res) => {
    console.log('🌐 RUTA: POST /iniciar-conversacion');
    return chatController.iniciarConversacion(req, res);
});

router.get('/maestros-disponibles/:estudiante_id', validateId, (req, res) => {
    console.log(`🌐 RUTA: GET /maestros-disponibles/${req.params.estudiante_id}`);
    return chatController.getMaestrosDisponibles(req, res);
});

// 🔹 RUTAS DE DIAGNÓSTICO
router.get('/status', (req, res) => {
    console.log('🌐 RUTA: GET /status');
    res.json({
        success: true,
        service: 'Chat Estudiante/Padres',
        status: '🟢 Online',
        timestamp: new Date().toISOString(),
        version: '2.0',
        endpoints: [
            'GET /conversaciones/:estudiante_id',
            'GET /mensajes/:estudiante_id/:maestro_id',
            'POST /enviar',
            'GET /estadisticas/:estudiante_id',
            'GET /no-leidos/:estudiante_id',
            'POST /marcar-leidos',
            'POST /iniciar-conversacion',
            'GET /maestros-disponibles/:estudiante_id',
            'GET /status',
            'GET /debug'
        ]
    });
});

router.get('/debug', async (req, res) => {
    console.log('🌐 RUTA: GET /debug');
    
    try {
        const db = require('../../../config/dbConfig');
        const [result] = await db.execute('SELECT 1 as test');
        
        const tablasQuery = `SHOW TABLES LIKE 'mensajes';`;
        const [tablas] = await db.execute(tablasQuery);
        
        const estructuraQuery = `DESCRIBE mensajes;`;
        const [estructura] = await db.execute(estructuraQuery);
        
        res.json({
            success: true,
            database: '🟢 Conectado',
            tablas_necesarias: tablas.length > 0 ? '🟢 Existen' : '🔴 Faltan',
            service: 'Chat Estudiante/Padres',
            timestamp: new Date().toISOString(),
            tablas_encontradas: tablas.map(t => Object.values(t)[0]),
            estructura_mensajes: estructura.map(col => ({
                field: col.Field,
                type: col.Type,
                null: col.Null,
                key: col.Key
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            database: '🔴 Desconectado',
            error: error.message,
            service: 'Chat Estudiante/Padres',
            timestamp: new Date().toISOString()
        });
    }
});

router.get('/verificar-datos/:estudiante_id', validateId, async (req, res) => {
    console.log(`🌐 RUTA: GET /verificar-datos/${req.params.estudiante_id}`);
    
    try {
        const db = require('../../../config/dbConfig');
        const estudiante_id = req.params.estudiante_id;
        
        const usuarioQuery = `
            SELECT id, tutor_nombre, nino_nombre, rol, tutor_email 
            FROM usuarios 
            WHERE id = ?
        `;
        const [usuario] = await db.execute(usuarioQuery, [estudiante_id]);
        
        const mensajesQuery = `
            SELECT COUNT(*) as total_mensajes,
                   SUM(CASE WHEN tutor_id = ? THEN 1 ELSE 0 END) as como_tutor,
                   SUM(CASE WHEN maestro_id = ? THEN 1 ELSE 0 END) as como_maestro
            FROM mensajes
            WHERE tutor_id = ? OR maestro_id = ?
        `;
        const [mensajes] = await db.execute(mensajesQuery, [
            estudiante_id, estudiante_id, 
            estudiante_id, estudiante_id
        ]);
        
        const maestrosQuery = `
            SELECT COUNT(*) as total_maestros
            FROM administradores
            WHERE activo = 1
        `;
        const [maestros] = await db.execute(maestrosQuery);
        
        res.json({
            success: true,
            data: {
                usuario: usuario[0] || null,
                mensajes: mensajes[0] || { total_mensajes: 0, como_tutor: 0, como_maestro: 0 },
                maestros: maestros[0] || { total_maestros: 0 },
                recomendacion: usuario.length === 0 ? 
                    'Usuario no encontrado en tabla usuarios' :
                    mensajes[0]?.como_tutor === 0 ? 
                    'Usuario no tiene mensajes como tutor. Puede iniciar una conversación.' :
                    'Usuario tiene conversaciones activas.'
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en verificación',
            error: error.message
        });
    }
});

console.log('✅ chatRoutes configurado correctamente para estudiante/padres');
module.exports = router;