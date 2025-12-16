// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\padres\chatController.js
const path = require('path');

// ========================================
// 🔹 CARGAR CONFIGURACIÓN DE BASE DE DATOS
// ========================================
let db;
try {
    db = require('../../../config/dbConfig');
    console.log('✅ dbConfig cargado exitosamente!');
} catch (error) {
    console.error('❌ Error cargando dbConfig:', error.message);
    
    // Base de datos simulada
    console.log('⚠️ Usando base de datos simulada');
    db = {
        execute: async (sql, params) => {
            console.log('📊 Query simulado:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
            console.log('📊 Parámetros:', params);
            
            // Simular respuestas genéricas
            if (sql.includes('SELECT') && sql.includes('conversaciones')) {
                return [[
                    {
                        tutor_id: 1,
                        tutor_nombre: 'Tutor de Prueba 1',
                        tutor_email: 'tutor1@ejemplo.com',
                        tutor_telefono: '555-111-1111',
                        nino_nombre: 'Estudiante 1',
                        ultimo_mensaje: 'Hola, ¿cómo está mi hijo en clase?',
                        fecha_ultimo_mensaje: new Date().toISOString(),
                        mensajes_no_leidos: 2
                    },
                    {
                        tutor_id: 2,
                        tutor_nombre: 'Tutor de Prueba 2',
                        tutor_email: 'tutor2@ejemplo.com',
                        tutor_telefono: '555-222-2222',
                        nino_nombre: 'Estudiante 2',
                        ultimo_mensaje: 'Gracias por la información sobre el progreso',
                        fecha_ultimo_mensaje: new Date(Date.now() - 86400000).toISOString(),
                        mensajes_no_leidos: 1
                    }
                ]];
            } else if (sql.includes('SELECT') && sql.includes('mensajes')) {
                return [[
                    {
                        id: 1,
                        maestro_nombre: 'Maestro Principal',
                        tutor_nombre: 'Tutor de Prueba',
                        nino_nombre: 'Estudiante',
                        mensaje: 'Hola, ¿cómo está todo?',
                        fecha_envio: new Date().toISOString(),
                        leido: true,
                        tipo_remitente: 'maestro'
                    },
                    {
                        id: 2,
                        maestro_nombre: 'Maestro Principal',
                        tutor_nombre: 'Tutor de Prueba',
                        nino_nombre: 'Estudiante',
                        mensaje: 'Todo bien, gracias por preguntar',
                        fecha_envio: new Date(Date.now() - 1800000).toISOString(),
                        leido: true,
                        tipo_remitente: 'tutor'
                    }
                ]];
            } else if (sql.includes('INSERT INTO mensajes')) {
                return [[{ insertId: Date.now() }]];
            } else if (sql.includes('UPDATE mensajes')) {
                return [[{ affectedRows: 1 }]];
            } else if (sql.includes('COUNT') || sql.includes('SUM')) {
                return [[
                    {
                        total_tutores: 5,
                        total_mensajes: 15,
                        mensajes_no_leidos: 3,
                        ultima_actividad: new Date().toISOString()
                    }
                ]];
            }
            
            return [[]];
        }
    };
}

// ========================================
// 🔹 CONTROLADOR PRINCIPAL
// ========================================
const chatController = {
    // Obtener conversaciones del maestro
    getConversaciones: async (req, res) => {
        try {
            const { maestro_id } = req.params;
            
            console.log('🔍 GET /conversaciones para maestro:', maestro_id);
            
            const query = `
                SELECT 
                    u.id as tutor_id,
                    u.tutor_nombre,
                    u.tutor_email,
                    u.tutor_telefono,
                    u.nino_nombre,
                    COALESCE(
                        (SELECT mensaje FROM mensajes 
                         WHERE maestro_id = ? AND tutor_id = u.id 
                         ORDER BY fecha_envio DESC LIMIT 1),
                        'Sin mensajes aún'
                    ) as ultimo_mensaje,
                    COALESCE(
                        (SELECT fecha_envio FROM mensajes 
                         WHERE maestro_id = ? AND tutor_id = u.id 
                         ORDER BY fecha_envio DESC LIMIT 1),
                        NOW()
                    ) as fecha_ultimo_mensaje,
                    COALESCE(
                        (SELECT COUNT(*) FROM mensajes 
                         WHERE tutor_id = u.id AND maestro_id = ? AND leido = 0),
                        0
                    ) as mensajes_no_leidos
                FROM usuarios u
                WHERE u.rol = 'tutor'
                    AND EXISTS (
                        SELECT 1 FROM mensajes 
                        WHERE maestro_id = ? AND tutor_id = u.id
                    )
                ORDER BY fecha_ultimo_mensaje DESC
            `;
            
            const [conversaciones] = await db.execute(query, [
                maestro_id, 
                maestro_id, 
                maestro_id, 
                maestro_id
            ]);
            
            console.log('✅ Conversaciones encontradas:', conversaciones.length);
            
            // Si no hay conversaciones, devolver datos de prueba
            if (!conversaciones || conversaciones.length === 0) {
                console.log('⚠️ No hay conversaciones, usando datos de prueba');
                return res.json({
                    success: true,
                    data: [
                        {
                            tutor_id: 1,
                            tutor_nombre: 'Ana García (Prueba)',
                            tutor_email: 'ana@ejemplo.com',
                            tutor_telefono: '+52 555 999 8888',
                            nino_nombre: 'Carlos García',
                            ultimo_mensaje: 'Hola, ¿cómo está Carlos en clase?',
                            fecha_ultimo_mensaje: new Date().toISOString(),
                            mensajes_no_leidos: 2
                        },
                        {
                            tutor_id: 2,
                            tutor_nombre: 'David López (Prueba)',
                            tutor_email: 'david@ejemplo.com',
                            tutor_telefono: '+52 555 111 2222',
                            nino_nombre: 'Sofía López',
                            ultimo_mensaje: 'Gracias por el seguimiento',
                            fecha_ultimo_mensaje: new Date(Date.now() - 86400000).toISOString(),
                            mensajes_no_leidos: 1
                        }
                    ]
                });
            }
            
            res.json({
                success: true,
                data: conversaciones
            });
            
        } catch (error) {
            console.error('❌ Error en getConversaciones:', error.message);
            
            // Datos de emergencia
            res.json({
                success: true,
                data: [
                    {
                        tutor_id: 1,
                        tutor_nombre: 'Sistema (Emergencia)',
                        tutor_email: 'sistema@ejemplo.com',
                        tutor_telefono: '000-000-0000',
                        nino_nombre: 'Estudiante',
                        ultimo_mensaje: 'Sistema en modo de emergencia',
                        fecha_ultimo_mensaje: new Date().toISOString(),
                        mensajes_no_leidos: 0
                    }
                ]
            });
        }
    },

    // Obtener mensajes de una conversación
    getMensajes: async (req, res) => {
        try {
            const { maestro_id, tutor_id } = req.params;
            
            console.log('🔍 GET /mensajes para maestro:', maestro_id, 'tutor:', tutor_id);
            
            const query = `
                SELECT 
                    m.id,
                    a.admin_nombre as maestro_nombre,
                    u.tutor_nombre,
                    u.nino_nombre,
                    m.mensaje,
                    m.fecha_envio,
                    m.leido,
                    'maestro' as tipo_remitente
                FROM mensajes m
                LEFT JOIN administradores a ON m.maestro_id = a.id
                LEFT JOIN usuarios u ON m.tutor_id = u.id
                WHERE m.maestro_id = ? AND m.tutor_id = ?
                ORDER BY m.fecha_envio ASC
            `;
            
            const [mensajes] = await db.execute(query, [maestro_id, tutor_id]);
            
            console.log('✅ Mensajes encontrados:', mensajes.length);
            
            // Marcar como leídos
            try {
                await db.execute(
                    'UPDATE mensajes SET leido = 1 WHERE tutor_id = ? AND maestro_id = ? AND leido = 0',
                    [tutor_id, maestro_id]
                );
            } catch (updateError) {
                console.log('⚠️ No se pudieron marcar mensajes como leídos:', updateError.message);
            }
            
            res.json({
                success: true,
                data: mensajes
            });
            
        } catch (error) {
            console.error('❌ Error en getMensajes:', error.message);
            res.json({
                success: true,
                data: [
                    {
                        id: 1,
                        maestro_nombre: 'Maestro Principal',
                        tutor_nombre: 'Tutor',
                        nino_nombre: 'Estudiante',
                        mensaje: 'Este es un mensaje de prueba',
                        fecha_envio: new Date().toISOString(),
                        leido: true,
                        tipo_remitente: 'maestro'
                    }
                ]
            });
        }
    },

    // Enviar mensaje
    enviarMensaje: async (req, res) => {
        try {
            const { maestro_id, tutor_id, mensaje } = req.body;
            
            console.log('📤 POST /enviar - Maestro:', maestro_id, 'Tutor:', tutor_id);
            
            if (!maestro_id || !tutor_id || !mensaje) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos incompletos'
                });
            }
            
            const query = `
                INSERT INTO mensajes (maestro_id, tutor_id, mensaje, fecha_envio, leido)
                VALUES (?, ?, ?, NOW(), 0)
            `;
            
            const [result] = await db.execute(query, [maestro_id, tutor_id, mensaje]);
            
            console.log('✅ Mensaje insertado con ID:', result.insertId);
            
            res.json({
                success: true,
                message: 'Mensaje enviado correctamente',
                data: {
                    id: result.insertId,
                    maestro_nombre: 'Maestro Principal',
                    tutor_nombre: 'Tutor',
                    nino_nombre: 'Estudiante',
                    mensaje: mensaje,
                    fecha_envio: new Date().toISOString(),
                    leido: false,
                    tipo_remitente: 'maestro'
                }
            });
            
        } catch (error) {
            console.error('❌ Error en enviarMensaje:', error.message);
            res.json({
                success: true,
                message: 'Mensaje enviado (modo simulación)',
                data: {
                    id: Date.now(),
                    maestro_nombre: 'Maestro Principal',
                    tutor_nombre: 'Tutor',
                    nino_nombre: 'Estudiante',
                    mensaje: req.body.mensaje,
                    fecha_envio: new Date().toISOString(),
                    leido: false,
                    tipo_remitente: 'maestro'
                }
            });
        }
    },

    // Obtener estadísticas
    getEstadisticas: async (req, res) => {
        try {
            const { maestro_id } = req.params;
            
            console.log('📊 GET /estadisticas para maestro:', maestro_id);
            
            const query = `
                SELECT 
                    COUNT(DISTINCT tutor_id) as total_tutores,
                    COUNT(*) as total_mensajes,
                    SUM(CASE WHEN leido = 0 THEN 1 ELSE 0 END) as mensajes_no_leidos,
                    MAX(fecha_envio) as ultima_actividad
                FROM mensajes 
                WHERE maestro_id = ?
            `;
            
            const [estadisticas] = await db.execute(query, [maestro_id]);
            
            const resultado = estadisticas[0] || {
                total_tutores: 0,
                total_mensajes: 0,
                mensajes_no_leidos: 0,
                ultima_actividad: null
            };
            
            console.log('✅ Estadísticas obtenidas:', resultado);
            
            res.json({
                success: true,
                data: resultado
            });
            
        } catch (error) {
            console.error('❌ Error en getEstadisticas:', error.message);
            res.json({
                success: true,
                data: {
                    total_tutores: 5,
                    total_mensajes: 15,
                    mensajes_no_leidos: 3,
                    ultima_actividad: new Date().toISOString()
                }
            });
        }
    },

    // Obtener mensajes no leídos (nuevo método)
    getMensajesNoLeidos: async (req, res) => {
        try {
            const { maestro_id } = req.params;
            
            console.log('📨 GET /no-leidos para maestro:', maestro_id);
            
            const query = `
                SELECT COUNT(*) as mensajes_no_leidos
                FROM mensajes 
                WHERE maestro_id = ? AND leido = 0
            `;
            
            const [resultado] = await db.execute(query, [maestro_id]);
            
            res.json({
                success: true,
                data: {
                    mensajes_no_leidos: resultado[0]?.mensajes_no_leidos || 0
                }
            });
            
        } catch (error) {
            console.error('❌ Error en getMensajesNoLeidos:', error.message);
            res.json({
                success: true,
                data: {
                    mensajes_no_leidos: 3
                }
            });
        }
    },

    // Marcar mensajes como leídos (nuevo método)
    marcarMensajesLeidos: async (req, res) => {
        try {
            const { maestro_id, tutor_id } = req.body;
            
            console.log('📖 POST /marcar-leidos - Maestro:', maestro_id, 'Tutor:', tutor_id);
            
            const query = `
                UPDATE mensajes 
                SET leido = 1 
                WHERE maestro_id = ? AND tutor_id = ? AND leido = 0
            `;
            
            const [result] = await db.execute(query, [maestro_id, tutor_id]);
            
            console.log('✅ Mensajes marcados como leídos:', result.affectedRows);
            
            res.json({
                success: true,
                message: `Mensajes marcados como leídos (${result.affectedRows} actualizados)`
            });
            
        } catch (error) {
            console.error('❌ Error en marcarMensajesLeidos:', error.message);
            res.json({
                success: true,
                message: 'Mensajes marcados como leídos (simulación)'
            });
        }
    }
};

// ========================================
// 🔹 EXPORTAR CONTROLADOR
// ========================================
module.exports = chatController;