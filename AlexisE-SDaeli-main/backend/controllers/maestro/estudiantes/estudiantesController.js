const pool = require('../../../config/dbConfig');

// =============================
// GET - Todos los estudiantes
// =============================
const getEstudiantes = async (req, res) => {
  try {
    console.log('🔍 Ejecutando consulta de estudiantes...');
    
    const [rows] = await pool.query(`
      SELECT 
        id,
        nino_nombre AS nombre,
        fecha_nacimiento,
        nino_condiciones AS condiciones_medicas,
        TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) AS edad,
        tutor_nombre,
        tutor_email,
        tutor_telefono
      FROM usuarios
      WHERE nino_nombre IS NOT NULL 
        AND nino_nombre != ''
        AND nino_nombre != 'null'
      ORDER BY id ASC
    `);

    console.log(`✅ Estudiantes encontrados: ${rows.length}`);
    
    // ✅ SOLO UNA RESPUESTA - Array directamente como espera el frontend
    res.json(rows);
    
  } catch (error) {
    console.error('❌ Error en getEstudiantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar estudiantes',
      error: error.message
    });
  }
};

// =============================
// POST - Crear estudiante (tutor + niño)
// =============================
const crearEstudiante = async (req, res) => {
  try {
    console.log('📝 Creando nuevo estudiante:', req.body);
    
    // ✅ Mapear nombres del frontend al backend
    const {
      nombre: nino_nombre,
      fecha_nacimiento,
      condiciones_medicas: nino_condiciones,
      tutor_nombre,
      tutor_email,
      tutor_telefono,
      tutor_password
    } = req.body;

    // ✅ Validar campos requeridos
    if (!nino_nombre || !fecha_nacimiento || !tutor_nombre || !tutor_email || !tutor_telefono || !tutor_password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
        campos_recibidos: req.body
      });
    }

    const [result] = await pool.query(
      `INSERT INTO usuarios 
        (tutor_nombre, tutor_email, tutor_telefono, tutor_password, 
         nino_nombre, nino_condiciones, fecha_nacimiento, rol, fecha_registro) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'tutor', NOW())`,
      [tutor_nombre, tutor_email, tutor_telefono, tutor_password, 
       nino_nombre, nino_condiciones, fecha_nacimiento]
    );

    console.log(`✅ Estudiante creado con ID: ${result.insertId}`);
    
    res.json({
      success: true,
      message: 'Estudiante y tutor creados correctamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('❌ Error en crearEstudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear estudiante',
      error: error.message,
      sqlMessage: error.sqlMessage
    });
  }
};

// =============================
// PUT - Actualizar estudiante - CORREGIDO
// =============================
const actualizarEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📝 Actualizando estudiante ID:', id);
    console.log('📦 Datos recibidos:', req.body);

    // ✅ Mapear nombres CORRECTAMENTE - usar los nombres del frontend directamente
    const {
      nombre,                    // nombre del niño (viene del frontend)
      fecha_nacimiento,
      condiciones_medicas,       // condiciones_medicas (viene del frontend)  
      tutor_nombre,
      tutor_email,
      tutor_telefono
    } = req.body;

    // ✅ Validar que existan los datos requeridos
    if (!nombre || !fecha_nacimiento || !tutor_nombre || !tutor_email || !tutor_telefono) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
        campos_recibidos: req.body,
        campos_requeridos: ['nombre', 'fecha_nacimiento', 'tutor_nombre', 'tutor_email', 'tutor_telefono']
      });
    }

    console.log('🔧 Ejecutando UPDATE con:', {
      nino_nombre: nombre,
      fecha_nacimiento,
      nino_condiciones: condiciones_medicas,
      tutor_nombre,
      tutor_email,
      tutor_telefono,
      id
    });

    // ✅ Consulta SQL CORREGIDA - Usar los nombres de la base de datos
    const [result] = await pool.query(
      `UPDATE usuarios SET 
         nino_nombre = ?, 
         fecha_nacimiento = ?, 
         nino_condiciones = ?, 
         tutor_nombre = ?, 
         tutor_email = ?, 
         tutor_telefono = ?,
         fecha_registro = NOW() 
       WHERE id = ?`,
      [nombre, fecha_nacimiento, condiciones_medicas, tutor_nombre, tutor_email, tutor_telefono, id]
    );

    console.log('✅ Resultado del UPDATE:', {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estudiante actualizado correctamente',
      affectedRows: result.affectedRows
    });

  } catch (error) {
    console.error('❌ Error en actualizarEstudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estudiante',
      error: error.message,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
  }
};

// =============================
// DELETE - Eliminar estudiante
// =============================
const eliminarEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando estudiante ID: ${id}`);

    const [result] = await pool.query(
      "DELETE FROM usuarios WHERE id = ?",
      [id]
    );

    console.log(`✅ Estudiante eliminado. Filas afectadas: ${result.affectedRows}`);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Estudiante eliminado correctamente',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('❌ Error en eliminarEstudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar estudiante',
      error: error.message,
      sqlMessage: error.sqlMessage
    });
  }
};

module.exports = {
  getEstudiantes,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante
};