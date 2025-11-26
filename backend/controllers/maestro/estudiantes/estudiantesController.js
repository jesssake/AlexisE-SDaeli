// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\estudiantes\estudiantesController.js
const pool = require('../../../config/dbConfig');

// =====================================
// 🔹 GET /api/maestro/estudiantes
// =====================================
exports.obtenerEstudiantes = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        nino_nombre AS nombre,
        tutor_nombre,
        tutor_email AS correo_tutor,
        tutor_telefono,
        nino_condiciones AS condiciones_medicas,
        fecha_nacimiento,
        fecha_registro AS creado_en
      FROM usuarios
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      alumnos: rows
    });

  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor"
    });
  }
};

// =====================================
// 🔹 POST → Crear estudiante
// =====================================
exports.crearEstudiante = async (req, res) => {
  try {
    const {
      nino_nombre,
      fecha_nacimiento,
      nino_condiciones,
      tutor_nombre,
      tutor_email,
      tutor_telefono,
      tutor_password
    } = req.body;

    const [result] = await pool.query(`
      INSERT INTO usuarios 
      (tutor_nombre, tutor_email, tutor_telefono, tutor_password, 
       nino_nombre, nino_condiciones, fecha_nacimiento)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      tutor_nombre,
      tutor_email,
      tutor_telefono,
      tutor_password,
      nino_nombre,
      nino_condiciones,
      fecha_nacimiento
    ]);

    res.json({
      success: true,
      id: result.insertId,
      message: "Estudiante creado correctamente"
    });

  } catch (error) {
    console.error("Error al crear estudiante:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear estudiante"
    });
  }
};

// =====================================
// 🔹 PUT → Editar estudiante
// =====================================
exports.actualizarEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nino_nombre,
      fecha_nacimiento,
      nino_condiciones,
      tutor_nombre,
      tutor_telefono
    } = req.body;

    const [result] = await pool.query(`
      UPDATE usuarios
      SET 
        nino_nombre = ?, 
        fecha_nacimiento = ?, 
        nino_condiciones = ?, 
        tutor_nombre = ?, 
        tutor_telefono = ?
      WHERE id = ?
    `, [
      nino_nombre,
      fecha_nacimiento,
      nino_condiciones,
      tutor_nombre,
      tutor_telefono,
      id
    ]);

    res.json({
      success: true,
      message: "Estudiante actualizado correctamente"
    });

  } catch (error) {
    console.error("Error al actualizar estudiante:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar estudiante"
    });
  }
};

// =====================================
// 🔹 DELETE → Eliminar estudiante
// =====================================
exports.eliminarEstudiante = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      DELETE FROM usuarios WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: "Estudiante eliminado correctamente"
    });

  } catch (error) {
    console.error("Error al eliminar estudiante:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar estudiante"
    });
  }
};
