// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\graduacion\graduacionController.js
// VERSIÓN 100% FUNCIONAL

const pool = require('../../../config/dbConfig');

// =============================
// GET - Obtener alumnos para select
// =============================
const getAlumnos = async (req, res) => {
  try {
    const { maestro_id } = req.params;
    
    console.log('🔍 Obteniendo alumnos para maestro:', maestro_id);
    
    const [rows] = await pool.query(`
      SELECT 
        id,
        nino_nombre AS nombre
      FROM usuarios 
      WHERE nino_nombre IS NOT NULL
        AND nino_nombre != ''
        AND nino_nombre != 'null'
        AND (rol IS NULL OR rol = '' OR rol = 'alumno' OR rol = 'tutor')
      ORDER BY nino_nombre ASC
    `);

    console.log(`✅ Alumnos encontrados: ${rows.length}`);
    res.json(rows);
    
  } catch (error) {
    console.error('❌ Error en getAlumnos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar alumnos',
      error: error.message
    });
  }
};

// =============================
// GET - Obtener configuración del maestro
// =============================
const getConfiguracion = async (req, res) => {
  try {
    const { maestro_id } = req.params;
    
    console.log('⚙️ Obteniendo configuración para maestro:', maestro_id);
    
    const [rows] = await pool.query(`
      SELECT 
        ciclo_actual,
        nombre_maestro_firma
      FROM configuracion 
      WHERE maestro_id = ?
    `, [maestro_id]);

    if (rows.length === 0) {
      console.log('⚠️ Configuración no encontrada, creando por defecto');
      
      await pool.query(`
        INSERT INTO configuracion 
          (maestro_id, ciclo_actual, nombre_maestro_firma) 
        VALUES (?, '2025-2026', 'Juan Pérez')
      `, [maestro_id]);
      
      console.log('✅ Configuración por defecto creada');
      
      return res.json({
        ciclo_actual: '2025-2026',
        nombre_maestro_firma: 'Juan Pérez'
      });
    }

    console.log('✅ Configuración encontrada:', rows[0]);
    res.json(rows[0]);
    
  } catch (error) {
    console.error('❌ Error en getConfiguracion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración',
      error: error.message
    });
  }
};

// =============================
// GET - Listar certificados
// =============================
const listarCertificados = async (req, res) => {
  try {
    const { maestro_id } = req.params;
    
    console.log('📜 Listando certificados para maestro:', maestro_id);
    
    const [rows] = await pool.query(`
      SELECT 
        c.id,
        c.alumno_id,
        u.nino_nombre AS alumno_nombre,
        c.promedio,
        c.ciclo,
        c.maestro_firma,
        COALESCE(c.estado, 'pendiente') AS estado,
        DATE_FORMAT(c.creado_en, '%Y-%m-%d %H:%i') AS fecha_creacion
      FROM certificados c
      LEFT JOIN usuarios u ON c.alumno_id = u.id
      WHERE c.maestro_id = ?
      ORDER BY c.creado_en DESC
    `, [maestro_id]);

    console.log(`✅ Certificados encontrados: ${rows.length}`);
    res.json(rows);
    
  } catch (error) {
    console.error('❌ Error en listarCertificados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar certificados',
      error: error.message
    });
  }
};

// =============================
// GET - Obtener estadísticas
// =============================
const getEstadisticas = async (req, res) => {
  try {
    const { maestro_id } = req.params;
    
    console.log('📊 Obteniendo estadísticas para maestro:', maestro_id);
    
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN COALESCE(estado, 'pendiente') = 'enviado' THEN 1 ELSE 0 END) AS enviados
      FROM certificados 
      WHERE maestro_id = ?
    `, [maestro_id]);

    const stats = rows[0] || { total: 0, enviados: 0 };
    
    // Convertir a números
    stats.total = parseInt(stats.total) || 0;
    stats.enviados = parseInt(stats.enviados) || 0;
    stats.pendientes = stats.total - stats.enviados;
    
    console.log('✅ Estadísticas:', stats);
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Error en getEstadisticas:', error);
    res.json({
      total: 0,
      enviados: 0,
      pendientes: 0
    });
  }
};

// =============================
// POST - Crear nuevo certificado
// =============================
const crearCertificado = async (req, res) => {
  try {
    const { maestro_id } = req.params;
    
    console.log('🎓 Creando certificado para maestro:', maestro_id);
    console.log('📦 Datos recibidos:', req.body);
    
    const { alumno_id, promedio, ciclo, maestro_firma } = req.body;

    // Validaciones
    if (!alumno_id || !promedio || !ciclo || !maestro_firma) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (promedio < 0 || promedio > 10) {
      return res.status(400).json({
        success: false,
        message: 'El promedio debe estar entre 0 y 10'
      });
    }

    console.log('🔧 Insertando certificado en BD...');
    
    // Insertar certificado
    const [result] = await pool.query(`
      INSERT INTO certificados 
        (alumno_id, maestro_id, promedio, ciclo, maestro_firma, estado) 
      VALUES (?, ?, ?, ?, ?, 'pendiente')
    `, [alumno_id, maestro_id, promedio, ciclo, maestro_firma]);

    console.log(`✅ Certificado creado con ID: ${result.insertId}`);
    
    // Actualizar configuración
    await pool.query(`
      UPDATE configuracion SET 
        ciclo_actual = ?,
        nombre_maestro_firma = ?,
        ultimo_alumno_id = ?,
        actualizado_en = NOW()
      WHERE maestro_id = ?
    `, [ciclo, maestro_firma, alumno_id, maestro_id]);

    console.log('✅ Configuración actualizada');
    
    res.json({
      success: true,
      message: 'Certificado creado exitosamente',
      certificado_id: result.insertId
    });
    
  } catch (error) {
    console.error('❌ Error en crearCertificado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear certificado',
      error: error.message
    });
  }
};

// =============================
// PUT - Cambiar estado
// =============================
const cambiarEstado = async (req, res) => {
  try {
    const { certificado_id } = req.params;
    const { estado } = req.body;
    
    console.log(`🔄 Cambiando estado del certificado ${certificado_id} a:`, estado);
    
    if (!estado || !['pendiente', 'enviado'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Use: "pendiente" o "enviado"'
      });
    }

    const [result] = await pool.query(`
      UPDATE certificados 
      SET estado = ? 
      WHERE id = ?
    `, [estado, certificado_id]);

    console.log(`✅ Estado cambiado. Filas afectadas: ${result.affectedRows}`);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Certificado no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Certificado marcado como ${estado}`,
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ Error en cambiarEstado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado',
      error: error.message
    });
  }
};

// =============================
// DELETE - Eliminar certificado
// =============================
const eliminarCertificado = async (req, res) => {
  try {
    const { certificado_id } = req.params;
    
    console.log(`🗑️ Eliminando certificado ID: ${certificado_id}`);

    const [result] = await pool.query(
      "DELETE FROM certificados WHERE id = ?",
      [certificado_id]
    );

    console.log(`✅ Certificado eliminado. Filas afectadas: ${result.affectedRows}`);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Certificado no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Certificado eliminado correctamente',
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ Error en eliminarCertificado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar certificado',
      error: error.message
    });
  }
};

// =============================
// ✅ EXPORTACIÓN CORRECTA
// =============================
module.exports = {
  getAlumnos,
  getConfiguracion,
  crearCertificado,
  listarCertificados,
  getEstadisticas,
  cambiarEstado,
  eliminarCertificado
};