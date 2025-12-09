const db = require('../config/db');

class MateriasController {
  // =====================================================
  // LISTAR TODAS LAS MATERIAS
  // =====================================================
  async listarMaterias(req, res) {
    try {
      const [materias] = await db.query(`
        SELECT * FROM materias 
        ORDER BY nombre ASC
      `);
      
      res.json({
        ok: true,
        materias: materias
      });
    } catch (error) {
      console.error('Error al listar materias:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al listar materias'
      });
    }
  }

  // =====================================================
  // CREAR NUEVA MATERIA
  // =====================================================
  async crearMateria(req, res) {
    try {
      const { nombre, descripcion, color, icono } = req.body;
      
      if (!nombre) {
        return res.status(400).json({
          ok: false,
          error: 'El nombre de la materia es obligatorio'
        });
      }
      
      // Verificar si ya existe una materia con el mismo nombre
      const [materiaExistente] = await db.query(
        'SELECT id_materia FROM materias WHERE nombre = ?',
        [nombre]
      );
      
      if (materiaExistente.length > 0) {
        return res.status(400).json({
          ok: false,
          error: 'Ya existe una materia con ese nombre'
        });
      }
      
      // Color por defecto si no se especifica
      const colorFinal = color || this.generarColorAleatorio();
      
      const [result] = await db.query(
        `INSERT INTO materias (nombre, descripcion, color, icono) 
         VALUES (?, ?, ?, ?)`,
        [nombre, descripcion || '', colorFinal, icono || '📚']
      );
      
      res.json({
        ok: true,
        message: 'Materia creada exitosamente',
        id_materia: result.insertId
      });
    } catch (error) {
      console.error('Error al crear materia:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al crear materia'
      });
    }
  }

  // =====================================================
  // ACTUALIZAR MATERIA
  // =====================================================
  async actualizarMateria(req, res) {
    try {
      const { id_materia, nombre, descripcion, color, icono } = req.body;
      
      if (!id_materia) {
        return res.status(400).json({
          ok: false,
          error: 'ID de materia es requerido'
        });
      }
      
      // Verificar si la materia existe
      const [materiaExistente] = await db.query(
        'SELECT * FROM materias WHERE id_materia = ?',
        [id_materia]
      );
      
      if (!materiaExistente.length) {
        return res.status(404).json({
          ok: false,
          error: 'Materia no encontrada'
        });
      }
      
      // Verificar si el nuevo nombre ya existe (excluyendo la actual)
      if (nombre && nombre !== materiaExistente[0].nombre) {
        const [materiaConNombre] = await db.query(
          'SELECT id_materia FROM materias WHERE nombre = ? AND id_materia != ?',
          [nombre, id_materia]
        );
        
        if (materiaConNombre.length > 0) {
          return res.status(400).json({
            ok: false,
            error: 'Ya existe otra materia con ese nombre'
          });
        }
      }
      
      // Actualizar materia
      await db.query(
        `UPDATE materias SET
          nombre = ?,
          descripcion = ?,
          color = ?,
          icono = ?
        WHERE id_materia = ?`,
        [
          nombre || materiaExistente[0].nombre,
          descripcion || materiaExistente[0].descripcion,
          color || materiaExistente[0].color,
          icono || materiaExistente[0].icono,
          id_materia
        ]
      );
      
      res.json({
        ok: true,
        message: 'Materia actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error al actualizar materia:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al actualizar materia'
      });
    }
  }

  // =====================================================
  // ELIMINAR MATERIA
  // =====================================================
  async eliminarMateria(req, res) {
    try {
      const { id_materia } = req.body;
      
      if (!id_materia) {
        return res.status(400).json({
          ok: false,
          error: 'ID de materia es requerido'
        });
      }
      
      // Verificar si la materia existe
      const [materia] = await db.query(
        'SELECT * FROM materias WHERE id_materia = ?',
        [id_materia]
      );
      
      if (!materia.length) {
        return res.status(404).json({
          ok: false,
          error: 'Materia no encontrada'
        });
      }
      
      // Verificar si hay tareas asignadas a esta materia
      const [tareas] = await db.query(
        'SELECT id_tarea FROM tareas WHERE id_materia = ?',
        [id_materia]
      );
      
      if (tareas.length > 0) {
        return res.status(400).json({
          ok: false,
          error: 'No se puede eliminar la materia porque tiene tareas asignadas'
        });
      }
      
      // Eliminar materia
      await db.query('DELETE FROM materias WHERE id_materia = ?', [id_materia]);
      
      res.json({
        ok: true,
        message: 'Materia eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar materia:', error);
      res.status(500).json({
        ok: false,
        error: 'Error al eliminar materia'
      });
    }
  }

  // =====================================================
  // GENERAR COLOR ALEATORIO PARA MATERIAS
  // =====================================================
  generarColorAleatorio() {
    const colores = [
      '#667eea', // Índigo
      '#48bb78', // Verde
      '#ed8936', // Naranja
      '#f56565', // Rojo
      '#9f7aea', // Púrpura
      '#4299e1', // Azul
      '#38a169', // Verde esmeralda
      '#d53f8c', // Rosa
      '#3182ce', // Azul claro
      '#805ad5'  // Violeta
    ];
    
    return colores[Math.floor(Math.random() * colores.length)];
  }
}

module.exports = new MateriasController();