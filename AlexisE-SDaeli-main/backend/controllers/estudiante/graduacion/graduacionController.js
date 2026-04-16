// C:\Codigos\HTml\gestion-educativa\backend\controllers\estudiante\graduacion\graduacionController.js
const pool = require('../../../config/dbConfig');
const fs = require('fs').promises;
const path = require('path');
const { limpiarTextoWinAnsi, limpiarTextoMayusculas, limpiarNombrePropio } = require('../../../utils/pdfUtils');

console.log('🎓 CARGANDO CONTROLLER DE GRADUACIÓN PARA ESTUDIANTES...');
console.log('✅ Pool configurado:', pool ? 'Sí' : 'No');

// ========================================
// GET - Descargar certificado específico
// 🔥 SOLO DESCARGA EL PDF GUARDADO - NO GENERA NUEVO
// ========================================
const descargarCertificado = async (req, res) => {
  try {
    const { certificado_id } = req.params;
    const estudiante_id = req.query.estudiante_id || req.body.estudiante_id;
    
    if (!estudiante_id) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere ID del estudiante'
      });
    }
    
    console.log(`📥 [GRADUACIÓN] Descargando certificado ${certificado_id} para estudiante ${estudiante_id}`);
    
    if (!pool) {
      throw new Error('Pool de conexión no está disponible');
    }
    
    // Verificar que el certificado pertenece al estudiante y está enviado
    const [certificados] = await pool.query(`
      SELECT 
        c.*,
        u.nino_nombre AS alumno_nombre,
        DATE_FORMAT(c.creado_en, '%d/%m/%Y') AS fecha_formateada
      FROM certificados c
      LEFT JOIN usuarios u ON c.alumno_id = u.id
      WHERE c.id = ? AND c.alumno_id = ? AND c.estado = 'enviado'
    `, [certificado_id, estudiante_id]);
    
    if (certificados.length === 0) {
      console.log(`❌ [GRADUACIÓN] Certificado ${certificado_id} no encontrado o no disponible`);
      return res.status(404).json({
        success: false,
        message: 'Certificado no disponible'
      });
    }
    
    const certificado = certificados[0];
    console.log(`✅ [GRADUACIÓN] Certificado ${certificado_id} válido para descarga`);
    
    // ========================================
    // 🔥 BUSCAR EL PDF GUARDADO POR EL MAESTRO
    // ========================================
    if (!certificado.archivo_pdf) {
      console.log(`❌ [GRADUACIÓN] Certificado ${certificado_id} no tiene archivo_pdf asociado`);
      return res.status(404).json({
        success: false,
        message: 'El certificado no tiene un PDF asociado. Contacta a tu maestro para que genere el certificado nuevamente.'
      });
    }
    
    const uploadDir = path.join(__dirname, '../../../../uploads/certificados');
    const filePath = path.join(uploadDir, certificado.archivo_pdf);
    
    try {
      // Verificar si el archivo existe
      await fs.access(filePath);
      
      console.log(`✅ [GRADUACIÓN] PDF guardado encontrado: ${filePath}`);
      
      // Limpiar nombre para el nombre del archivo
      const nombreArchivo = limpiarTextoWinAnsi(certificado.alumno_nombre).replace(/\s+/g, '_');
      
      // Enviar el archivo PDF guardado
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificado_${nombreArchivo}.pdf"`);
      
      // Enviar el archivo
      const { createReadStream } = require('fs');
      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
      
      return; // ✅ SALIR AQUÍ - NO GENERAR NUEVO PDF
      
    } catch (err) {
      console.log(`❌ [GRADUACIÓN] PDF guardado no encontrado: ${filePath}`);
      console.log(`❌ Error: ${err.message}`);
      
      return res.status(404).json({
        success: false,
        message: 'El archivo PDF del certificado no se encuentra en el servidor. Contacta a tu maestro para que genere el certificado nuevamente.',
        archivo_buscado: certificado.archivo_pdf
      });
    }
    
  } catch (error) {
    console.error('❌ [GRADUACIÓN] Error en descargarCertificado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la descarga del certificado',
      error: error.message
    });
  }
};

