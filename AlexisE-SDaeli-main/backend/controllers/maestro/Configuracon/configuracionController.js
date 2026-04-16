// backend/controllers/maestro/Configuracon/configuracionController.js
const db = require('../../../config/dbConfig');
const bcrypt = require('bcryptjs');

const configuracionController = {
    /**
     * Actualizar datos del administrador/maestro
     * POST /api/maestro/configuracion/actualizar
     */
    actualizarUsuario: async (req, res) => {
        try {
            console.log('📝 Recibida solicitud de actualización:', req.body);
            
            const { nuevoNombre, nuevoCorreo, contrasenaActual, contrasenaNueva } = req.body;
            
            // Obtener ID del usuario desde el middleware de autenticación
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                return res.status(401).json({
                    success: false,
                    message: 'No autorizado - Usuario no identificado',
                    ok: false
                });
            }

            console.log('👤 Usuario ID:', usuarioId);

            // Verificar que al menos un campo para actualizar
            if (!nuevoNombre && !nuevoCorreo && !contrasenaNueva) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes proporcionar al menos un campo para actualizar',
                    ok: false
                });
            }

            // Si va a cambiar contraseña, verificar que proporcionó la actual
            if (contrasenaNueva && !contrasenaActual) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes proporcionar tu contraseña actual para cambiarla',
                    ok: false
                });
            }

            // Obtener datos actuales del usuario de la tabla administradores
            const [usuarios] = await db.query(
                'SELECT id, admin_nombre, admin_email, admin_password, rol, fecha_registro FROM administradores WHERE id = ?',
                [usuarioId]
            );

            if (usuarios.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado en administradores',
                    ok: false
                });
            }

            const usuario = usuarios[0];
            
            // Si quiere cambiar contraseña, verificar la actual
            if (contrasenaNueva) {
                const passwordValida = await bcrypt.compare(contrasenaActual, usuario.admin_password);
                
                if (!passwordValida) {
                    return res.status(401).json({
                        success: false,
                        message: 'La contraseña actual es incorrecta',
                        ok: false
                    });
                }

                // Validar longitud de nueva contraseña
                if (contrasenaNueva.length < 6) {
                    return res.status(400).json({
                        success: false,
                        message: 'La nueva contraseña debe tener al menos 6 caracteres',
                        ok: false
                    });
                }
            }

            // Validar formato de correo si se proporciona
            if (nuevoCorreo) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(nuevoCorreo)) {
                    return res.status(400).json({
                        success: false,
                        message: 'El formato del correo electrónico no es válido',
                        ok: false
                    });
                }

                // Verificar que el nuevo correo no esté en uso por otro usuario
                const [existeEmail] = await db.query(
                    'SELECT id FROM administradores WHERE admin_email = ? AND id != ?',
                    [nuevoCorreo, usuarioId]
                );

                if (existeEmail.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Este correo electrónico ya está registrado',
                        ok: false
                    });
                }
            }

            // Validar nombre si se proporciona
            if (nuevoNombre && nuevoNombre.trim().length < 3) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre debe tener al menos 3 caracteres',
                    ok: false
                });
            }

            // Construir query de actualización dinámica
            let updateFields = [];
            let updateValues = [];

            if (nuevoNombre) {
                updateFields.push('admin_nombre = ?');
                updateValues.push(nuevoNombre.trim());
            }

            if (nuevoCorreo) {
                updateFields.push('admin_email = ?');
                updateValues.push(nuevoCorreo);
            }

            if (contrasenaNueva) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(contrasenaNueva, salt);
                updateFields.push('admin_password = ?');
                updateValues.push(hashedPassword);
            }

            // Agregar el ID al final de los valores
            updateValues.push(usuarioId);

            // Ejecutar actualización
            const query = `UPDATE administradores SET ${updateFields.join(', ')} WHERE id = ?`;
            await db.query(query, updateValues);

            // Obtener datos actualizados
            const [usuariosActualizados] = await db.query(
                'SELECT id, admin_nombre, admin_email, rol, fecha_registro FROM administradores WHERE id = ?',
                [usuarioId]
            );

            const usuarioActualizado = usuariosActualizados[0];

            // Construir mensaje según qué se actualizó
            let mensaje = '';
            const cambios = [];
            if (nuevoNombre) cambios.push('nombre');
            if (nuevoCorreo) cambios.push('correo');
            if (contrasenaNueva) cambios.push('contraseña');
            
            if (cambios.length === 1) {
                mensaje = `${cambios[0].charAt(0).toUpperCase() + cambios[0].slice(1)} actualizado correctamente`;
            } else {
                mensaje = `${cambios.join(', ')} actualizados correctamente`;
            }

            // Respuesta exitosa
            return res.json({
                ok: true,
                success: true,
                message: mensaje,
                usuario: {
                    id: usuarioActualizado.id,
                    nombre: usuarioActualizado.admin_nombre,
                    email: usuarioActualizado.admin_email,
                    rol: usuarioActualizado.rol,
                    fechaRegistro: usuarioActualizado.fecha_registro
                }
            });

        } catch (error) {
            console.error('❌ Error en actualizarUsuario:', error);
            return res.status(500).json({
                ok: false,
                success: false,
                message: 'Error al actualizar los datos',
                error: error.message
            });
        }
    },

    /**
     * Obtener datos del usuario actual
     * GET /api/maestro/configuracion/perfil
     */
    obtenerPerfil: async (req, res) => {
        try {
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                return res.status(401).json({
                    ok: false,
                    success: false,
                    message: 'No autorizado'
                });
            }

            const [usuarios] = await db.query(
                'SELECT id, admin_nombre, admin_email, rol, fecha_registro FROM administradores WHERE id = ?',
                [usuarioId]
            );

            if (usuarios.length === 0) {
                return res.status(404).json({
                    ok: false,
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const usuario = usuarios[0];

            return res.json({
                ok: true,
                success: true,
                usuario: {
                    id: usuario.id,
                    nombre: usuario.admin_nombre,
                    email: usuario.admin_email,
                    rol: usuario.rol,
                    fechaRegistro: usuario.fecha_registro
                }
            });

        } catch (error) {
            console.error('❌ Error en obtenerPerfil:', error);
            return res.status(500).json({
                ok: false,
                success: false,
                message: 'Error al obtener perfil',
                error: error.message
            });
        }
    },

    /**
     * Insertar registro de auditoría
     * POST /api/maestro/configuracion/auditoria
     */
    insertarAuditoria: async (req, res) => {
        try {
            const { accion } = req.body;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                return res.status(401).json({
                    ok: false,
                    success: false,
                    message: 'No autorizado'
                });
            }

            if (!accion) {
                return res.status(400).json({
                    ok: false,
                    success: false,
                    message: 'Debes proporcionar una acción'
                });
            }

            // Obtener nombre del usuario
            const [usuarios] = await db.query(
                'SELECT admin_nombre FROM administradores WHERE id = ?',
                [usuarioId]
            );

            if (usuarios.length === 0) {
                return res.status(404).json({
                    ok: false,
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const nombreUsuario = usuarios[0].admin_nombre;

            // Intentar insertar en tabla de auditoría si existe
            try {
                await db.query(
                    'INSERT INTO auditoria (usuario_id, usuario_nombre, accion, realizada_en) VALUES (?, ?, ?, NOW())',
                    [usuarioId, nombreUsuario, accion]
                );
                console.log('✅ Registro de auditoría insertado:', accion);
            } catch (dbError) {
                // Si la tabla no existe, solo logueamos
                console.log('ℹ️ Tabla auditoria no existe, continuando sin registro');
            }

            return res.json({
                ok: true,
                success: true,
                message: 'Acción registrada correctamente'
            });

        } catch (error) {
            console.error('❌ Error en insertarAuditoria:', error);
            // No fallar la petición principal si la auditoría falla
            return res.json({
                ok: true,
                success: true,
                message: 'Acción procesada (auditoría no disponible)'
            });
        }
    },

    /**
     * Obtener historial de auditoría
     * GET /api/maestro/configuracion/historial
     */
    obtenerHistorial: async (req, res) => {
        try {
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                return res.status(401).json({
                    ok: false,
                    success: false,
                    message: 'No autorizado'
                });
            }

            try {
                const [historial] = await db.query(
                    `SELECT id, accion, usuario_nombre as usuario, realizada_en 
                     FROM auditoria 
                     WHERE usuario_id = ? 
                     ORDER BY realizada_en DESC 
                     LIMIT 50`,
                    [usuarioId]
                );

                return res.json({
                    ok: true,
                    success: true,
                    historial: historial
                });
            } catch (dbError) {
                // Si la tabla no existe, devolver array vacío
                console.log('ℹ️ Tabla auditoria no existe, devolviendo historial vacío');
                return res.json({
                    ok: true,
                    success: true,
                    historial: []
                });
            }

        } catch (error) {
            console.error('❌ Error en obtenerHistorial:', error);
            return res.json({
                ok: true,
                success: true,
                historial: []
            });
        }
    }
};

module.exports = configuracionController;