// =======================================================================
// CONTROLADOR DE TAREAS DEL MAESTRO (COMPLETAMENTE CORREGIDO)
// RUTA: backend/controllers/maestro/tareas/tareasController.js
// =======================================================================

const db = require('../../../config/dbConfig');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ======================================================
// FUNCIÓN PARA NORMALIZAR FECHA ISO → DATETIME MYSQL
// ======================================================
function normalizarFecha(fecha) {
  if (!fecha) return null;
  return fecha.slice(0, 19).replace('T', ' ');
}

// ======================================================
// CONFIGURACIÓN DE MULTER
// ======================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const carpeta = path.join(__dirname, '../../../uploads/tareas');
    if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true });
    cb(null, carpeta);
  },
  filename: (req, file, cb) => {
    const nombre = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, nombre);
  }
});

const upload = multer({ storage });

// ======================================================
// LISTAR TAREAS (CORREGIDO - ALIAS FIXED)
// ======================================================
exports.listarTareas = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.*, 
        m.nombre AS nombre_materia,  -- CORREGIDO: materia_nombre → nombre_materia
        (SELECT COUNT(*) FROM entregas_tareas e WHERE e.id_tarea = t.id_tarea) AS total_entregas
      FROM tareas t
      LEFT JOIN materias m ON m.id_materia = t.id_materia
      ORDER BY t.id_tarea DESC
    `);

    console.log('=== DEBUG TAREAS CON MATERIAS ===');
    rows.forEach((tarea, index) => {
      console.log(`Tarea ${index + 1}:`, {
        id: tarea.id_tarea,
        titulo: tarea.titulo,
        id_materia: tarea.id_materia,
        nombre_materia: tarea.nombre_materia,
        trimestre: tarea.trimestre
      });
    });
    console.log('=== FIN DEBUG ===');

    res.json({ ok: true, tareas: rows });

  } catch (error) {
    console.error("ERROR listar tareas:", error);
    res.json({ ok: false, error: error.message });
  }
};

// ======================================================
// CREAR TAREA (CORREGIDO - TRIMESTRE Y MATERIA AÑADIDOS)
// ======================================================
exports.crearTarea = [
  upload.single('archivo_adjunto'),

  async (req, res) => {
    try {
      const {
        titulo,
        instrucciones,
        fecha_cierre,
        permitir_entrega_tarde,
        activa,
        rubrica,
        created_by,
        id_materia,
        trimestre
      } = req.body;

      console.log('Datos recibidos crear tarea:', { 
        titulo, id_materia, trimestre 
      });

      const archivo = req.file ? `/uploads/tareas/${req.file.filename}` : null;
      const fechaCierreSQL = normalizarFecha(fecha_cierre);

      const [result] = await db.query(`
        INSERT INTO tareas 
          (titulo, id_materia, trimestre, instrucciones, fecha_cierre, permitir_entrega_tarde, activa, rubrica, archivo_adjunto, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        titulo,
        id_materia || null,
        trimestre || '1',
        instrucciones,
        fechaCierreSQL,
        permitir_entrega_tarde,
        activa,
        rubrica,
        archivo,
        created_by
      ]);

      console.log('Tarea creada ID:', result.insertId);
      res.json({ ok: true, id_tarea: result.insertId });

    } catch (error) {
      console.error("ERROR crear tarea:", error);
      res.json({ ok: false, error: error.message });
    }
  }
];

