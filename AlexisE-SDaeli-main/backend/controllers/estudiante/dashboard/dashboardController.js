// backend/controllers/estudiante/dashboard/dashboardController.js

const db = require('../../../config/dbConfig');

// ================= GET TODOS LOS AVISOS (PARA ADMIN) =================
exports.getTodosAvisos = async (req, res) => {
  try {
    const [avisos] = await db.execute(
      'SELECT *, DATE_FORMAT(fecha_creacion, "%d/%m/%Y %H:%i") as fecha_formateada FROM avisos ORDER BY fecha_creacion DESC'
    );
    res.json({ success: true, avisos });
  } catch (error) {
    console.error('Error obteniendo todos los avisos:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET AVISOS ACTIVOS (PARA ESTUDIANTES) =================
exports.getAvisosActivos = async (req, res) => {
  try {
    const [avisos] = await db.execute(
      'SELECT *, DATE_FORMAT(fecha_creacion, "%d/%m/%Y %H:%i") as fecha_formateada FROM avisos WHERE activo = 1 ORDER BY fecha_creacion DESC'
    );
    
    if (avisos.length === 0) {
      return res.json({ 
        success: true, 
        avisos: [], 
        mensaje: 'No hay avisos activos publicados' 
      });
    }
    
    res.json({ success: true, avisos });
  } catch (error) {
    console.error('Error obteniendo avisos activos:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET ESTADÍSTICAS AVISOS ACTIVOS =================
exports.getEstadisticasAvisosActivos = async (req, res) => {
  try {
    // Obtener conteos por prioridad de avisos ACTIVOS
    const [totalResult] = await db.execute('SELECT COUNT(*) as total FROM avisos WHERE activo = 1');
    const [altosResult] = await db.execute('SELECT COUNT(*) as altos FROM avisos WHERE prioridad = "alta" AND activo = 1');
    const [mediosResult] = await db.execute('SELECT COUNT(*) as medios FROM avisos WHERE prioridad = "media" AND activo = 1');
    const [bajosResult] = await db.execute('SELECT COUNT(*) as bajos FROM avisos WHERE prioridad = "baja" AND activo = 1');
    
    // Obtener el último aviso activo
    const [ultimoAviso] = await db.execute('SELECT titulo, fecha_creacion FROM avisos WHERE activo = 1 ORDER BY fecha_creacion DESC LIMIT 1');
    
    // Obtener última actualización
    const [ultimaActualizacion] = await db.execute('SELECT MAX(fecha_actualizacion) as ultima FROM avisos WHERE activo = 1');
    
    const estadisticas = {
      total: totalResult[0].total,
      altos: altosResult[0].altos,
      medios: mediosResult[0].medios,
      bajos: bajosResult[0].bajos,
      ultimo_aviso: ultimoAviso.length > 0 
        ? `${ultimoAviso[0].titulo} (${new Date(ultimoAviso[0].fecha_creacion).toLocaleDateString('es-ES')})`
        : 'Sin avisos activos',
      ultima_actualizacion: ultimaActualizacion[0].ultima,
      mensaje: 'Estadísticas de avisos activos'
    };
    
    res.json({ success: true, estadisticas });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      estadisticas: {
        total: 0,
        altos: 0,
        medios: 0,
        bajos: 0,
        ultimo_aviso: 'Error al cargar',
        ultima_actualizacion: null,
        mensaje: 'Error al cargar estadísticas'
      }
    });
  }
};

// ================= VERIFICAR TABLA =================
exports.verificarTabla = async (req, res) => {
  try {
    // Verificar si la tabla existe
    const [tablas] = await db.execute("SHOW TABLES LIKE 'avisos'");
    const tablaExiste = tablas.length > 0;
    
    if (!tablaExiste) {
      return res.json({
        tabla_existe: false,
        total_registros: 0,
        activos: 0,
        inactivos: 0,
        mensaje: 'La tabla "avisos" no existe en la base de datos'
      });
    }
    
    // Obtener estadísticas de la tabla
    const [totalResult] = await db.execute('SELECT COUNT(*) as total FROM avisos');
    const [activosResult] = await db.execute('SELECT COUNT(*) as activos FROM avisos WHERE activo = 1');
    const [inactivosResult] = await db.execute('SELECT COUNT(*) as inactivos FROM avisos WHERE activo = 0');
    
    // Obtener algunos ejemplos (opcional)
    const [ejemplos] = await db.execute('SELECT id, titulo, activo FROM avisos ORDER BY id DESC LIMIT 5');
    
    res.json({
      tabla_existe: true,
      total_registros: totalResult[0].total,
      activos: activosResult[0].activos,
      inactivos: inactivosResult[0].inactivos,
      ejemplos: ejemplos,
      mensaje: `Tabla encontrada con ${totalResult[0].total} registros (${activosResult[0].activos} activos)`
    });
  } catch (error) {
    console.error('Error verificando tabla:', error);
    res.status(500).json({ 
      tabla_existe: false, 
      total_registros: 0,
      activos: 0,
      inactivos: 0,
      mensaje: 'Error al verificar tabla: ' + error.message
    });
  }
};

// ================= PATCH TOGGLE AVISO =================
exports.toggleAviso = async (req, res) => {
  try {
    const id = req.params.id;
    const [aviso] = await db.execute('SELECT activo FROM avisos WHERE id = ?', [id]);
    if (!aviso.length) return res.status(404).json({ success: false, message: 'Aviso no encontrado' });

    const nuevoEstado = aviso[0].activo ? 0 : 1;
    await db.execute('UPDATE avisos SET activo = ?, fecha_actualizacion = NOW() WHERE id = ?', [nuevoEstado, id]);

    res.json({ success: true, message: 'Estado actualizado', nuevoEstado });
  } catch (error) {
    console.error('Error toggling aviso:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= POST CREAR AVISO =================
exports.crearAviso = async (req, res) => {
  try {
    const { titulo, contenido, prioridad, activo } = req.body;
    const [result] = await db.execute(
      'INSERT INTO avisos (titulo, contenido, prioridad, activo) VALUES (?, ?, ?, ?)',
      [titulo, contenido, prioridad, activo ? 1 : 0]
    );

    const [nuevoAviso] = await db.execute(
      'SELECT *, DATE_FORMAT(fecha_creacion, "%d/%m/%Y %H:%i") as fecha_formateada FROM avisos WHERE id = ?', 
      [result.insertId]
    );
    
    res.json({ success: true, aviso: nuevoAviso[0] });
  } catch (error) {
    console.error('Error creando aviso:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= PUT ACTUALIZAR AVISO =================
exports.actualizarAviso = async (req, res) => {
  try {
    const id = req.params.id;
    const { titulo, contenido, prioridad, activo } = req.body;

    const [aviso] = await db.execute('SELECT * FROM avisos WHERE id = ?', [id]);
    if (!aviso.length) return res.status(404).json({ success: false, message: 'Aviso no encontrado' });

    await db.execute(
      'UPDATE avisos SET titulo = ?, contenido = ?, prioridad = ?, activo = ?, fecha_actualizacion = NOW() WHERE id = ?',
      [titulo, contenido, prioridad, activo ? 1 : 0, id]
    );

    const [actualizado] = await db.execute(
      'SELECT *, DATE_FORMAT(fecha_creacion, "%d/%m/%Y %H:%i") as fecha_formateada FROM avisos WHERE id = ?', 
      [id]
    );
    
    res.json({ success: true, aviso: actualizado[0] });
  } catch (error) {
    console.error('Error actualizando aviso:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= DELETE AVISO =================
exports.eliminarAviso = async (req, res) => {
  try {
    const id = req.params.id;
    await db.execute('DELETE FROM avisos WHERE id = ?', [id]);
    res.json({ success: true, message: 'Aviso eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando aviso:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};