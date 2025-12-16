// C:\Codigos\HTml\gestion-educativa\backend\controllers\estudiante\padres\chatController.js
const db = require('../../../config/dbConfig');

const chatController = {
    // 🔍 Obtener conversaciones del estudiante/tutor
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
            
            console.log('📋 Ejecutando consulta de usuario:', usuarioQuery);
            
            let usuarios;
            try {
                [usuarios] = await db.execute(usuarioQuery, [estudiante_id]);
            } catch (dbError) {
                console.error('❌ Error en consulta de usuario:', dbError.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error de base de datos al verificar usuario',
                    error: dbError.message
                });
            }
            
            if (usuarios.length === 0) {
                console.log('❌ Usuario no encontrado');
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            const usuario = usuarios[0];
            console.log('✅ Usuario encontrado:', usuario);
            
            // 2. Verificar rol de tutor
            if (usuario.rol !== 'tutor') {
                console.log('⚠️  Usuario no es tutor, rol:', usuario.rol);
                return res.json({
                    success: true,
                    data: [],
                    message: 'Usuario no es tutor, no tiene conversaciones'
                });
            }
            
            // 3. Buscar conversaciones
            const query = `
                SELECT 
                    DISTINCT m.maestro_id,
                    a.admin_nombre as maestro_nombre,
                    a.admin_email as maestro_email,
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
            
            console.log('📊 Ejecutando consulta principal con params:', params);
            
            let conversaciones;
            try {
                [conversaciones] = await db.execute(query, params);
                console.log('✅ Consulta exitosa, conversaciones:', conversaciones.length);
            } catch (queryError) {
                console.error('❌ Error en consulta principal:', queryError.message);
                console.error('SQL Error:', queryError.sqlMessage);
                console.error('SQL:', queryError.sql);
                
                // Intentar con consulta simplificada
                console.log('🔄 Intentando consulta simplificada...');
                
                const simpleQuery = `
                    SELECT 
                        DISTINCT m.maestro_id,
                        a.admin_nombre as maestro_nombre,
                        a.admin_email as maestro_email,
                        ? as nino_nombre,
                        'Tiene conversación' as ultimo_mensaje,
                        NOW() as fecha_ultimo_mensaje,
                        0 as mensajes_no_leidos
                    FROM mensajes m
                    INNER JOIN administradores a ON m.maestro_id = a.id
                    WHERE m.tutor_id = ?
                `;
                
                try {
                    [conversaciones] = await db.execute(simpleQuery, [usuario.nino_nombre, estudiante_id]);
                    console.log('✅ Consulta simplificada exitosa');
                } catch (simpleError) {
                    console.error('❌ Error en consulta simplificada:', simpleError.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Error de base de datos',
                        details: simpleError.message,
                        sqlError: simpleError.sqlMessage
                    });
                }
            }
            
            console.log('✅ Conversaciones encontradas:', conversaciones.length);
            
            // Si no hay conversaciones, mostrar maestros disponibles
            if (conversaciones.length === 0) {
                console.log('ℹ️  No hay conversaciones, mostrando maestros disponibles...');
                
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
                    WHERE activo = 1
                    ORDER BY admin_nombre
                `;
                
                try {
                    const [maestros] = await db.execute(maestrosQuery, [usuario.nino_nombre]);
                    console.log('✅ Maestros disponibles encontrados:', maestros.length);
                    
                    return res.json({
                        success: true,
                        data: maestros,
                        message: 'No hay conversaciones, mostrando maestros disponibles'
                    });
                } catch (maestrosError) {
                    console.error('❌ Error obteniendo maestros disponibles:', maestrosError);
                }
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
            console.error('Stack:', error.stack);
            
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    },

    // 💬 Obtener mensajes de una conversación
    getMensajes: async (req, res) => {
        try {
            const { estudiante_id, maestro_id } = req.params;
            
            console.log('🔍 GET /mensajes - Estudiante:', estudiante_id, 'Maestro:', maestro_id);
            
            // Verificar que ambos usuarios existen
            const estudianteQuery = `SELECT id, tutor_nombre, nino_nombre FROM usuarios WHERE id = ?`;
            const maestroQuery = `SELECT id, admin_nombre FROM administradores WHERE id = ?`;
            
            const [estudiantes] = await db.execute(estudianteQuery, [estudiante_id]);
            const [maestros] = await db.execute(maestroQuery, [maestro_id]);
            
            if (estudiantes.length === 0 || maestros.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudiante o maestro no encontrado'
                });
            }
            
            const estudiante = estudiantes[0];
            const maestro = maestros[0];
            
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
            
            // Marcar mensajes no leídos como leídos si el tutor los está viendo
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
                    
                    const [result] = await db.execute(updateQuery, [maestro_id, estudiante_id]);
                    if (result.affectedRows > 0) {
                        console.log('📖 Mensajes marcados como leídos:', result.affectedRows);
                    }
                } catch (updateError) {
                    console.log('⚠️ No se pudieron actualizar mensajes como leídos:', updateError.message);
                }
            }
            
            // Asegurar que tipo_remitente esté presente
            const mensajesCompletos = mensajes.map(mensaje => {
                if (!mensaje.tipo_remitente) {
                    // Determinar tipo basado en el remitente más probable
                    return {
                        ...mensaje,
                        tipo_remitente: 'maestro' // Por defecto
                    };
                }
                return mensaje;
            });
            
            res.json({
                success: true,
                data: mensajesCompletos,
                info: {
                    estudiante: estudiante.tutor_nombre,
                    maestro: maestro.admin_nombre,
                    nino_nombre: estudiante.nino_nombre,
                    total_mensajes: mensajesCompletos.length
                }
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
            
            // Verificar que el estudiante existe y es tutor
            const estudianteQuery = `
                SELECT id, tutor_nombre, nino_nombre 
                FROM usuarios 
                WHERE id = ? AND rol = 'tutor'
            `;
            const [estudiantes] = await db.execute(estudianteQuery, [estudiante_id]);
            
            if (estudiantes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudiante/Tutor no encontrado o no es tutor'
                });
            }
            
            const estudiante = estudiantes[0];
            
            // Verificar que el maestro existe
            const maestroQuery = `
                SELECT id, admin_nombre 
                FROM administradores 
                WHERE id = ?
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
            
            const mensajeEnviado = mensajesInsertados[0] || {
                id: result.insertId,
                maestro_nombre: maestro.admin_nombre,
                tutor_nombre: estudiante.tutor_nombre,
                nino_nombre: estudiante.nino_nombre,
                mensaje: mensaje.trim(),
                fecha_envio: new Date().toISOString(),
                leido: false,
                tipo_remitente: 'tutor'
            };
            
            res.json({
                success: true,
                message: 'Mensaje enviado exitosamente',
                data: mensajeEnviado,
                info: {
                    estudiante_id: estudiante_id,
                    maestro_id: maestro_id,
                    timestamp: new Date().toISOString()
                }
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
            
            // Verificar que el usuario existe
            const estudianteQuery = `
                SELECT id, tutor_nombre, nino_nombre 
                FROM usuarios 
                WHERE id = ?
            `;
            const [estudiantes] = await db.execute(estudianteQuery, [estudiante_id]);
            
            if (estudiantes.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        total_maestros: 0,
                        total_mensajes: 0,
                        mensajes_no_leidos: 0,
                        ultima_actividad: null,
                        estudiante_info: null
                    }
                });
            }
            
            const estudiante = estudiantes[0];
            
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
            
            if (resultado.ultima_actividad) {
                resultado.ultima_actividad = new Date(resultado.ultima_actividad).toISOString();
            }
            
            console.log('✅ Estadísticas:', resultado);
            
            res.json({
                success: true,
                data: {
                    ...resultado,
                    estudiante_info: {
                        nombre: estudiante.tutor_nombre,
                        nino_nombre: estudiante.nino_nombre
                    }
                }
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
                    mensajes_no_leidos: resultado[0]?.mensajes_no_leidos || 0,
                    estudiante_id: estudiante_id,
                    timestamp: new Date().toISOString()
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
                message: `Mensajes marcados como leídos (${result.affectedRows} actualizados)`,
                data: {
                    actualizados: result.affectedRows,
                    estudiante_id: estudiante_id,
                    maestro_id: maestro_id
                }
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
            
            // Verificar estudiante/tutor
            const estudianteQuery = `
                SELECT id, tutor_nombre, nino_nombre 
                FROM usuarios 
                WHERE id = ? AND rol = 'tutor'
            `;
            const [estudiantes] = await db.execute(estudianteQuery, [estudiante_id]);
            
            if (estudiantes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Estudiante/Tutor no encontrado'
                });
            }
            
            const estudiante = estudiantes[0];
            
            // Verificar maestro
            const maestroQuery = `
                SELECT id, admin_nombre 
                FROM administradores 
                WHERE id = ?
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
    
    // 👨‍🏫 Obtener maestros disponibles
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
            
            // Obtener todos los maestros activos
            const maestrosQuery = `
                SELECT 
                    id as maestro_id,
                    admin_nombre as maestro_nombre,
                    admin_email as maestro_email,
                    'Puedes iniciar una conversación' as descripcion
                FROM administradores
                WHERE activo = 1
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
            
            // Verificar tablas necesarias
            const tables = ['mensajes', 'usuarios', 'administradores'];
            const tablesStatus = {};
            
            for (const table of tables) {
                try {
                    const [result] = await db.execute(`SHOW TABLES LIKE '${table}'`);
                    tablesStatus[table] = result.length > 0 ? '🟢 Existe' : '🔴 No existe';
                } catch (error) {
                    tablesStatus[table] = '🔴 Error';
                }
            }
            
            res.json({
                success: true,
                service: 'Chat Estudiante/Padres',
                status: '🟢 Online',
                database: dbStatus,
                tables: tablesStatus,
                timestamp: new Date().toISOString(),
                version: '2.0',
                endpoints: [
                    'GET /conversaciones/:id',
                    'GET /mensajes/:estudiante_id/:maestro_id',
                    'POST /enviar',
                    'GET /estadisticas/:id',
                    'GET /no-leidos/:id',
                    'POST /marcar-leidos',
                    'POST /iniciar-conversacion',
                    'GET /maestros-disponibles/:id',
                    'GET /status'
                ]
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
    },

    // 🔧 Debug de base de datos
    debugDatabase: async (req, res) => {
        try {
            console.log('🔧 GET /debug-database');
            
            const tables = ['mensajes', 'usuarios', 'administradores'];
            const results = {};
            
            for (const table of tables) {
                try {
                    // Verificar si la tabla existe
                    const [exists] = await db.execute(`SHOW TABLES LIKE '${table}'`);
                    results[table] = {
                        exists: exists.length > 0,
                        structure: []
                    };
                    
                    if (exists.length > 0) {
                        // Obtener estructura
                        const [structure] = await db.execute(`DESCRIBE ${table}`);
                        results[table].structure = structure;
                        
                        // Obtener conteo
                        const [count] = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
                        results[table].count = count[0].count;
                        
                        // Obtener algunas filas de ejemplo
                        const [sample] = await db.execute(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 5`);
                        results[table].sample = sample;
                    }
                } catch (tableError) {
                    results[table] = { 
                        error: tableError.message,
                        sqlError: tableError.sqlMessage 
                    };
                }
            }
            
            // Verificar usuario específico
            try {
                const [user] = await db.execute('SELECT * FROM usuarios WHERE id = 3');
                results.user_id_3 = user;
            } catch (userError) {
                results.user_id_3 = { error: userError.message };
            }
            
            // Verificar mensajes del usuario 3
            try {
                const [userMessages] = await db.execute('SELECT * FROM mensajes WHERE tutor_id = 3 ORDER BY fecha_envio DESC');
                results.mensajes_usuario_3 = userMessages;
            } catch (messagesError) {
                results.mensajes_usuario_3 = { error: messagesError.message };
            }
            
            res.json({
                success: true,
                database: results,
                timestamp: new Date().toISOString(),
                server_time: new Date().toString()
            });
            
        } catch (error) {
            console.error('❌ Error en debugDatabase:', error);
            res.status(500).json({
                success: false,
                message: 'Error en debug',
                error: error.message,
                sqlError: error.sqlMessage
            });
        }
    },

    // 📋 Verificar datos del usuario
    verificarDatosUsuario: async (req, res) => {
        try {
            const { estudiante_id } = req.params;
            
            console.log('📋 GET /verificar-datos para estudiante:', estudiante_id);
            
            // Obtener datos del usuario
            const usuarioQuery = `
                SELECT 
                    id, tutor_nombre, tutor_email, tutor_telefono,
                    nino_nombre, nino_condiciones, fecha_nacimiento, rol
                FROM usuarios 
                WHERE id = ?
            `;
            
            const [usuarios] = await db.execute(usuarioQuery, [estudiante_id]);
            
            if (usuarios.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            const usuario = usuarios[0];
            
            // Verificar datos faltantes
            const datosFaltantes = [];
            const recomendaciones = [];
            
            if (!usuario.nino_nombre) {
                datosFaltantes.push('Nombre del niño');
                recomendaciones.push('Completa el nombre del niño en tu perfil');
            }
            
            if (!usuario.tutor_telefono) {
                datosFaltantes.push('Teléfono del tutor');
                recomendaciones.push('Añade tu número de teléfono para mejor comunicación');
            }
            
            // Obtener estadísticas de mensajes
            const mensajesQuery = `
                SELECT 
                    COUNT(*) as total_mensajes,
                    COUNT(DISTINCT maestro_id) as maestros_conversando
                FROM mensajes 
                WHERE tutor_id = ?
            `;
            
            const [mensajesResult] = await db.execute(mensajesQuery, [estudiante_id]);
            const estadisticasMensajes = mensajesResult[0] || { total_mensajes: 0, maestros_conversando: 0 };
            
            res.json({
                success: true,
                data: {
                    usuario: usuario,
                    datos_faltantes: datosFaltantes,
                    recomendaciones: recomendaciones,
                    estadisticas_mensajes: estadisticasMensajes,
                    perfil_completo: datosFaltantes.length === 0,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Error en verificarDatosUsuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar datos',
                error: error.message
            });
        }
    }
};

module.exports = chatController;