// ========================================
// GET - Obtener certificados del estudiante (INCLUYE archivo_pdf)
// ========================================
const getCertificadosEstudiante = async (req, res) => {
  try {
    const { estudiante_id } = req.params;
    
    console.log(`📜 [GRADUACIÓN] Obteniendo certificados para estudiante ID: ${estudiante_id}`);
    
    if (!pool) {
      throw new Error('Pool de conexión no está disponible');
    }
    
    const [estudianteCheck] = await pool.query(
      'SELECT id, nino_nombre FROM usuarios WHERE id = ?',
      [estudiante_id]
    );
    
    if (estudianteCheck.length === 0) {
      console.log(`❌ [GRADUACIÓN] Estudiante ID ${estudiante_id} no encontrado`);
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }
    
    const estudiante = estudianteCheck[0];
    console.log(`✅ [GRADUACIÓN] Estudiante encontrado: ${estudiante.nino_nombre}`);
    
    const [certificados] = await pool.query(`
      SELECT 
        c.id,
        c.alumno_id,
        u.nino_nombre AS alumno_nombre,
        c.promedio,
        c.ciclo,
        c.maestro_firma,
        COALESCE(c.estado, 'pendiente') AS estado,
        c.archivo_pdf,
        DATE_FORMAT(c.creado_en, '%Y-%m-%d %H:%i:%s') AS fecha_creacion,
        DATE_FORMAT(c.creado_en, '%d/%m/%Y') AS fecha_formateada
      FROM certificados c
      LEFT JOIN usuarios u ON c.alumno_id = u.id
      WHERE c.alumno_id = ?
      ORDER BY c.creado_en DESC
    `, [estudiante_id]);

    console.log(`✅ [GRADUACIÓN] ${certificados.length} certificados encontrados para ${estudiante.nino_nombre}`);
    res.json(certificados);
    
  } catch (error) {
    console.error('❌ [GRADUACIÓN] Error en getCertificadosEstudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener certificados',
      error: error.message
    });
  }
};

// ========================================
// GET - Obtener estadísticas del estudiante
// ========================================
const getEstadisticasEstudiante = async (req, res) => {
  try {
    const { estudiante_id } = req.params;
    
    console.log(`📊 [GRADUACIÓN] Obteniendo estadísticas para estudiante ID: ${estudiante_id}`);
    
    if (!pool) {
      throw new Error('Pool de conexión no está disponible');
    }
    
    const [result] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN COALESCE(estado, 'pendiente') = 'enviado' THEN 1 ELSE 0 END) AS enviados,
        AVG(promedio) AS promedio_general,
        MIN(promedio) AS promedio_minimo,
        MAX(promedio) AS promedio_maximo
      FROM certificados 
      WHERE alumno_id = ?
    `, [estudiante_id]);

    const stats = result[0] || { 
      total: 0, 
      enviados: 0, 
      promedio_general: null,
      promedio_minimo: null,
      promedio_maximo: null
    };
    
    stats.total = parseInt(stats.total) || 0;
    stats.enviados = parseInt(stats.enviados) || 0;
    stats.pendientes = stats.total - stats.enviados;
    stats.promedio_general = stats.promedio_general ? 
      parseFloat(stats.promedio_general).toFixed(2) : '0.00';
    stats.promedio_minimo = stats.promedio_minimo ? 
      parseFloat(stats.promedio_minimo).toFixed(2) : '0.00';
    stats.promedio_maximo = stats.promedio_maximo ? 
      parseFloat(stats.promedio_maximo).toFixed(2) : '0.00';
    
    console.log(`✅ [GRADUACIÓN] Estadísticas:`, stats);
    res.json(stats);
    
  } catch (error) {
    console.error('❌ [GRADUACIÓN] Error en getEstadisticasEstudiante:', error);
    res.json({
      total: 0,
      enviados: 0,
      pendientes: 0,
      promedio_general: '0.00',
      promedio_minimo: '0.00',
      promedio_maximo: '0.00'
    });
  }
};

// ========================================
// GET - Obtener ciclos únicos del estudiante
// ========================================
const getCiclosEstudiante = async (req, res) => {
  try {
    const { estudiante_id } = req.params;
    
    console.log(`📅 [GRADUACIÓN] Obteniendo ciclos para estudiante ID: ${estudiante_id}`);
    
    if (!pool) {
      throw new Error('Pool de conexión no está disponible');
    }
    
    const [rows] = await pool.query(`
      SELECT DISTINCT ciclo 
      FROM certificados 
      WHERE alumno_id = ? 
        AND ciclo IS NOT NULL 
        AND ciclo != ''
      ORDER BY ciclo DESC
    `, [estudiante_id]);
    
    const ciclos = rows.map(row => row.ciclo);
    
    console.log(`✅ [GRADUACIÓN] ${ciclos.length} ciclos encontrados`);
    res.json(ciclos);
    
  } catch (error) {
    console.error('❌ [GRADUACIÓN] Error en getCiclosEstudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ciclos',
      error: error.message
    });
  }
};

// ========================================
// GET - Verificar estudiante
// ========================================
const verificarEstudiante = async (req, res) => {
  try {
    const { estudiante_id } = req.params;
    
    console.log(`🔍 [GRADUACIÓN] Verificando estudiante ID: ${estudiante_id}`);
    
    if (!pool) {
      throw new Error('Pool de conexión no está disponible');
    }
    
    const [estudiante] = await pool.query(
      'SELECT id, nino_nombre, tutor_email, tutor_nombre FROM usuarios WHERE id = ?',
      [estudiante_id]
    );
    
    if (estudiante.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }
    
    const estudianteData = estudiante[0];
    
    const [certificadosResult] = await pool.query(
      'SELECT COUNT(*) as total FROM certificados WHERE alumno_id = ?',
      [estudiante_id]
    );
    
    const [estadisticasResult] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'enviado' THEN 1 ELSE 0 END) as enviados,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes
      FROM certificados WHERE alumno_id = ?`,
      [estudiante_id]
    );
    
    const totalCertificados = parseInt(certificadosResult[0].total) || 0;
    const estadisticas = estadisticasResult[0] || { total: 0, enviados: 0, pendientes: 0 };
    
    console.log(`✅ [GRADUACIÓN] Estudiante verificado: ${estudianteData.nino_nombre}`);
    
    res.json({
      success: true,
      estudiante: {
        id: estudianteData.id,
        nombre: estudianteData.nino_nombre,
        tutor_nombre: estudianteData.tutor_nombre,
        email: estudianteData.tutor_email || 'No disponible'
      },
      certificados: {
        tiene_certificados: totalCertificados > 0,
        total: totalCertificados,
        enviados: parseInt(estadisticas.enviados) || 0,
        pendientes: parseInt(estadisticas.pendientes) || 0
      }
    });
    
  } catch (error) {
    console.error('❌ [GRADUACIÓN] Error en verificarEstudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar estudiante',
      error: error.message
    });
  }
};

