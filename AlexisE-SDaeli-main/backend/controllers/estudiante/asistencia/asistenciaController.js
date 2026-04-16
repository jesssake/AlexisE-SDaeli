// C:\Codigos\HTml\gestion-educativa\backend\controllers\estudiante\asistencia\asistenciaController.js
const pool = require('../../../config/dbConfig');

// 🔹 OBTENER ASISTENCIA DE UN ESTUDIANTE ESPECÍFICO
exports.obtenerAsistenciaEstudiante = async (req, res) => {
  try {
    const { estudiante_id } = req.params;
    const { mes, año, limite } = req.query;

    console.log('🔍 Obteniendo asistencia para estudiante:', { 
      estudiante_id, 
      mes, 
      año,
      limite 
    });

    if (!estudiante_id) {
      return res.status(400).json({
        ok: false,
        message: "Se requiere el ID del estudiante"
      });
    }

    // Verificar que el estudiante existe
    const [estudianteExiste] = await pool.query(
      'SELECT id, nino_nombre FROM usuarios WHERE id = ?',
      [estudiante_id]
    );

    if (estudianteExiste.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Estudiante no encontrado"
      });
    }

    const estudiante = estudianteExiste[0];

    // Construir condiciones de fecha
    let whereConditions = `WHERE a.estudiante_id = ?`;
    const params = [estudiante_id];

    if (mes && año) {
      whereConditions += ` AND YEAR(a.fecha) = ? AND MONTH(a.fecha) = ?`;
      params.push(año, mes);
    }

    // Agregar límite si se especifica
    let limitClause = '';
    if (limite && !isNaN(limite)) {
      limitClause = `LIMIT ${parseInt(limite)}`;
    }

    // Obtener asistencia del estudiante
    const [asistencias] = await pool.query(`
      SELECT 
        a.id,
        a.fecha,
        DATE_FORMAT(a.fecha, '%d/%m/%Y') as fecha_formateada,
        a.hora_clase,
        a.estado,
        a.comentario_maestro,
        m.admin_nombre as maestro_nombre,
        DAYNAME(a.fecha) as dia_semana,
        DAY(a.fecha) as dia,
        MONTH(a.fecha) as mes_numero,
        DATE_FORMAT(a.fecha, '%M') as mes_nombre,
        YEAR(a.fecha) as año
      FROM asistencia a
      LEFT JOIN administradores m ON m.id = a.maestro_id
      ${whereConditions}
      ORDER BY a.fecha DESC, a.hora_clase DESC
      ${limitClause}
    `, params);

    // Obtener estadísticas generales
    const [estadisticasGenerales] = await pool.query(`
      SELECT 
        COUNT(*) as total_dias,
        SUM(CASE WHEN estado = 'PRESENTE' THEN 1 ELSE 0 END) as presentes,
        SUM(CASE WHEN estado = 'AUSENTE' THEN 1 ELSE 0 END) as ausentes,
        SUM(CASE WHEN estado = 'JUSTIFICADO' THEN 1 ELSE 0 END) as justificados,
        ROUND(
          (SUM(CASE WHEN estado IN ('PRESENTE', 'JUSTIFICADO') THEN 1 ELSE 0 END) / 
          GREATEST(COUNT(*), 1)) * 100, 2
        ) as porcentaje_asistencia
      FROM asistencia
      WHERE estudiante_id = ?
    `, [estudiante_id]);

    // Obtener estadísticas del mes actual (si se especifica mes)
    let estadisticasMes = null;
    if (mes && año) {
      const [estadisticasMesResult] = await pool.query(`
        SELECT 
          COUNT(*) as total_dias_mes,
          SUM(CASE WHEN estado = 'PRESENTE' THEN 1 ELSE 0 END) as presentes_mes,
          SUM(CASE WHEN estado = 'AUSENTE' THEN 1 ELSE 0 END) as ausentes_mes,
          SUM(CASE WHEN estado = 'JUSTIFICADO' THEN 1 ELSE 0 END) as justificados_mes,
          ROUND(
            (SUM(CASE WHEN estado IN ('PRESENTE', 'JUSTIFICADO') THEN 1 ELSE 0 END) / 
            GREATEST(COUNT(*), 1)) * 100, 2
          ) as porcentaje_mes
        FROM asistencia
        WHERE estudiante_id = ? 
          AND YEAR(fecha) = ? 
          AND MONTH(fecha) = ?
      `, [estudiante_id, año, mes]);
      
      estadisticasMes = estadisticasMesResult[0] || null;
    }

    // Obtener última asistencia registrada
    const [ultimaAsistencia] = await pool.query(`
      SELECT fecha, estado, comentario_maestro
      FROM asistencia
      WHERE estudiante_id = ?
      ORDER BY fecha DESC, hora_clase DESC
      LIMIT 1
    `, [estudiante_id]);

    return res.json({
      ok: true,
      estudiante: {
        id: estudiante.id,
        nombre: estudiante.nino_nombre,
        estudiante_id: estudiante.id  // Para compatibilidad
      },
      asistencias: asistencias,
      estadisticas: {
        generales: estadisticasGenerales[0] || {
          total_dias: 0,
          presentes: 0,
          ausentes: 0,
          justificados: 0,
          porcentaje_asistencia: 0
        },
        mes_actual: estadisticasMes
      },
      ultima_asistencia: ultimaAsistencia[0] || null,
      total_registros: asistencias.length,
      filtros: { mes, año, limite }
    });

  } catch (error) {
    console.error("❌ Error obtenerAsistenciaEstudiante:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
      error: error.message,
      sqlMessage: error.sqlMessage
    });
  }
};

