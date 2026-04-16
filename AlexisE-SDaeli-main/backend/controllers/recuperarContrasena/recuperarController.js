// backend/controllers/recuperarContrasena/recuperarController.js

const pool = require('../../config/dbConfig');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// ========================================
// 1. INICIAR RECUPERACIÓN - VERIFICAR EMAIL
// ========================================
const iniciarRecuperacion = async (req, res) => {
    try {
        const { email } = req.body;
        
        console.log('🔐 Iniciando recuperación para:', email);
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico es requerido'
            });
        }
        
        // Buscar usuario - solo usar tutor_email
        const [rows] = await pool.query(
            `SELECT id, tutor_nombre, tutor_email 
             FROM usuarios 
             WHERE tutor_email = ?`,
            [email]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No existe una cuenta con este correo electrónico'
            });
        }
        
        const usuario = rows[0];
        
        // Buscar preguntas de seguridad del usuario
        const [preguntasRows] = await pool.query(
            `SELECT pregunta1, respuesta1, pregunta2, respuesta2, pregunta3, respuesta3,
                    pregunta4, respuesta4, pregunta5, respuesta5
             FROM recuperar_contrasena 
             WHERE usuario_id = ?`,
            [usuario.id]
        );
        
        if (preguntasRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay preguntas de seguridad configuradas para esta cuenta'
            });
        }
        
        const preguntas = preguntasRows[0];
        const listaPreguntas = [];
        
        // Recopilar preguntas disponibles (solo las que tienen valor)
        if (preguntas.pregunta1 && preguntas.pregunta1 !== 'NULL') listaPreguntas.push({ id: 1, pregunta: preguntas.pregunta1 });
        if (preguntas.pregunta2 && preguntas.pregunta2 !== 'NULL') listaPreguntas.push({ id: 2, pregunta: preguntas.pregunta2 });
        if (preguntas.pregunta3 && preguntas.pregunta3 !== 'NULL') listaPreguntas.push({ id: 3, pregunta: preguntas.pregunta3 });
        if (preguntas.pregunta4 && preguntas.pregunta4 !== 'NULL') listaPreguntas.push({ id: 4, pregunta: preguntas.pregunta4 });
        if (preguntas.pregunta5 && preguntas.pregunta5 !== 'NULL') listaPreguntas.push({ id: 5, pregunta: preguntas.pregunta5 });
        
        console.log('📋 Preguntas encontradas:', listaPreguntas.length);
        
        res.json({
            success: true,
            usuario_id: usuario.id,
            nombre: usuario.tutor_nombre,
            preguntas: listaPreguntas,
            message: 'Responde las preguntas de seguridad para recuperar tu contraseña'
        });
        
    } catch (error) {
        console.error('❌ Error en iniciarRecuperacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud',
            error: error.message
        });
    }
};

// ========================================
// 2. VERIFICAR RESPUESTAS DE SEGURIDAD
// ========================================
const verificarRespuestas = async (req, res) => {
    try {
        const { usuario_id, respuestas } = req.body;
        
        console.log('🔍 Verificando respuestas para usuario:', usuario_id);
        
        if (!usuario_id || !respuestas || respuestas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos'
            });
        }
        
        // Obtener preguntas y respuestas del usuario
        const [rows] = await pool.query(
            `SELECT respuesta1, respuesta2, respuesta3, respuesta4, respuesta5
             FROM recuperar_contrasena 
             WHERE usuario_id = ?`,
            [usuario_id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay preguntas de seguridad configuradas'
            });
        }
        
        const respuestasGuardadas = rows[0];
        let respuestasValidas = 0;
        
        // Verificar cada respuesta
        for (const resp of respuestas) {
            const respuestaGuardada = respuestasGuardadas[`respuesta${resp.id}`];
            if (respuestaGuardada && respuestaGuardada.toLowerCase().trim() === resp.respuesta.toLowerCase().trim()) {
                respuestasValidas++;
                console.log(`✅ Respuesta ${resp.id} correcta`);
            } else {
                console.log(`❌ Respuesta ${resp.id} incorrecta: esperaba "${respuestaGuardada}" pero recibió "${resp.respuesta}"`);
            }
        }
        
        // Necesita al menos 2 respuestas correctas para proceder
        if (respuestasValidas >= 2) {
            // Generar token temporal
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);
            
            // Crear tabla de tokens si no existe
            await pool.query(`
                CREATE TABLE IF NOT EXISTS tokens_recuperacion (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    usuario_id INT NOT NULL,
                    token VARCHAR(100) NOT NULL UNIQUE,
                    expires_at DATETIME NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    used_at DATETIME NULL,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
                )
            `);
            
            // Guardar token
            await pool.query(
                `INSERT INTO tokens_recuperacion (usuario_id, token, expires_at)
                 VALUES (?, ?, ?)`,
                [usuario_id, token, expiresAt]
            );
            
            console.log('✅ Token generado:', token);
            
            res.json({
                success: true,
                token: token,
                message: 'Respuestas correctas. Procede a cambiar tu contraseña.'
            });
        } else {
            res.status(401).json({
                success: false,
                message: `Respuestas incorrectas. Acertaste ${respuestasValidas} de ${respuestas.length} preguntas.`
            });
        }
        
    } catch (error) {
        console.error('❌ Error en verificarRespuestas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar las respuestas',
            error: error.message
        });
    }
};