// ======================================================
// ACTUALIZAR TAREA (CORREGIDO - TRIMESTRE Y MATERIA AÑADIDOS)
// ======================================================
exports.actualizarTarea = [
  upload.single('archivo_adjunto'),

  async (req, res) => {
    try {
      const {
        id_tarea,
        titulo,
        instrucciones,
        fecha_cierre,
        permitir_entrega_tarde,
        activa,
        rubrica,
        id_materia,
        trimestre
      } = req.body;

      console.log('Datos recibidos actualizar tarea:', { 
        id_tarea, id_materia, trimestre 
      });

      const fechaCierreSQL = normalizarFecha(fecha_cierre);
      let archivo = null;

      if (req.file) {
        archivo = `/uploads/tareas/${req.file.filename}`;

        const [old] = await db.query(
          "SELECT archivo_adjunto FROM tareas WHERE id_tarea = ?",
          [id_tarea]
        );

        if (old[0]?.archivo_adjunto) {
          const rutaVieja = path.join(__dirname, '../../../', old[0].archivo_adjunto);
          if (fs.existsSync(rutaVieja)) fs.unlinkSync(rutaVieja);
        }
      }

      await db.query(`
        UPDATE tareas SET 
          titulo = ?, 
          id_materia = ?,
          trimestre = ?,
          instrucciones = ?, 
          fecha_cierre = ?, 
          permitir_entrega_tarde = ?,
          activa = ?, 
          rubrica = ?,
          archivo_adjunto = IFNULL(?, archivo_adjunto)
        WHERE id_tarea = ?
      `, [
        titulo,
        id_materia || null,
        trimestre || '1',
        instrucciones,
        fechaCierreSQL,
        permitir_entrega_tarde,
        activa,
        rubrica,
        archivo,
        id_tarea
      ]);

      console.log('Tarea actualizada ID:', id_tarea);
      res.json({ ok: true });

    } catch (error) {
      console.error("ERROR actualizar tarea:", error);
      res.json({ ok: false, error: error.message });
    }
  }
];

// ======================================================
// ELIMINAR ARCHIVO ADJUNTO
// ======================================================
exports.eliminarArchivo = async (req, res) => {
  try {
    const { id_tarea } = req.body;

    const [rows] = await db.query(`
      SELECT archivo_adjunto FROM tareas WHERE id_tarea = ?
    `, [id_tarea]);

    if (!rows.length)
      return res.json({ ok: false, error: "Tarea no encontrada" });

    const archivo = rows[0].archivo_adjunto;

    if (archivo) {
      const ruta = path.join(__dirname, '../../../', archivo);
      if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
    }

    await db.query(`
      UPDATE tareas SET archivo_adjunto = NULL WHERE id_tarea = ?
    `, [id_tarea]);

    res.json({ ok: true });

  } catch (error) {
    console.error("ERROR eliminar archivo:", error);
    res.json({ ok: false, error: error.message });
  }
};

// ======================================================
// ELIMINAR TAREA Y SUS ENTREGAS
// ======================================================
exports.eliminarTarea = async (req, res) => {
  try {
    const { id_tarea } = req.body;

    await db.query(`DELETE FROM entregas_tareas WHERE id_tarea = ?`, [id_tarea]);
    await db.query(`DELETE FROM tareas WHERE id_tarea = ?`, [id_tarea]);

    res.json({ ok: true });

  } catch (error) {
    console.error("ERROR eliminar tarea:", error);
    res.json({ ok: false, error: error.message });
  }
};

// ======================================================
// OBTENER ENTREGAS DE UNA TAREA
// ======================================================
exports.obtenerEntregas = async (req, res) => {
  try {
    const { id_tarea } = req.query;

    const [rows] = await db.query(`
      SELECT 
        e.*,
        u.nino_nombre AS nombre_alumno,
        u.tutor_nombre AS nombre_tutor
      FROM entregas_tareas e
      LEFT JOIN usuarios u ON u.id = e.estudiante_id
      WHERE e.id_tarea = ?
    `, [id_tarea]);

    res.json({ ok: true, entregas: rows });

  } catch (error) {
    console.error("ERROR obtener entregas:", error);
    res.json({ ok: false, error: error.message });
  }
};

// ======================================================
// CALIFICAR ENTREGA
// ======================================================
exports.calificarEntrega = async (req, res) => {
  try {
    const { id_entrega, calificacion, comentario_docente } = req.body;

    await db.query(`
      UPDATE entregas_tareas 
      SET calificacion = ?, comentario_docente = ?, estado = 'REVISADO'
      WHERE id_entrega = ?
    `, [calificacion, comentario_docente, id_entrega]);

    res.json({ ok: true });

  } catch (error) {
    console.error("ERROR calificar entrega:", error);
    res.json({ ok: false, error: error.message });
  }
};