// 🔹 OBTENER RESUMEN MENSUAL POR ESTUDIANTE
exports.obtenerResumenMensual = async (req, res) => {
  try {
    const { estudiante_id } = req.params;
    const { año } = req.query;
    const añoActual = año || new Date().getFullYear();

    console.log('📊 Obteniendo resumen mensual para estudiante:', { 
      estudiante_id, 
      año: añoActual 
    });

    if (!estudiante_id) {
      return res.status(400).json({
        ok: false,
        message: "Se requiere el ID del estudiante"
      });
    }

    const [resumen] = await pool.query(`
      SELECT 
        MONTH(fecha) as mes_numero,
        DATE_FORMAT(fecha, '%M') as mes_nombre,
        COUNT(*) as total_dias,
        SUM(CASE WHEN estado = 'PRESENTE' THEN 1 ELSE 0 END) as presentes,
        SUM(CASE WHEN estado = 'AUSENTE' THEN 1 ELSE 0 END) as ausentes,
        SUM(CASE WHEN estado = 'JUSTIFICADO' THEN 1 ELSE 0 END) as justificados,
        ROUND(
          (SUM(CASE WHEN estado IN ('PRESENTE', 'JUSTIFICADO') THEN 1 ELSE 0 END) / 
          GREATEST(COUNT(*), 1)) * 100, 0
        ) as porcentaje
      FROM asistencia
      WHERE estudiante_id = ? AND YEAR(fecha) = ?
      GROUP BY MONTH(fecha), DATE_FORMAT(fecha, '%M')
      ORDER BY MONTH(fecha)
    `, [estudiante_id, añoActual]);

    return res.json({
      ok: true,
      año: añoActual,
      estudiante_id: estudiante_id,
      resumen: resumen,
      total_meses: resumen.length
    });

  } catch (error) {
    console.error("❌ Error obtenerResumenMensual:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// 🔹 OBTENER ASISTENCIA POR RANGO DE FECHAS
exports.obtenerAsistenciaPorRango = async (req, res) => {
  try {
    const { estudiante_id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    console.log('📅 Obteniendo asistencia por rango:', {
      estudiante_id,
      fecha_inicio,
      fecha_fin
    });

    if (!estudiante_id || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        ok: false,
        message: "Se requiere estudiante_id, fecha_inicio y fecha_fin"
      });
    }

    const [asistencias] = await pool.query(`
      SELECT 
        a.id,
        a.fecha,
        DATE_FORMAT(a.fecha, '%d/%m/%Y') as fecha_formateada,
        a.hora_clase,
        a.estado,
        a.comentario_maestro,
        m.admin_nombre as maestro_nombre
      FROM asistencia a
      LEFT JOIN administradores m ON m.id = a.maestro_id
      WHERE a.estudiante_id = ? 
        AND a.fecha BETWEEN ? AND ?
      ORDER BY a.fecha ASC, a.hora_clase ASC
    `, [estudiante_id, fecha_inicio, fecha_fin]);

    // Calcular estadísticas del rango
    const [estadisticasRango] = await pool.query(`
      SELECT 
        COUNT(*) as total_dias,
        SUM(CASE WHEN estado = 'PRESENTE' THEN 1 ELSE 0 END) as presentes,
        SUM(CASE WHEN estado = 'AUSENTE' THEN 1 ELSE 0 END) as ausentes,
        SUM(CASE WHEN estado = 'JUSTIFICADO' THEN 1 ELSE 0 END) as justificados
      FROM asistencia
      WHERE estudiante_id = ? 
        AND fecha BETWEEN ? AND ?
    `, [estudiante_id, fecha_inicio, fecha_fin]);

    return res.json({
      ok: true,
      estudiante_id: estudiante_id,
      rango: {
        fecha_inicio,
        fecha_fin
      },
      asistencias: asistencias,
      estadisticas: estadisticasRango[0] || {
        total_dias: 0,
        presentes: 0,
        ausentes: 0,
        justificados: 0
      },
      total_registros: asistencias.length
    });

  } catch (error) {
    console.error("❌ Error obtenerAsistenciaPorRango:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// 🔹 OBTENER ESTADÍSTICAS DETALLADAS
exports.obtenerEstadisticasDetalladas = async (req, res) => {
  try {
    const { estudiante_id } = req.params;

    console.log('📈 Obteniendo estadísticas detalladas para:', estudiante_id);

    if (!estudiante_id) {
      return res.status(400).json({
        ok: false,
        message: "Se requiere el ID del estudiante"
      });
    }

    // Estadísticas por mes del año actual
    const añoActual = new Date().getFullYear();
    
    const [estadisticasPorMes] = await pool.query(`
      SELECT 
        MONTH(fecha) as mes,
        DATE_FORMAT(fecha, '%M') as mes_nombre,
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'PRESENTE' THEN 1 ELSE 0 END) as presentes,
        SUM(CASE WHEN estado = 'AUSENTE' THEN 1 ELSE 0 END) as ausentes,
        SUM(CASE WHEN estado = 'JUSTIFICADO' THEN 1 ELSE 0 END) as justificados
      FROM asistencia
      WHERE estudiante_id = ? AND YEAR(fecha) = ?
      GROUP BY MONTH(fecha), DATE_FORMAT(fecha, '%M')
      ORDER BY MONTH(fecha)
    `, [estudiante_id, añoActual]);

    // Estadísticas por día de la semana
    const [estadisticasPorDia] = await pool.query(`
      SELECT 
        DAYNAME(fecha) as dia_semana,
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'PRESENTE' THEN 1 ELSE 0 END) as presentes,
        SUM(CASE WHEN estado = 'AUSENTE' THEN 1 ELSE 0 END) as ausentes,
        SUM(CASE WHEN estado = 'JUSTIFICADO' THEN 1 ELSE 0 END) as justificados
      FROM asistencia
      WHERE estudiante_id = ?
      GROUP BY DAYNAME(fecha)
      ORDER BY FIELD(DAYNAME(fecha), 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    `, [estudiante_id]);

    // Tendencia de los últimos 30 días
    const fechaHace30Dias = new Date();
    fechaHace30Dias.setDate(fechaHace30Dias.getDate() - 30);
    const fechaHace30DiasStr = fechaHace30Dias.toISOString().split('T')[0];

    const [tendencia30Dias] = await pool.query(`
      SELECT 
        DATE(fecha) as fecha,
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'PRESENTE' THEN 1 ELSE 0 END) as presentes,
        SUM(CASE WHEN estado = 'AUSENTE' THEN 1 ELSE 0 END) as ausentes
      FROM asistencia
      WHERE estudiante_id = ? AND fecha >= ?
      GROUP BY DATE(fecha)
      ORDER BY fecha DESC
      LIMIT 30
    `, [estudiante_id, fechaHace30DiasStr]);

    // Conteo total
    const [conteoTotal] = await pool.query(`
      SELECT 
        COUNT(*) as total_registros,
        MIN(fecha) as primera_fecha,
        MAX(fecha) as ultima_fecha
      FROM asistencia
      WHERE estudiante_id = ?
    `, [estudiante_id]);

    return res.json({
      ok: true,
      estudiante_id: estudiante_id,
      estadisticas: {
        por_mes: estadisticasPorMes,
        por_dia_semana: estadisticasPorDia,
        tendencia_30_dias: tendencia30Dias,
        totales: conteoTotal[0] || {
          total_registros: 0,
          primera_fecha: null,
          ultima_fecha: null
        }
      },
      año_actual: añoActual
    });

  } catch (error) {
    console.error("❌ Error obtenerEstadisticasDetalladas:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// 🔹 VERIFICAR ASISTENCIA DEL DÍA
exports.verificarAsistenciaHoy = async (req, res) => {
  try {
    const { estudiante_id } = req.params;
    const hoy = new Date().toISOString().split('T')[0];

    console.log('✅ Verificando asistencia de hoy:', { estudiante_id, hoy });

    if (!estudiante_id) {
      return res.status(400).json({
        ok: false,
        message: "Se requiere el ID del estudiante"
      });
    }

    const [asistenciaHoy] = await pool.query(`
      SELECT 
        id,
        fecha,
        hora_clase,
        estado,
        comentario_maestro,
        maestro_id
      FROM asistencia
      WHERE estudiante_id = ? AND fecha = ?
      ORDER BY hora_clase DESC
      LIMIT 1
    `, [estudiante_id, hoy]);

    const tieneAsistencia = asistenciaHoy.length > 0;

    return res.json({
      ok: true,
      estudiante_id: estudiante_id,
      fecha: hoy,
      tiene_asistencia: tieneAsistencia,
      asistencia: tieneAsistencia ? asistenciaHoy[0] : null,
      mensaje: tieneAsistencia 
        ? `Asistencia registrada: ${asistenciaHoy[0].estado}`
        : 'No hay asistencia registrada para hoy'
    });

  } catch (error) {
    console.error("❌ Error verificarAsistenciaHoy:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// 🔹 GENERAR REPORTE DE ASISTENCIA (JSON)
exports.generarReporteAsistencia = async (req, res) => {
  try {
    const { estudiante_id } = req.params;
    const { formato = 'json' } = req.query; // json, pdf, excel

    console.log('📥 Generando reporte para estudiante:', estudiante_id);

    if (!estudiante_id) {
      return res.status(400).json({
        ok: false,
        message: "Se requiere el ID del estudiante"
      });
    }

    // Obtener datos del estudiante
    const [estudianteData] = await pool.query(`
      SELECT 
        u.id,
        u.nino_nombre as nombre_estudiante,
        u.tutor_nombre as nombre_tutor,
        u.fecha_nacimiento,
        TIMESTAMPDIFF(YEAR, u.fecha_nacimiento, CURDATE()) as edad
      FROM usuarios u
      WHERE u.id = ?
    `, [estudiante_id]);

    if (estudianteData.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Estudiante no encontrado"
      });
    }

    const estudiante = estudianteData[0];

    // Obtener todas las asistencias
    const [asistencias] = await pool.query(`
      SELECT 
        a.*,
        m.admin_nombre as maestro_nombre,
        DATE_FORMAT(a.fecha, '%d/%m/%Y') as fecha_formateada
      FROM asistencia a
      LEFT JOIN administradores m ON m.id = a.maestro_id
      WHERE a.estudiante_id = ?
      ORDER BY a.fecha DESC
    `, [estudiante_id]);

    // Calcular estadísticas completas
    const [estadisticas] = await pool.query(`
      SELECT 
        COUNT(*) as total_registros,
        SUM(CASE WHEN estado = 'PRESENTE' THEN 1 ELSE 0 END) as presentes,
        SUM(CASE WHEN estado = 'AUSENTE' THEN 1 ELSE 0 END) as ausentes,
        SUM(CASE WHEN estado = 'JUSTIFICADO' THEN 1 ELSE 0 END) as justificados,
        MIN(fecha) as primera_asistencia,
        MAX(fecha) as ultima_asistencia,
        ROUND(
          (SUM(CASE WHEN estado IN ('PRESENTE', 'JUSTIFICADO') THEN 1 ELSE 0 END) / 
          GREATEST(COUNT(*), 1)) * 100, 2
        ) as porcentaje_asistencia
      FROM asistencia
      WHERE estudiante_id = ?
    `, [estudiante_id]);

    const reporte = {
      ok: true,
      reporte: {
        estudiante: estudiante,
        estadisticas: estadisticas[0] || {},
        asistencias: asistencias,
        total_asistencias: asistencias.length,
        fecha_generacion: new Date().toISOString(),
        formato: formato
      }
    };

    // Dependiendo del formato, devolver diferente respuesta
    if (formato.toLowerCase() === 'pdf') {
      // Aquí iría la lógica para generar PDF
      return res.json({
        ok: true,
        message: "Reporte PDF generado (simulado)",
        reporte: reporte,
        download_url: `/reportes/asistencia/${estudiante_id}/reporte.pdf`
      });
    } else if (formato.toLowerCase() === 'excel') {
      // Aquí iría la lógica para generar Excel
      return res.json({
        ok: true,
        message: "Reporte Excel generado (simulado)",
        reporte: reporte,
        download_url: `/reportes/asistencia/${estudiante_id}/reporte.xlsx`
      });
    } else {
      // JSON por defecto
      return res.json(reporte);
    }

  } catch (error) {
    console.error("❌ Error generarReporteAsistencia:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al generar reporte",
      error: error.message
    });
  }
};