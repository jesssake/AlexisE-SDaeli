// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\materias\materiasController.js

// OJO: estamos usando el pool de mysql2/promise
const db = require('../../../config/dbConfig');

module.exports = {

  // ========================
  // LISTAR MATERIAS
  // ========================
  listarMaterias: async (req, res) => {
    const sql = `
      SELECT id_materia, nombre, descripcion, created_by
      FROM materias
      ORDER BY id_materia DESC
    `;

    try {
      const [rows] = await db.query(sql);
      res.json({ ok: true, materias: rows });
    } catch (err) {
      console.error('Error al obtener materias:', err);
      res.json({ ok: false, error: 'Error al obtener materias' });
    }
  },

  // ========================
  // CREAR MATERIA
  // ========================
  crearMateria: async (req, res) => {
    const { nombre, descripcion, created_by } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.json({ ok: false, error: 'El nombre de la materia es obligatorio.' });
    }

    const sql = `
      INSERT INTO materias (nombre, descripcion, created_by)
      VALUES (?, ?, ?)
    `;

    try {
      const [result] = await db.query(sql, [
        nombre,
        descripcion || null,
        created_by || 1
      ]);

      res.json({
        ok: true,
        mensaje: 'Materia creada',
        id_materia: result.insertId
      });
    } catch (err) {
      console.error('Error al crear la materia:', err);
      res.json({ ok: false, error: 'Error al crear la materia' });
    }
  },

  // ========================
  // ACTUALIZAR MATERIA
  // ========================
  actualizarMateria: async (req, res) => {
    const { id_materia, nombre, descripcion } = req.body;

    if (!id_materia) {
      return res.json({ ok: false, error: 'ID de materia requerido.' });
    }

    const sql = `
      UPDATE materias
      SET nombre = ?, descripcion = ?
      WHERE id_materia = ?
    `;

    try {
      await db.query(sql, [nombre, descripcion || null, id_materia]);
      res.json({ ok: true, mensaje: 'Materia actualizada' });
    } catch (err) {
      console.error('Error al actualizar la materia:', err);
      res.json({ ok: false, error: 'Error al actualizar la materia' });
    }
  },

  // ========================
  // ELIMINAR MATERIA
  // ========================
  eliminarMateria: async (req, res) => {
    const { id_materia } = req.body;

    if (!id_materia) {
      return res.json({ ok: false, error: 'ID de materia requerido.' });
    }

    const sql = `DELETE FROM materias WHERE id_materia = ?`;

    try {
      await db.query(sql, [id_materia]);
      res.json({ ok: true, mensaje: 'Materia eliminada' });
    } catch (err) {
      console.error('Error al eliminar la materia:', err);
      res.json({
        ok: false,
        error:
          'No se puede eliminar. Esta materia podría estar asignada a tareas. Primero elimina o cambia esas tareas.'
      });
    }
  }
};
