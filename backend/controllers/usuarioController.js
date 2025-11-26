// C:\Codigos\HTml\gestion-educativa\backend\controllers\usuarioController.js
const pool = require('../config/dbConfig');

// =============================================================
// 👤 OBTENER TODOS LOS USUARIOS
// GET /api/usuarios
// =============================================================
exports.getUsuarios = async (req, res) => {
  try {
    const [usuarios] = await pool.execute(
      `SELECT 
        id, 
        tutor_nombre, 
        tutor_email, 
        tutor_telefono,
        nino_nombre, 
        nino_condiciones, 
        fecha_nacimiento,
        fecha_registro
       FROM usuarios
       ORDER BY fecha_registro DESC`
    );

    res.json({
      success: true,
      usuarios,
      total: usuarios.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios'
    });
  }
};

// =============================================================
// 👤 OBTENER UN USUARIO POR ID
// GET /api/usuarios/:id
// =============================================================
exports.getUsuarioById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT 
        id, 
        tutor_nombre, 
        tutor_email, 
        tutor_telefono,
        nino_nombre, 
        nino_condiciones, 
        fecha_nacimiento,
        fecha_registro
       FROM usuarios
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      usuario: rows[0]
    });
  } catch (error) {
    console.error('❌ Error obteniendo usuario por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuario'
    });
  }
};

// =============================================================
// 👤 REGISTRAR USUARIO (opcional, por si lo usas luego)
// POST /api/usuarios/registrar
// =============================================================
exports.registrarUsuario = async (req, res) => {
  const { 
    tutor_nombre, 
    tutor_email, 
    tutor_telefono, 
    tutor_password, 
    nino_nombre, 
    nino_condiciones, 
    fecha_nacimiento 
  } = req.body;

  if (!tutor_nombre || !tutor_email || !tutor_password || !nino_nombre || !fecha_nacimiento) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos obligatorios'
    });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO usuarios (
        tutor_nombre, tutor_email, tutor_telefono, tutor_password,
        nino_nombre, nino_condiciones, fecha_nacimiento
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tutor_nombre,
        tutor_email,
        tutor_telefono || null,
        tutor_password,
        nino_nombre,
        nino_condiciones || null,
        fecha_nacimiento
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      usuario_id: result.insertId
    });

  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el usuario'
    });
  }
};
