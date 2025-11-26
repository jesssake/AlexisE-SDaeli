const db = require('../../../config/dbConfig');

// ================================
// OBTENER TRIMESTRES
// ================================
exports.obtenerTrimestres = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM trimestres ORDER BY id ASC");
    res.json(rows);
  } catch (error) {
    console.error("ERROR obtener trimestres:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ================================
// OBTENER CALIFICACIONES POR TRIMESTRE
// ================================
exports.obtenerCalificaciones = async (req, res) => {
  try {
    const trimestre = req.query.trimestre;
    if (!trimestre) return res.json([]);

    const [rows] = await db.query(`
      SELECT 
        u.id AS id_nino,
        u.nino_nombre AS alumno_nombre,
        t.id_tarea AS tarea_id,
        t.titulo AS titulo_tarea,
        e.calificacion AS calificacion,
        COALESCE(c.porcentaje, 0) AS porcentaje,
        ? AS trimestre_id
      FROM entregas_tareas e
      INNER JOIN tareas t ON t.id_tarea = e.id_tarea
      INNER JOIN usuarios u ON u.id = e.estudiante_id
      LEFT JOIN calificaciones_trimestre c 
        ON c.estudiante_id = e.estudiante_id 
        AND c.tarea_id = e.id_tarea
        AND c.trimestre_id = ?
      ORDER BY u.nino_nombre ASC, t.id_tarea ASC
    `, [trimestre, trimestre]);

    res.json(rows);

  } catch (error) {
    console.error("ERROR obtener calificaciones:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// ================================
// GUARDAR PORCENTAJES
// ================================
exports.guardarPorcentajes = async (req, res) => {
  try {
    const { trimestre_id, items } = req.body;

    if (!trimestre_id) {
      return res.json({ ok: false, mensaje: 'Trimestre inválido' });
    }

    for (const item of items) {
      await db.query(`
        INSERT INTO calificaciones_trimestre 
        (estudiante_id, tarea_id, trimestre_id, porcentaje)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE porcentaje = VALUES(porcentaje)
      `, [
        item.id_nino,
        item.tarea_id,
        trimestre_id,
        item.porcentaje
      ]);
    }

    res.json({ ok: true });

  } catch (error) {
    console.error("ERROR guardar porcentajes:", error);
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

// =============================================
// NUEVA FUNCIÓN: OBTENER CALIFICACIONES COMPLETAS
// =============================================
exports.obtenerCalificacionesCompletas = async (req, res) => {
  try {
    const { trimestre } = req.query;

    console.log('📊 Solicitando calificaciones completas, trimestre:', trimestre);

    let query = `
      SELECT 
        u.id AS estudiante_id,
        u.nino_nombre AS alumno_nombre,
        t.trimestre,
        m.nombre AS materia_nombre,
        t.titulo AS titulo_tarea,
        e.calificacion,
        e.fecha_entrega,
        p.promedio_materia,
        p.promedio_trimestre,
        p.promedio_general
      FROM usuarios u
      INNER JOIN entregas_tareas e ON u.id = e.estudiante_id
      INNER JOIN tareas t ON e.id_tarea = t.id_tarea
      LEFT JOIN materias m ON t.id_materia = m.id_materia
      LEFT JOIN promedios_calificaciones p ON 
        u.id = p.estudiante_id AND 
        t.trimestre = p.trimestre AND
        t.id_materia = p.id_materia
      WHERE e.calificacion IS NOT NULL
    `;

    const params = [];
    
    if (trimestre) {
      query += ' AND t.trimestre = ?';
      params.push(trimestre);
    }

    query += ' ORDER BY u.nino_nombre, t.trimestre, m.nombre, t.titulo';

    console.log('🔍 Ejecutando query:', query);
    console.log('📋 Parámetros:', params);

    const [rows] = await db.query(query, params);

    console.log('✅ Datos obtenidos:', rows.length, 'registros');

    // Si no hay datos, retornar array vacío
    if (rows.length === 0) {
      return res.json({ 
        ok: true, 
        datos: [],
        total_estudiantes: 0,
        mensaje: 'No hay calificaciones registradas'
      });
    }

    // Estructurar los datos
    const estudiantesMap = new Map();

    rows.forEach(row => {
      const estudianteId = row.estudiante_id;
      
      if (!estudiantesMap.has(estudianteId)) {
        estudiantesMap.set(estudianteId, {
          estudiante_id: estudianteId,
          alumno_nombre: row.alumno_nombre,
          promedio_general: row.promedio_general || 0,
          trimestres: new Map()
        });
      }

      const estudiante = estudiantesMap.get(estudianteId);
      const trimestreKey = row.trimestre;

      if (!estudiante.trimestres.has(trimestreKey)) {
        estudiante.trimestres.set(trimestreKey, {
          trimestre: row.trimestre,
          promedio_trimestre: row.promedio_trimestre || 0,
          materias: new Map()
        });
      }

      const trimestreData = estudiante.trimestres.get(trimestreKey);
      const materiaKey = row.materia_nombre || 'Sin materia';

      if (!trimestreData.materias.has(materiaKey)) {
        trimestreData.materias.set(materiaKey, {
          materia_nombre: materiaKey,
          promedio_materia: row.promedio_materia || 0,
          tareas: []
        });
      }

      const materiaData = trimestreData.materias.get(materiaKey);
      
      // Agregar tarea solo si no existe
      const tareaExiste = materiaData.tareas.some(t => 
        t.titulo_tarea === row.titulo_tarea && 
        t.calificacion === row.calificacion
      );
      
      if (!tareaExiste) {
        materiaData.tareas.push({
          titulo_tarea: row.titulo_tarea,
          calificacion: row.calificacion,
          fecha_entrega: row.fecha_entrega
        });
      }
    });

    // Convertir Map a Array
    const resultado = Array.from(estudiantesMap.values()).map(estudiante => ({
      ...estudiante,
      trimestres: Array.from(estudiante.trimestres.values()).map(trimestre => ({
        ...trimestre,
        materias: Array.from(trimestre.materias.values())
      }))
    }));

    console.log('🎯 Resultado estructurado:', resultado.length, 'estudiantes');

    res.json({ 
      ok: true, 
      datos: resultado,
      total_estudiantes: resultado.length
    });

  } catch (error) {
    console.error("❌ ERROR obtener calificaciones completas:", error);
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      detalles: 'Error al conectar con la base de datos'
    });
  }
};

// =============================================
// FUNCIÓN DE PRUEBA PARA VERIFICAR CONEXIÓN
// =============================================
exports.testConnection = async (req, res) => {
  try {
    const [result] = await db.query('SELECT 1 + 1 AS result');
    res.json({ 
      ok: true, 
      message: 'Conexión a BD exitosa',
      result: result 
    });
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      error: 'Error de conexión a BD',
      details: error.message 
    });
  }
};