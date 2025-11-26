// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\asistencia\asistenciaController.js
const pool = require('../../../config/dbConfig');

// ===============================================================
// 🔹 LISTA DE ASISTENCIA POR FECHA + HORA
// ===============================================================
exports.obtenerLista = async (req, res) => {
  try {
    const { maestro_id, fecha, hora_clase } = req.query;

    if (!maestro_id || !fecha || !hora_clase) {
      return res.status(400).json({
        ok: false,
        message: "Faltan parámetros: maestro_id, fecha, hora_clase"
      });
    }

    const [alumnos] = await pool.query(`
      SELECT 
        u.id AS estudiante_id,
        u.nino_nombre AS nombre,
        TIMESTAMPDIFF(YEAR, u.fecha_nacimiento, CURDATE()) AS edad
      FROM usuarios u
    `);

    const [marcados] = await pool.query(`
      SELECT estudiante_id, estado, comentario_maestro
      FROM asistencia
      WHERE maestro_id = ?
        AND fecha = ?
        AND hora_clase = ?
    `, [maestro_id, fecha, hora_clase]);

    let lista = alumnos.map(a => {
      const m = marcados.find(x => x.estudiante_id === a.estudiante_id);
      return {
        ...a,
        estado: m?.estado || "",
        comentario_maestro: m?.comentario_maestro || ""
      };
    });

    return res.json({
      ok: true,
      alumnos: lista,
      total: lista.length
    });

  } catch (error) {
    console.error("❌ Error obtenerLista:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno",
      error: error.message
    });
  }
};

// ===============================================================
// 🔹 GUARDAR LISTA COMPLETA
// ===============================================================
exports.guardarLista = async (req, res) => {
  try {
    const { maestro_id, fecha, hora_clase, registros } = req.body;

    if (!maestro_id || !fecha || !hora_clase || !registros) {
      return res.status(400).json({
        ok: false,
        message: "Faltan datos para guardar asistencia."
      });
    }

    await pool.query(`
      DELETE FROM asistencia
      WHERE maestro_id = ? AND fecha = ? AND hora_clase = ?
    `, [maestro_id, fecha, hora_clase]);

    for (const r of registros) {
      if (!r.estado) continue;

      await pool.query(`
        INSERT INTO asistencia 
        (estudiante_id, maestro_id, fecha, hora_clase, estado, comentario_maestro)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        r.estudiante_id,
        maestro_id,
        fecha,
        hora_clase,
        r.estado,
        r.comentario_maestro || null
      ]);
    }

    return res.json({
      ok: true,
      message: "Asistencia guardada correctamente."
    });

  } catch (error) {
    console.error("❌ Error guardarLista:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al guardar asistencia",
      error: error.message
    });
  }
};

// ===============================================================
// 🔹 HISTORIAL COMPLETO
// ===============================================================
exports.obtenerAsistencias = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, u.nino_nombre AS estudiante
      FROM asistencia a
      INNER JOIN usuarios u ON u.id = a.estudiante_id
      ORDER BY fecha DESC, hora_clase DESC
    `);

    res.json({
      success: true,
      asistencias: rows
    });

  } catch (error) {
    console.error("❌ Error obtener asistencias:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// ===============================================================
// 🔹 REGISTRAR (NO USADO PERO DISPONIBLE)
// ===============================================================
exports.registrarAsistencia = async (req, res) => {
  const { estudiante_id, maestro_id, fecha, hora_clase, estado, comentario_maestro } = req.body;

  if (!estudiante_id || !maestro_id || !fecha || !hora_clase || !estado) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos obligatorios"
    });
  }

  try {
    await pool.query(`
      INSERT INTO asistencia (estudiante_id, maestro_id, fecha, hora_clase, estado, comentario_maestro)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [estudiante_id, maestro_id, fecha, hora_clase, estado, comentario_maestro]);

    res.json({
      success: true,
      message: "Asistencia registrada correctamente"
    });

  } catch (error) {
    console.error("❌ Error registrar:", error);
    res.status(500).json({
      success: false,
      message: "Error interno"
    });
  }
};

// ===============================================================
// 🔹 ACTUALIZAR UNA ASISTENCIA
// ===============================================================
exports.actualizarAsistencia = async (req, res) => {
  const { id } = req.params;
  const { estado, comentario_maestro } = req.body;

  try {
    const [r] = await pool.query(`
      UPDATE asistencia SET estado = ?, comentario_maestro = ? WHERE id = ?
    `, [estado, comentario_maestro, id]);

    if (r.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Asistencia no encontrada"
      });
    }

    res.json({
      success: true,
      message: "Actualizado correctamente"
    });

  } catch (error) {
    console.error("❌ Error actualizar:", error);
    res.status(500).json({
      success: false,
      message: "Error interno"
    });
  }
};

// ===============================================================
// 🔹 ELIMINAR
// ===============================================================
exports.eliminarAsistencia = async (req, res) => {
  const { id } = req.params;

  try {
    const [r] = await pool.query(
      `DELETE FROM asistencia WHERE id = ?`,
      [id]
    );

    if (r.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Registro no encontrado"
      });
    }

    res.json({
      success: true,
      message: "Asistencia eliminada"
    });

  } catch (error) {
    console.error("❌ Error eliminar:", error);
    res.status(500).json({
      success: false,
      message: "Error interno"
    });
  }
};
