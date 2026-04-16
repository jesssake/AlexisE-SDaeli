const db = require('../../../config/dbConfig'); // <-- apunta a tu dbConfig.js

// ================= GET TODOS LOS AVISOS =================
exports.getTodosAvisos = async (req, res) => {
  try {
    const [avisos] = await db.execute('SELECT * FROM avisos ORDER BY fecha_creacion DESC');
    res.json({ success: true, avisos });
  } catch (error) {
    console.error('Error obteniendo todos los avisos:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET AVISOS ACTIVOS =================
exports.getAvisosActivos = async (req, res) => {
  try {
    const [avisos] = await db.execute('SELECT * FROM avisos WHERE activo = 1 ORDER BY fecha_creacion DESC');
    res.json({ success: true, avisos });
  } catch (error) {
    console.error('Error obteniendo avisos activos:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= POST TOGGLE AVISO (ACTIVAR/OCULTAR) =================
// ✅ CAMBIADO: Ahora usa POST en lugar de PATCH
exports.toggleAviso = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`🔄 Alternando estado del aviso ID: ${id}`);
    
    const [aviso] = await db.execute('SELECT activo FROM avisos WHERE id = ?', [id]);
    if (!aviso.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aviso no encontrado' 
      });
    }

    const nuevoEstado = aviso[0].activo ? 0 : 1;
    await db.execute(
      'UPDATE avisos SET activo = ?, fecha_actualizacion = NOW() WHERE id = ?', 
      [nuevoEstado, id]
    );

    res.json({ 
      success: true, 
      message: `Aviso ${nuevoEstado === 1 ? 'activado' : 'ocultado'} correctamente`,
      nuevoEstado 
    });
  } catch (error) {
    console.error('Error toggling aviso:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= POST CREAR AVISO =================
exports.crearAviso = async (req, res) => {
  try {
    const { titulo, contenido, prioridad, activo } = req.body;
    
    if (!titulo || !contenido) {
      return res.status(400).json({ 
        success: false, 
        message: 'Título y contenido son obligatorios' 
      });
    }
    
    const [result] = await db.execute(
      'INSERT INTO avisos (titulo, contenido, prioridad, activo, fecha_creacion, fecha_actualizacion) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [titulo, contenido, prioridad || 'media', activo !== undefined ? (activo ? 1 : 0) : 1]
    );

    const [nuevoAviso] = await db.execute('SELECT * FROM avisos WHERE id = ?', [result.insertId]);
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
    if (!aviso.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aviso no encontrado' 
      });
    }

    await db.execute(
      'UPDATE avisos SET titulo = ?, contenido = ?, prioridad = ?, activo = ?, fecha_actualizacion = NOW() WHERE id = ?',
      [titulo, contenido, prioridad || 'media', activo !== undefined ? (activo ? 1 : 0) : 1, id]
    );

    const [actualizado] = await db.execute('SELECT * FROM avisos WHERE id = ?', [id]);
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
    
    const [aviso] = await db.execute('SELECT * FROM avisos WHERE id = ?', [id]);
    if (!aviso.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aviso no encontrado' 
      });
    }
    
    await db.execute('DELETE FROM avisos WHERE id = ?', [id]);
    res.json({ 
      success: true, 
      message: 'Aviso eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error eliminando aviso:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET AVISO POR ID (OPCIONAL) =================
exports.getAvisoById = async (req, res) => {
  try {
    const id = req.params.id;
    const [aviso] = await db.execute('SELECT * FROM avisos WHERE id = ?', [id]);
    
    if (!aviso.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aviso no encontrado' 
      });
    }
    
    res.json({ success: true, aviso: aviso[0] });
  } catch (error) {
    console.error('Error obteniendo aviso:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};