// ========================================
// GET - Obtener resumen completo
// ========================================
const getResumenEstudiante = async (req, res) => {
  try {
    const { estudiante_id } = req.params;
    
    console.log(`📋 [GRADUACIÓN] Obteniendo resumen para estudiante ID: ${estudiante_id}`);
    
    if (!pool) {
      throw new Error('Pool de conexión no está disponible');
    }
    
    const [estudianteRows] = await pool.query(
      'SELECT id, nino_nombre, tutor_nombre, tutor_email FROM usuarios WHERE id = ?',
      [estudiante_id]
    );
    
    if (estudianteRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }
    
    const estudiante = estudianteRows[0];
    
    const [certificadosRows] = await pool.query(`
      SELECT 
        c.id,
        c.promedio,
        c.ciclo,
        c.maestro_firma,
        c.estado,
        c.archivo_pdf,
        DATE_FORMAT(c.creado_en, '%d/%m/%Y') AS fecha
      FROM certificados c
      WHERE c.alumno_id = ?
      ORDER BY c.creado_en DESC
      LIMIT 10
    `, [estudiante_id]);
    
    const [estadisticasRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'enviado' THEN 1 ELSE 0 END) AS enviados,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        AVG(promedio) AS promedio_general,
        MIN(promedio) AS minimo,
        MAX(promedio) AS maximo
      FROM certificados 
      WHERE alumno_id = ?
    `, [estudiante_id]);
    
    const estadisticas = estadisticasRows[0] || {
      total: 0, enviados: 0, pendientes: 0,
      promedio_general: 0, minimo: 0, maximo: 0
    };
    
    const [ciclosRows] = await pool.query(`
      SELECT DISTINCT ciclo 
      FROM certificados 
      WHERE alumno_id = ? 
        AND ciclo IS NOT NULL 
        AND ciclo != ''
      ORDER BY ciclo DESC
      LIMIT 5
    `, [estudiante_id]);
    
    const ciclos = ciclosRows.map(row => row.ciclo);
    
    const resumen = {
      success: true,
      estudiante: {
        id: estudiante.id,
        nombre: estudiante.nino_nombre,
        tutor: estudiante.tutor_nombre,
        email: estudiante.tutor_email,
        grado: 'No disponible'
      },
      estadisticas: {
        total: parseInt(estadisticas.total) || 0,
        enviados: parseInt(estadisticas.enviados) || 0,
        pendientes: parseInt(estadisticas.pendientes) || 0,
        promedio_general: estadisticas.promedio_general ? 
          parseFloat(estadisticas.promedio_general).toFixed(2) : '0.00',
        promedio_minimo: estadisticas.minimo ? 
          parseFloat(estadisticas.minimo).toFixed(2) : '0.00',
        promedio_maximo: estadisticas.maximo ? 
          parseFloat(estadisticas.maximo).toFixed(2) : '0.00'
      },
      certificados_recientes: certificadosRows,
      ciclos_disponibles: ciclos,
      certificados_disponibles_descarga: certificadosRows.filter(c => c.estado === 'enviado').length
    };
    
    console.log(`✅ [GRADUACIÓN] Resumen generado para ${estudiante.nino_nombre}`);
    res.json(resumen);
    
  } catch (error) {
    console.error('❌ [GRADUACIÓN] Error en getResumenEstudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen',
      error: error.message
    });
  }
};

// ========================================
// GET - Verificar sistema
// ========================================
const verificarSistema = async (req, res) => {
  try {
    console.log('🔧 [GRADUACIÓN] Verificando estado del sistema...');
    
    if (!pool) {
      throw new Error('Pool de conexión no está disponible');
    }
    
    const [dbCheck] = await pool.query('SELECT 1 as connection_test');
    const dbConnected = dbCheck.length > 0;
    
    const [tablasCheck] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('usuarios', 'certificados')
    `);
    
    const tablasExistentes = tablasCheck.map(row => row.TABLE_NAME);
    const tieneUsuarios = tablasExistentes.includes('usuarios');
    const tieneCertificados = tablasExistentes.includes('certificados');
    
    const [estudiantesCount] = await pool.query(
      'SELECT COUNT(*) as total FROM usuarios WHERE rol IS NULL OR rol = "" OR rol = "alumno" OR rol = "tutor"'
    );
    
    const [certificadosCount] = await pool.query('SELECT COUNT(*) as total FROM certificados');
    
    res.json({
      success: true,
      sistema: 'graduacion-estudiante',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      estado: {
        base_datos: dbConnected ? 'conectada' : 'desconectada',
        tablas: {
          usuarios: tieneUsuarios ? 'existe' : 'no existe',
          certificados: tieneCertificados ? 'existe' : 'no existe'
        },
        estadisticas: {
          estudiantes: parseInt(estudiantesCount[0].total) || 0,
          certificados: parseInt(certificadosCount[0].total) || 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ [GRADUACIÓN] Error en verificarSistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar sistema',
      error: error.message
    });
  }
};

// ========================================
// GET - Test endpoint
// ========================================
const test = (req, res) => {
  console.log('🧪 [GRADUACIÓN] Test endpoint accedido');
  
  res.json({
    success: true,
    message: 'Módulo de graduación para estudiantes está funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    estado: {
      pool_configured: pool ? 'Sí' : 'No',
      entorno: process.env.NODE_ENV || 'development'
    },
    endpoints: {
      certificados: 'GET /api/estudiante/graduacion/:estudiante_id/certificados',
      estadisticas: 'GET /api/estudiante/graduacion/:estudiante_id/estadisticas',
      ciclos: 'GET /api/estudiante/graduacion/:estudiante_id/ciclos',
      verificar: 'GET /api/estudiante/graduacion/:estudiante_id/verificar',
      resumen: 'GET /api/estudiante/graduacion/:estudiante_id/resumen',
      sistema: 'GET /api/estudiante/graduacion/sistema/verificar',
      test: 'GET /api/estudiante/graduacion/test'
    }
  });
};

// ========================================
// GET - Endpoint alternativo para descarga (por compatibilidad)
// ========================================
const generarPDFCertificado = async (req, res) => {
  // Redirigir a la misma función de descarga
  return descargarCertificado(req, res);
};

// ========================================
// EXPORTAR TODAS LAS FUNCIONES
// ========================================
module.exports = {
  getCertificadosEstudiante,
  getEstadisticasEstudiante,
  getCiclosEstudiante,
  descargarCertificado,
  generarPDFCertificado,
  verificarEstudiante,
  getResumenEstudiante,
  verificarSistema,
  test
};