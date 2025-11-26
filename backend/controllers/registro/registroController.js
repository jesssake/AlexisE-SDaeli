// controllers/registro/registroController.js
const pool = require('../../config/dbConfig');

// POST /api/registro/completo
exports.registroCompleto = async (req, res) => {
  let connection;

  try {
    const {
      tutor_nombre,
      tutor_email,
      tutor_telefono,
      tutor_password,
      nino_nombre,
      nino_condiciones,
      fecha_nacimiento,
      security_questions
    } = req.body;

    console.log('📥 Datos recibidos en registro:', req.body);

    // 🔎 Validaciones básicas según tu BD
    if (!tutor_nombre || !tutor_email || !tutor_password || !nino_nombre || !fecha_nacimiento) {
      return res.status(400).json({
        success: false,
        message:
          'Faltan campos obligatorios: tutor_nombre, tutor_email, tutor_password, nino_nombre y fecha_nacimiento'
      });
    }

    connection = await pool.getConnection();

    // 📌 Verificar si el email ya existe
    const [existingUsers] = await connection.execute(
      'SELECT id FROM usuarios WHERE tutor_email = ?',
      [tutor_email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // ✅ Iniciar transacción
    await connection.beginTransaction();

    // 1️⃣ Insertar en tabla usuarios
    const [usuarioResult] = await connection.execute(
      `INSERT INTO usuarios (
        tutor_nombre,
        tutor_email,
        tutor_telefono,
        tutor_password,
        nino_nombre,
        nino_condiciones,
        fecha_nacimiento
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tutor_nombre.trim(),
        tutor_email.trim(),
        tutor_telefono ? tutor_telefono.trim() : null,
        tutor_password, // (texto plano por ahora)
        nino_nombre.trim(),
        nino_condiciones ? nino_condiciones.trim() : null,
        fecha_nacimiento
      ]
    );

    const usuarioId = usuarioResult.insertId;

    // 2️⃣ Insertar preguntas de seguridad en recuperar_contrasena
    if (Array.isArray(security_questions) && security_questions.length >= 5) {
      const respuestas = security_questions.map((r) => (r || '').trim());

      await connection.execute(
        `INSERT INTO recuperar_contrasena (
          usuario_id,
          pregunta1, respuesta1,
          pregunta2, respuesta2,
          pregunta3, respuesta3,
          pregunta4, respuesta4,
          pregunta5, respuesta5
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          usuarioId,
          '¿Nombre de tu primera mascota?', respuestas[0] || '',
          '¿Color favorito?',              respuestas[1] || '',
          '¿Ciudad favorita?',             respuestas[2] || '',
          '¿Deporte favorito?',            respuestas[3] || '',
          '¿Comida favorita?',             respuestas[4] || ''
        ]
      );
    }

    // ✅ Confirmar transacción
    await connection.commit();

    console.log('✅ Registro completado. usuario_id =', usuarioId);

    return res.json({
      success: true,
      message: 'Registro completado exitosamente',
      usuario_id: usuarioId
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error en registroCompleto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor: ' + error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// GET /api/registro/validar-email/:email
exports.validarEmail = async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email || '');

    if (!email) {
      return res.status(400).json({
        disponible: false,
        message: 'Email no proporcionado'
      });
    }

    const [results] = await pool.execute(
      'SELECT id FROM usuarios WHERE tutor_email = ?',
      [email]
    );

    const disponible = results.length === 0;

    return res.json({
      disponible,
      message: disponible ? 'Email disponible' : 'Email ya registrado'
    });

  } catch (error) {
    console.error('❌ Error validando email:', error);
    return res.status(500).json({
      disponible: false,
      message: 'Error al validar email: ' + error.message
    });
  }
};
