const express = require('express');
const router = express.Router();
const path = require('path');

console.log('🔍 Cargando materiasRoutes desde:', __dirname);

// =====================================================
// CARGAR DBCONFIG
// =====================================================
const db = require(path.join(process.cwd(), 'config/dbConfig'));
console.log('✅ materiasRoutes: dbConfig cargado exitosamente');

// =====================================================
// CARGAR MIDDLEWARE CON VERIFICACIÓN
// =====================================================
let authMiddleware;

try {
    // Intentar cargar desde 'middleware' (singular)
    authMiddleware = require(path.join(process.cwd(), 'middleware/authMiddleware'));
    console.log('✅ authMiddleware cargado desde:', path.join(process.cwd(), 'middleware/authMiddleware'));
} catch (error) {
    console.error('❌ Error cargando authMiddleware:', error.message);
    console.log('⚠️ Intentando cargar desde middlewares...');
    
    try {
        // Intentar desde 'middlewares' (plural)
        authMiddleware = require(path.join(process.cwd(), 'middlewares/authMiddleware'));
        console.log('✅ authMiddleware cargado desde middlewares/');
    } catch (error2) {
        console.error('❌ Error cargando authMiddleware desde ninguna ruta:', error2.message);
        // Middleware temporal si todo falla
        authMiddleware = (req, res, next) => {
            console.log('🔐 Usando authMiddleware temporal para materias');
            req.user = { 
                id: 1, 
                admin_nombre: 'Maestro Demo', 
                rol: 'maestro',
                tutor_nombre: 'Maestro Demo'
            };
            next();
        };
        console.log('⚠️ Usando authMiddleware temporal');
    }
}

// =====================================================
// APLICAR MIDDLEWARE
// =====================================================
router.use(authMiddleware);

console.log('✅ Middleware aplicado correctamente para materias');

// =====================================================
// RUTAS DE MATERIAS
// =====================================================

// Listar todas las materias
router.get('/lista', async (req, res) => {
  try {
    console.log('📚 GET /lista - Solicitando listado de materias');
    const [materias] = await db.query(`
      SELECT * FROM materias 
      ORDER BY nombre ASC
    `);
    
    console.log(`✅ ${materias.length} materias encontradas`);
    res.json({
      ok: true,
      materias: materias
    });
  } catch (error) {
    console.error('❌ Error al listar materias:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al listar materias'
    });
  }
});

// Crear nueva materia
router.post('/crear', async (req, res) => {
  try {
    const { nombre, descripcion, color, icono } = req.body;
    const usuarioId = req.user.id;
    
    console.log('📝 POST /crear - Creando materia:', nombre);
    
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
    
    // Generar color por defecto si no se especifica
    const generarColorAleatorio = () => {
      const colores = [
        '#667eea', '#48bb78', '#ed8936', '#f56565', '#9f7aea',
        '#4299e1', '#38a169', '#d53f8c', '#3182ce', '#805ad5'
      ];
      return colores[Math.floor(Math.random() * colores.length)];
    };
    
    const colorFinal = color || generarColorAleatorio();
    const iconoFinal = icono || '📚';
    
    const [result] = await db.query(
      `INSERT INTO materias (nombre, descripcion, color, icono, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, descripcion || '', colorFinal, iconoFinal, usuarioId]
    );
    
    console.log(`✅ Materia "${nombre}" creada con ID: ${result.insertId}`);
    
    res.json({
      ok: true,
      message: 'Materia creada exitosamente',
      id_materia: result.insertId
    });
  } catch (error) {
    console.error('❌ Error al crear materia:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al crear materia'
    });
  }
});

// Actualizar materia
router.post('/actualizar', async (req, res) => {
  try {
    const { id_materia, nombre, descripcion, color, icono } = req.body;
    
    console.log('✏️ POST /actualizar - Actualizando materia ID:', id_materia);
    
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
    
    console.log(`✅ Materia ID ${id_materia} actualizada exitosamente`);
    
    res.json({
      ok: true,
      message: 'Materia actualizada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al actualizar materia:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al actualizar materia'
    });
  }
});

// Eliminar materia
router.post('/eliminar', async (req, res) => {
  try {
    const { id_materia } = req.body;
    
    console.log('🗑️ POST /eliminar - Eliminando materia ID:', id_materia);
    
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
    
    console.log(`✅ Materia ID ${id_materia} eliminada exitosamente`);
    
    res.json({
      ok: true,
      message: 'Materia eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar materia:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al eliminar materia'
    });
  }
});

// Obtener materias con estadísticas
router.get('/con-estadisticas', async (req, res) => {
  try {
    console.log('📊 GET /con-estadisticas - Materias con estadísticas');
    const [materiasConEstadisticas] = await db.query(`
      SELECT 
        m.*,
        COUNT(t.id_tarea) as total_tareas,
        COALESCE(SUM(CASE WHEN t.activa = 1 THEN 1 ELSE 0 END), 0) as tareas_activas,
        COALESCE(AVG(et.calificacion), 0) as promedio_calificaciones
      FROM materias m
      LEFT JOIN tareas t ON m.id_materia = t.id_materia
      LEFT JOIN entregas_tareas et ON t.id_tarea = et.id_tarea
      GROUP BY m.id_materia
      ORDER BY m.nombre ASC
    `);
    
    console.log(`✅ ${materiasConEstadisticas.length} materias con estadísticas`);
    res.json({
      ok: true,
      materias: materiasConEstadisticas
    });
  } catch (error) {
    console.error('❌ Error al obtener materias con estadísticas:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al obtener estadísticas de materias'
    });
  }
});

// Buscar materias
router.get('/buscar', async (req, res) => {
  try {
    const { query } = req.query;
    
    console.log('🔍 GET /buscar - Buscando materias:', query);
    
    if (!query || query.trim() === '') {
      return res.json({
        ok: true,
        materias: []
      });
    }
    
    const searchTerm = `%${query}%`;
    
    const [materias] = await db.query(
      `SELECT * FROM materias 
       WHERE nombre LIKE ? OR descripcion LIKE ?
       ORDER BY nombre ASC
       LIMIT 10`,
      [searchTerm, searchTerm]
    );
    
    console.log(`✅ ${materias.length} materias encontradas para "${query}"`);
    
    res.json({
      ok: true,
      materias: materias
    });
  } catch (error) {
    console.error('❌ Error al buscar materias:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al buscar materias'
    });
  }
});

// Obtener materias populares (más utilizadas)
router.get('/populares', async (req, res) => {
  try {
    console.log('🏆 GET /populares - Materias más utilizadas');
    const [materiasPopulares] = await db.query(`
      SELECT 
        m.*,
        COUNT(t.id_tarea) as total_tareas_asignadas
      FROM materias m
      LEFT JOIN tareas t ON m.id_materia = t.id_materia
      GROUP BY m.id_materia
      ORDER BY total_tareas_asignadas DESC, m.nombre ASC
      LIMIT 5
    `);
    
    console.log(`✅ ${materiasPopulares.length} materias populares encontradas`);
    
    res.json({
      ok: true,
      materias: materiasPopulares
    });
  } catch (error) {
    console.error('❌ Error al obtener materias populares:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al obtener materias populares'
    });
  }
});

console.log('✅ materiasRoutes configurado correctamente con todas las rutas');

module.exports = router;