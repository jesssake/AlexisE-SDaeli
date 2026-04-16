// C:\Codigos\HTml\gestion-educativa\backend\controllers\estudiante\padres\chatController.js
const db = require('../../../config/dbConfig');

const chatController = {
    // 🔍 Obtener conversaciones del estudiante/tutor - VERSIÓN CORREGIDA
    getConversaciones: async (req, res) => {
        try {
            const { estudiante_id } = req.params;
            
            console.log('🔍 GET /conversaciones para estudiante ID:', estudiante_id);
            
            // 1. Verificar que el estudiante existe
            const usuarioQuery = `
                SELECT id, tutor_nombre, nino_nombre, tutor_email, rol
                FROM usuarios 
                WHERE id = ?
            `;
            
            const [usuarios] = await db.execute(usuarioQuery, [estudiante_id]);
            
            if (usuarios.length === 0) {
                console.log('❌ Usuario no encontrado');
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            const usuario = usuarios[0];
            console.log('✅ Usuario encontrado:', usuario);
            
            // 2. Buscar conversaciones - SOLO con maestros (rol = 'maestro')
            const query = `
                SELECT 
                    DISTINCT m.maestro_id,
                    a.admin_nombre as maestro_nombre,
                    a.admin_email as maestro_email,
                    a.rol as maestro_rol,
                    ? as nino_nombre,
                    COALESCE(
                        (SELECT m2.mensaje 
                         FROM mensajes m2 
                         WHERE m2.tutor_id = ? 
                         AND m2.maestro_id = m.maestro_id
                         ORDER BY m2.fecha_envio DESC 
                         LIMIT 1),
                        'Sin mensajes aún'
                    ) as ultimo_mensaje,
                    COALESCE(
                        (SELECT m3.fecha_envio 
                         FROM mensajes m3 
                         WHERE m3.tutor_id = ? 
                         AND m3.maestro_id = m.maestro_id
                         ORDER BY m3.fecha_envio DESC 
                         LIMIT 1),
                        NOW()
                    ) as fecha_ultimo_mensaje,
                    COALESCE(
                        (SELECT COUNT(*) 
                         FROM mensajes m4 
                         WHERE m4.maestro_id = m.maestro_id 
                         AND m4.tutor_id = ? 
                         AND m4.leido = 0
                         AND m4.tipo_remitente = 'maestro'),
                        0
                    ) as mensajes_no_leidos
                FROM mensajes m
                INNER JOIN administradores a ON m.maestro_id = a.id
                WHERE m.tutor_id = ?
                ORDER BY fecha_ultimo_mensaje DESC
            `;
            
            const params = [
                usuario.nino_nombre || 'Estudiante',
                estudiante_id,
                estudiante_id,
                estudiante_id,
                estudiante_id
            ];
            
            const [conversaciones] = await db.execute(query, params);
            console.log('✅ Conversaciones encontradas:', conversaciones.length);
            
            // Si no hay conversaciones, mostrar maestros disponibles
            if (conversaciones.length === 0) {
                console.log('ℹ️  No hay conversaciones, mostrando maestros disponibles...');
                
                // ✅ CORREGIDO: SOLO MAESTROS (rol = 'maestro')
                const maestrosQuery = `
                    SELECT 
                        id as maestro_id,
                        admin_nombre as maestro_nombre,
                        admin_email as maestro_email,
                        'Puedes iniciar una conversación' as descripcion,
                        ? as nino_nombre,
                        'Sin conversación iniciada' as ultimo_mensaje,
                        NOW() as fecha_ultimo_mensaje,
                        0 as mensajes_no_leidos,
                        0 as tiene_conversacion
                    FROM administradores
                    WHERE rol = 'maestro'  -- ✅ SOLO MAESTROS
                    ORDER BY admin_nombre
                `;
                
                const [maestros] = await db.execute(maestrosQuery, [usuario.nino_nombre]);
                console.log('✅ Maestros disponibles encontrados:', maestros.length);
                
                return res.json({
                    success: true,
                    data: maestros,
                    message: 'No hay conversaciones, mostrando maestros disponibles'
                });
            }
            
            res.json({
                success: true,
                data: conversaciones,
                userInfo: {
                    id: usuario.id,
                    nombre: usuario.tutor_nombre,
                    estudiante: usuario.nino_nombre,
                    email: usuario.tutor_email
                }
            });
            
        } catch (error) {
            console.error('❌ Error general en getConversaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // 👨‍🏫 Obtener maestros disponibles - VERSIÓN CORREGIDA
    getMaestrosDisponibles: async (req, res) => {
        try {
            const { estudiante_id } = req.params;
            
            console.log('👨‍🏫 GET /maestros-disponibles para estudiante:', estudiante_id);
            
            // Verificar estudiante
            const estudianteQuery = `
                SELECT id, tutor_nombre, nino_nombre 
                FROM usuarios 
                WHERE id = ?
            `;
            const [estudiantes] = await db.execute(estudianteQuery, [estudiante_id]);
            
            if (estudiantes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudiante no encontrado'
                });
            }
            
            const estudiante = estudiantes[0];
            
            // ✅ CORREGIDO: SOLO MAESTROS (rol = 'maestro')
            const maestrosQuery = `
                SELECT 
                    id as maestro_id,
                    admin_nombre as maestro_nombre,
                    admin_email as maestro_email,
                    'Puedes iniciar una conversación' as descripcion
                FROM administradores
                WHERE rol = 'maestro'  -- ✅ SOLO MAESTROS
                ORDER BY admin_nombre
            `;
            
            const [maestros] = await db.execute(maestrosQuery);
            
            // Verificar cuáles ya tienen conversación
            const maestrosConEstado = await Promise.all(
                maestros.map(async (maestro) => {
                    const conversacionQuery = `
                        SELECT COUNT(*) as tiene_conversacion
                        FROM mensajes 
                        WHERE maestro_id = ? AND tutor_id = ?
                    `;
                    
                    const [resultado] = await db.execute(conversacionQuery, [maestro.maestro_id, estudiante_id]);
                    
                    return {
                        ...maestro,
                        nino_nombre: estudiante.nino_nombre,
                        tiene_conversacion: resultado[0]?.tiene_conversacion > 0,
                        ultimo_mensaje: resultado[0]?.tiene_conversacion > 0 ? 'Ver conversación' : 'Iniciar conversación',
                        fecha_ultimo_mensaje: new Date().toISOString(),
                        mensajes_no_leidos: 0
                    };
                })
            );
            
            console.log('✅ Maestros disponibles:', maestrosConEstado.length);
            
            res.json({
                success: true,
                data: maestrosConEstado,
                estudiante_info: {
                    id: estudiante.id,
                    nombre: estudiante.tutor_nombre,
                    nino_nombre: estudiante.nino_nombre
                }
            });
            
        } catch (error) {
            console.error('❌ Error en getMaestrosDisponibles:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener maestros disponibles',
                error: error.message
            });
        }
    },

    // 💬 Obtener mensajes de una conversación
    getMensajes: async (req, res) => {
        try {
            const { estudiante_id, maestro_id } = req.params;
            
            console.log('🔍 GET /mensajes - Estudiante:', estudiante_id, 'Maestro:', maestro_id);
            
            const query = `
                SELECT 
                    m.id,
                    a.admin_nombre as maestro_nombre,
                    u.tutor_nombre,
                    u.nino_nombre,
                    m.mensaje,
                    m.fecha_envio,
                    m.leido,
                    m.tipo_remitente
                FROM mensajes m
                LEFT JOIN administradores a ON m.maestro_id = a.id
                LEFT JOIN usuarios u ON m.tutor_id = u.id
                WHERE m.maestro_id = ? 
                AND m.tutor_id = ?
                ORDER BY m.fecha_envio ASC
            `;
            
            const [mensajes] = await db.execute(query, [maestro_id, estudiante_id]);
            
            console.log('✅ Mensajes encontrados:', mensajes.length);
            
            // Marcar mensajes no leídos del maestro como leídos
            if (mensajes.length > 0) {
                try {
                    const updateQuery = `
                        UPDATE mensajes 
                        SET leido = 1 
                        WHERE maestro_id = ? 
                        AND tutor_id = ? 
                        AND leido = 0
                        AND tipo_remitente = 'maestro'
                    `;
                    
                    await db.execute(updateQuery, [maestro_id, estudiante_id]);
                    console.log('📖 Mensajes del maestro marcados como leídos');
                } catch (updateError) {
                    console.log('⚠️ No se pudieron actualizar mensajes como leídos:', updateError.message);
                }
            }
            
            res.json({
                success: true,
                data: mensajes
            });
            
        } catch (error) {
            console.error('❌ Error en getMensajes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener mensajes',
                error: error.message
            });
        }
    },

    // 📤 Enviar mensaje
    enviarMensaje: async (req, res) => {
        try {
            const { estudiante_id, maestro_id, mensaje } = req.body;
            
            console.log('📤 POST /enviar - Estudiante:', estudiante_id, 'Maestro:', maestro_id);
            
            if (!estudiante_id || !maestro_id || !mensaje?.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos incompletos: se requiere estudiante_id, maestro_id y mensaje'
                });
            }
            
            // Verificar que el estudiante existe
            const estudianteQuery = `
                SELECT id, tutor_nombre, nino_nombre 
                FROM usuarios 
                WHERE id = ?
            `;
            const [estudiantes] = await db.execute(estudianteQuery, [estudiante_id]);
            
            if (estudiantes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudiante/Tutor no encontrado'
                });
            }
            
            const estudiante = estudiantes[0];
            
            // Verificar que el maestro existe y es MAESTRO
            const maestroQuery = `
                SELECT id, admin_nombre 
                FROM administradores 
                WHERE id = ? AND rol = 'maestro'
            `;
            const [maestros] = await db.execute(maestroQuery, [maestro_id]);
            
            if (maestros.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Maestro no encontrado'
                });
            }
            
            const maestro = maestros[0];
            
            // Insertar mensaje
            const insertQuery = `
                INSERT INTO mensajes 
                (maestro_id, tutor_id, mensaje, fecha_envio, leido, tipo_remitente)
                VALUES (?, ?, ?, NOW(), 0, 'tutor')
            `;
            
            const [result] = await db.execute(insertQuery, [
                maestro_id, 
                estudiante_id, 
                mensaje.trim()
            ]);
            
            console.log('✅ Mensaje insertado ID:', result.insertId);
            
            // Obtener el mensaje insertado
            const mensajeQuery = `
                SELECT 
                    m.id,
                    a.admin_nombre as maestro_nombre,
                    u.tutor_nombre,
                    u.nino_nombre,
                    m.mensaje,
                    m.fecha_envio,
                    m.leido,
                    m.tipo_remitente
                FROM mensajes m
                LEFT JOIN administradores a ON m.maestro_id = a.id
                LEFT JOIN usuarios u ON m.tutor_id = u.id
                WHERE m.id = ?
            `;
            
            const [mensajesInsertados] = await db.execute(mensajeQuery, [result.insertId]);
            
            res.json({
                success: true,
                message: 'Mensaje enviado exitosamente',
                data: mensajesInsertados[0]
            });
            
        } catch (error) {
            console.error('❌ Error en enviarMensaje:', error);
            res.status(500).json({
                success: false,
                message: 'Error al enviar mensaje',
                error: error.message
            });
        }
    },

    // 📊 Obtener estadísticas
    getEstadisticas: async (req, res) => {
        try {
            const { estudiante_id } = req.params;
            
            console.log('📊 GET /estadisticas para estudiante:', estudiante_id);
            
            const query = `
                SELECT 
                    COUNT(DISTINCT maestro_id) as total_maestros,
                    COUNT(*) as total_mensajes,
                    SUM(CASE WHEN leido = 0 AND tipo_remitente = 'maestro' THEN 1 ELSE 0 END) as mensajes_no_leidos,
                    MAX(fecha_envio) as ultima_actividad
                FROM mensajes 
                WHERE tutor_id = ?
            `;
            
            const [estadisticas] = await db.execute(query, [estudiante_id]);
            
            const resultado = estadisticas[0] || {
                total_maestros: 0,
                total_mensajes: 0,
                mensajes_no_leidos: 0,
                ultima_actividad: null
            };
            
            console.log('✅ Estadísticas:', resultado);
            
            res.json({
                success: true,
                data: resultado
            });
            
        } catch (error) {
            console.error('❌ Error en getEstadisticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            });
        }
    },

    // 📨 Obtener mensajes no leídos
    getMensajesNoLeidos: async (req, res) => {
        try {
            const { estudiante_id } = req.params;
            
            console.log('📨 GET /no-leidos para estudiante:', estudiante_id);
            
            const query = `
                SELECT COUNT(*) as mensajes_no_leidos
                FROM mensajes 
                WHERE tutor_id = ? 
                AND leido = 0 
                AND tipo_remitente = 'maestro'
            `;
            
            const [resultado] = await db.execute(query, [estudiante_id]);
            
            res.json({
                success: true,
                data: {
                    mensajes_no_leidos: resultado[0]?.mensajes_no_leidos || 0
                }
            });
            
        } catch (error) {
            console.error('❌ Error en getMensajesNoLeidos:', error);
            res.status(500).json({
                success: false,
                data: {
                    mensajes_no_leidos: 0,
                    error: error.message
                }
            });
        }
    },

    // 📖 Marcar mensajes como leídos
    marcarMensajesLeidos: async (req, res) => {
        try {
            const { estudiante_id, maestro_id } = req.body;
            
            console.log('📖 POST /marcar-leídos - Estudiante:', estudiante_id, 'Maestro:', maestro_id);
            
            if (!estudiante_id || !maestro_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere estudiante_id y maestro_id'
                });
            }
            
            const query = `
                UPDATE mensajes 
                SET leido = 1 
                WHERE maestro_id = ? 
                AND tutor_id = ? 
                AND leido = 0
                AND tipo_remitente = 'maestro'
            `;
            
            const [result] = await db.execute(query, [maestro_id, estudiante_id]);
            
            console.log('✅ Mensajes actualizados:', result.affectedRows);
            
            res.json({
                success: true,
                message: `Mensajes marcados como leídos (${result.affectedRows} actualizados)`
            });
            
        } catch (error) {
            console.error('❌ Error en marcarMensajesLeidos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al marcar mensajes como leídos',
                error: error.message
            });
        }
    },
    
    // 🚀 Iniciar conversación
    iniciarConversacion: async (req, res) => {
        try {
            const { estudiante_id, maestro_id, mensaje_inicial } = req.body;
            
            console.log('🚀 POST /iniciar-conversación - Estudiante:', estudiante_id, 'Maestro:', maestro_id);
            
            if (!estudiante_id || !maestro_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere estudiante_id y maestro_id'
                });
            }
            
            // Verificar estudiante
            const estudianteQuery = `
                SELECT id, tutor_nombre, nino_nombre 
                FROM usuarios 
                WHERE id = ?
            `;
            const [estudiantes] = await db.execute(estudianteQuery, [estudiante_id]);
            
            if (estudiantes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudiante no encontrado'
                });
            }
            
            const estudiante = estudiantes[0];
            
            // Verificar maestro (SOLO MAESTROS)
            const maestroQuery = `
                SELECT id, admin_nombre 
                FROM administradores 
                WHERE id = ? AND rol = 'maestro'
            `;
            const [maestros] = await db.execute(maestroQuery, [maestro_id]);
            
            if (maestros.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Maestro no encontrado'
                });
            }
            
            const maestro = maestros[0];
            
            // Insertar mensaje inicial si se proporciona
            if (mensaje_inicial?.trim()) {
                const insertQuery = `
                    INSERT INTO mensajes 
                    (maestro_id, tutor_id, mensaje, fecha_envio, leido, tipo_remitente)
                    VALUES (?, ?, ?, NOW(), 0, 'tutor')
                `;
                
                await db.execute(insertQuery, [
                    maestro_id, 
                    estudiante_id, 
                    mensaje_inicial.trim()
                ]);
                
                console.log('✅ Mensaje inicial insertado');
            }
            
            // Verificar si ya hay mensajes
            const mensajesQuery = `
                SELECT COUNT(*) as total_mensajes
                FROM mensajes 
                WHERE maestro_id = ? AND tutor_id = ?
            `;
            
            const [mensajesResult] = await db.execute(mensajesQuery, [maestro_id, estudiante_id]);
            const totalMensajes = mensajesResult[0]?.total_mensajes || 0;
            
            res.json({
                success: true,
                message: totalMensajes > 0 ? 'Conversación existente' : 'Conversación iniciada',
                data: {
                    estudiante: estudiante,
                    maestro: maestro,
                    total_mensajes: totalMensajes,
                    tiene_conversacion: totalMensajes > 0
                }
            });
            
        } catch (error) {
            console.error('❌ Error en iniciarConversacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al iniciar conversación',
                error: error.message
            });
        }
    },

    // 🩺 Verificar salud del servidor
    getStatus: async (req, res) => {
        try {
            console.log('🩺 GET /status - Verificando salud del servidor');
            
            // Verificar conexión a base de datos
            let dbStatus = '🔴 Offline';
            try {
                await db.execute('SELECT 1');
                dbStatus = '🟢 Online';
            } catch (dbError) {
                console.error('❌ Error conexión DB:', dbError.message);
            }
            
            res.json({
                success: true,
                service: 'Chat Estudiante/Padres',
                status: '🟢 Online',
                database: dbStatus,
                timestamp: new Date().toISOString(),
                version: '2.0'
            });
            
        } catch (error) {
            console.error('❌ Error en getStatus:', error);
            res.json({
                success: false,
                service: 'Chat Estudiante/Padres',
                status: '🔴 Offline',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
};

module.exports = chatController;