// ========================================
// 3. VERIFICAR TOKEN DE RECUPERACIÓN
// ========================================
const verificarToken = async (req, res) => {
    try {
        const { token } = req.params;
        
        console.log('🔍 Verificando token:', token);
        
        const [rows] = await pool.query(
            `SELECT t.id, t.usuario_id, t.token, t.expires_at, t.used,
                    u.tutor_nombre, u.tutor_email
             FROM tokens_recuperacion t
             JOIN usuarios u ON t.usuario_id = u.id
             WHERE t.token = ? AND t.used = 0 AND t.expires_at > NOW()`,
            [token]
        );
        
        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
        
        res.json({
            success: true,
            message: 'Token válido',
            usuario_id: rows[0].usuario_id,
            nombre: rows[0].tutor_nombre
        });
        
    } catch (error) {
        console.error('❌ Error en verificarToken:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar el token'
        });
    }
};

// ========================================
// 4. RESTABLECER CONTRASEÑA (CON BCRYPT)
// ========================================
const restablecerPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;
        
        console.log('🔐 Restableciendo contraseña con token:', token);
        console.log('📝 Nueva contraseña recibida:', password ? '***' : 'vacía');
        
        if (!password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña y confirmación son requeridas'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }
        
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Las contraseñas no coinciden'
            });
        }
        
        // Verificar token
        const [tokenRows] = await pool.query(
            `SELECT t.id, t.usuario_id, t.token, t.expires_at, t.used
             FROM tokens_recuperacion t
             WHERE t.token = ? AND t.used = 0 AND t.expires_at > NOW()`,
            [token]
        );
        
        if (tokenRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
        
        const recuperacion = tokenRows[0];
        
        // Encriptar nueva contraseña con bcrypt
        const saltRounds = 10;
        const passwordEncriptada = await bcrypt.hash(password, saltRounds);
        console.log('🔐 Contraseña encriptada (primeros 30 chars):', passwordEncriptada.substring(0, 30));
        
        // Actualizar contraseña en la tabla usuarios
        const [updateResult] = await pool.query(
            `UPDATE usuarios 
             SET tutor_password = ? 
             WHERE id = ?`,
            [passwordEncriptada, recuperacion.usuario_id]
        );
        
        console.log('📊 Resultado de actualización:', updateResult);
        
        // Marcar token como usado
        await pool.query(
            `UPDATE tokens_recuperacion 
             SET used = 1, used_at = NOW() 
             WHERE id = ?`,
            [recuperacion.id]
        );
        
        console.log('✅ Contraseña restablecida para usuario ID:', recuperacion.usuario_id);
        
        res.json({
            success: true,
            message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.'
        });
        
    } catch (error) {
        console.error('❌ Error en restablecerPassword:', error);
        res.status(500).json({
            success: false,
            message: 'Error al restablecer la contraseña',
            error: error.message
        });
    }
};

module.exports = {
    iniciarRecuperacion,
    verificarRespuestas,
    verificarToken,
    restablecerPassword
};