// reportesController.js (para estudiantes) - VERSIÓN CORREGIDA
const db = require('../../../config/dbConfig');

// ================== DEPURACIÓN ==================
console.log('📋 [DEBUG] Controlador de reportes cargado - VERSIÓN CORREGIDA');
console.log('📋 [DEBUG] Ubicación: ' + __filename);
console.log('📋 [DEBUG] Base de datos disponible:', typeof db.query !== 'undefined');
console.log('📋 [DEBUG] Funciones disponibles:');
console.log('  - getReportesEstudiante (CORREGIDO)');
console.log('  - getResumenEstudiante (CORREGIDO)');
console.log('  - marcarComoLeido');
console.log('  - agregarObservacion');
console.log('  - exportarPDF (CORREGIDO)');
console.log('  - test');
console.log('  - verificarTabla');

// ================== OBTENER REPORTES DEL ESTUDIANTE (CORREGIDO) ==================
exports.getReportesEstudiante = async (req, res) => {
  try {
    const { 
      estudianteId, 
      tipo, 
      estado, 
      prioridad,
      mes,
      anio
    } = req.query;

    console.log('📋 [Reportes] Obteniendo reportes para estudiante:', estudianteId);
    console.log('📋 [Reportes] Filtros aplicados:', { tipo, estado, prioridad, mes, anio });

    if (!estudianteId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID del estudiante',
        debug: req.query
      });
    }

    // Verificar si existe el estudiante - CORREGIDO
    const [estudianteExiste] = await db.query(
      'SELECT id, nino_nombre, tutor_nombre, tutor_email FROM usuarios WHERE id = ?',
      [estudianteId]
    );

    if (!estudianteExiste[0]) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado',
        estudianteId
      });
    }

    console.log(`📋 [Reportes] Estudiante encontrado:`, estudianteExiste[0]);

    // Construir query CORREGIDA
    let sql = `
      SELECT 
        r.id,
        r.tipo,
        r.motivo,
        r.descripcion,
        r.estado,
        r.prioridad,
        DATE(r.fecha) as fecha,
        DATE(r.created_at) as fechaCreacion,
        -- CORREGIDO: usar tutor_nombre en lugar de nombre
        (SELECT tutor_nombre FROM usuarios WHERE id = r.usuario_id) as maestro_nombre,
        -- Obtener email del maestro también
        (SELECT tutor_email FROM usuarios WHERE id = r.usuario_id) as maestro_email,
        r.accionesTomadas,
        r.observaciones_alumno as observaciones,
        r.leido_por_alumno,
        r.fecha_leido,
        r.fecha_observacion
      FROM reportes r
      WHERE r.nino_id = ?
    `;
    
    const params = [estudianteId];

    // Aplicar filtros
    if (tipo && tipo !== 'todos' && tipo !== '') {
      sql += ' AND r.tipo = ?';
      params.push(tipo);
      console.log(`📋 [Reportes] Aplicando filtro tipo: ${tipo}`);
    }
    if (estado && estado !== 'todos' && estado !== '') {
      sql += ' AND r.estado = ?';
      params.push(estado);
      console.log(`📋 [Reportes] Aplicando filtro estado: ${estado}`);
    }
    if (prioridad && prioridad !== 'todos' && prioridad !== '') {
      sql += ' AND r.prioridad = ?';
      params.push(prioridad);
      console.log(`📋 [Reportes] Aplicando filtro prioridad: ${prioridad}`);
    }
    if (mes && mes !== '') {
      sql += ' AND MONTH(r.fecha) = ?';
      params.push(mes);
      console.log(`📋 [Reportes] Aplicando filtro mes: ${mes}`);
    }
    if (anio && anio !== '') {
      sql += ' AND YEAR(r.fecha) = ?';
      params.push(anio);
      console.log(`📋 [Reportes] Aplicando filtro año: ${anio}`);
    }

    sql += ' ORDER BY r.fecha DESC, r.id DESC';
    console.log(`📋 [Reportes] SQL:`, sql);
    console.log(`📋 [Reportes] Parámetros:`, params);

    const [reportes] = await db.query(sql, params);
    console.log(`📊 [Reportes] ${reportes.length} reportes encontrados para estudiante ${estudianteId}`);

    // Calcular resumen - CORREGIDO con 3 estados
    const summarySql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'revisado' THEN 1 ELSE 0 END) as revisados,
        SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltos,
        SUM(CASE WHEN prioridad = 'alta' THEN 1 ELSE 0 END) as altaPrioridad,
        SUM(CASE WHEN prioridad = 'media' THEN 1 ELSE 0 END) as mediaPrioridad,
        SUM(CASE WHEN prioridad = 'baja' THEN 1 ELSE 0 END) as bajaPrioridad,
        MAX(DATE(fecha)) as ultimoReporte
      FROM reportes 
      WHERE nino_id = ?
    `;
    
    const [summaryData] = await db.query(summarySql, [estudianteId]);

    const resumen = {
      total: summaryData[0]?.total || 0,
      pendientes: summaryData[0]?.pendientes || 0,
      revisados: summaryData[0]?.revisados || 0,
      resueltos: summaryData[0]?.resueltos || 0,
      altaPrioridad: summaryData[0]?.altaPrioridad || 0,
      mediaPrioridad: summaryData[0]?.mediaPrioridad || 0,
      bajaPrioridad: summaryData[0]?.bajaPrioridad || 0,
      ultimoReporte: summaryData[0]?.ultimoReporte || null,
      estudiante: {
        id: estudianteId,
        nombre: estudianteExiste[0].nino_nombre,
        tutor: estudianteExiste[0].tutor_nombre,
        email: estudianteExiste[0].tutor_email
      }
    };

    // Formatear reportes para frontend
    const reportesFormateados = reportes.map(reporte => {
      const tipoTraduccion = {
        'academico': 'Académico',
        'conducta': 'Conducta',
        'asistencia': 'Asistencia',
        'personal': 'Personal',
        'salud': 'Salud',
        'familiar': 'Familiar'
      };

      const estadoTraduccion = {
        'pendiente': 'Pendiente',
        'revisado': 'Revisado',
        'resuelto': 'Resuelto'
      };

      const prioridadTraduccion = {
        'alta': 'Alta',
        'media': 'Media',
        'baja': 'Baja'
      };

      return {
        ...reporte,
        tipo_texto: tipoTraduccion[reporte.tipo] || reporte.tipo,
        estado_texto: estadoTraduccion[reporte.estado] || reporte.estado,
        prioridad_texto: prioridadTraduccion[reporte.prioridad] || reporte.prioridad,
        maestro: reporte.maestro_nombre || 'Sistema',
        fecha_formateada: new Date(reporte.fecha).toLocaleDateString('es-MX'),
        leido: reporte.leido_por_alumno === 1
      };
    });

    res.json({
      success: true,
      reportes: reportesFormateados,
      resumen,
      estudiante: {
        id: estudianteId,
        nombre: estudianteExiste[0].nino_nombre,
        tutor: estudianteExiste[0].tutor_nombre,
        email: estudianteExiste[0].tutor_email
      }
    });

  } catch (error) {
    console.error('❌ [Reportes] Error obteniendo reportes:', error);
    console.error('❌ [Reportes] Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      sqlMessage: error.sqlMessage || 'No hay mensaje SQL',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ================== OBTENER RESUMEN DEL ESTUDIANTE (CORREGIDO) ==================
exports.getResumenEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.query;

    console.log('📊 [Reportes] Obteniendo resumen para estudiante:', estudianteId);

    if (!estudianteId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID del estudiante'
      });
    }

    // Verificar estudiante - CORREGIDO
    const [estudianteExiste] = await db.query(
      'SELECT id, nino_nombre, tutor_nombre FROM usuarios WHERE id = ?',
      [estudianteId]
    );

    if (!estudianteExiste[0]) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // CORREGIDO: Incluir estado 'revisado'
    const [summaryData] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'revisado' THEN 1 ELSE 0 END) as revisados,
        SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltos,
        SUM(CASE WHEN prioridad = 'alta' THEN 1 ELSE 0 END) as altaPrioridad,
        SUM(CASE WHEN prioridad = 'media' THEN 1 ELSE 0 END) as mediaPrioridad,
        SUM(CASE WHEN prioridad = 'baja' THEN 1 ELSE 0 END) as bajaPrioridad,
        MAX(DATE(fecha)) as ultimoReporte,
        GROUP_CONCAT(DISTINCT tipo) as tiposReporte
      FROM reportes 
      WHERE nino_id = ?
    `, [estudianteId]);

    const resumen = {
      total: summaryData[0]?.total || 0,
      pendientes: summaryData[0]?.pendientes || 0,
      revisados: summaryData[0]?.revisados || 0,
      resueltos: summaryData[0]?.resueltos || 0,
      altaPrioridad: summaryData[0]?.altaPrioridad || 0,
      mediaPrioridad: summaryData[0]?.mediaPrioridad || 0,
      bajaPrioridad: summaryData[0]?.bajaPrioridad || 0,
      ultimoReporte: summaryData[0]?.ultimoReporte,
      tiposReporte: summaryData[0]?.tiposReporte ? summaryData[0].tiposReporte.split(',') : [],
      estudiante: {
        id: estudianteId,
        nombre: estudianteExiste[0].nino_nombre,
        tutor: estudianteExiste[0].tutor_nombre
      }
    };

    console.log(`📊 [Reportes] Resumen obtenido:`, resumen);

    res.json({
      success: true,
      resumen
    });

  } catch (error) {
    console.error('❌ [Reportes] Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ================== MARCAR REPORTE COMO LEÍDO ==================
exports.marcarComoLeido = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`👁️ [Reportes] Marcando reporte ${id} como leído`);

    const [result] = await db.query(`
      UPDATE reportes 
      SET leido_por_alumno = 1, 
          fecha_leido = NOW()
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    console.log(`✅ [Reportes] Reporte ${id} marcado como leído`);

    res.json({
      success: true,
      message: 'Reporte marcado como leído',
      reporteId: id
    });

  } catch (error) {
    console.error('❌ [Reportes] Error marcando como leído:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ================== AGREGAR OBSERVACIÓN DEL ALUMNO ==================
exports.agregarObservacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body;

    console.log(`💬 [Reportes] Agregando observación al reporte ${id}:`, observacion);

    if (!observacion || observacion.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'La observación no puede estar vacía'
      });
    }

    const fechaObservacion = new Date().toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const observacionFormateada = `[${fechaObservacion}]: ${observacion.trim()}`;

    const [result] = await db.query(`
      UPDATE reportes 
      SET observaciones_alumno = CONCAT(COALESCE(observaciones_alumno, ''), '\\n', ?),
          fecha_observacion = NOW()
      WHERE id = ?
    `, [observacionFormateada, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    console.log(`✅ [Reportes] Observación agregada al reporte ${id}`);

    res.json({
      success: true,
      message: 'Observación agregada exitosamente',
      reporteId: id,
      observacion: observacionFormateada
    });

  } catch (error) {
    console.error('❌ [Reportes] Error agregando observación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ================== EXPORTAR A PDF (CORREGIDO) ==================
exports.exportarPDF = async (req, res) => {
  try {
    const { estudianteId } = req.query;

    console.log(`📄 [Reportes] Exportando PDF para estudiante: ${estudianteId}`);

    if (!estudianteId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID del estudiante'
      });
    }

    // Obtener datos del estudiante
    const [estudianteData] = await db.query(`
      SELECT 
        u.nino_nombre as nombre,
        u.tutor_nombre as tutor,
        u.tutor_telefono as telefono,
        u.tutor_email as email
      FROM usuarios u
      WHERE u.id = ?
    `, [estudianteId]);

    if (!estudianteData[0]) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // Obtener reportes - CORREGIDO
    const [reportes] = await db.query(`
      SELECT 
        r.id,
        r.tipo,
        r.motivo,
        r.descripcion,
        r.estado,
        r.prioridad,
        DATE(r.fecha) as fecha,
        -- CORREGIDO: usar tutor_nombre
        (SELECT tutor_nombre FROM usuarios WHERE id = r.usuario_id) as maestro,
        r.accionesTomadas,
        r.observaciones_alumno as observaciones
      FROM reportes r
      WHERE r.nino_id = ?
      ORDER BY r.fecha DESC
    `, [estudianteId]);

    console.log(`📄 [Reportes] ${reportes.length} reportes para exportar`);

    // Traducciones para el PDF
    const tipoTraduccion = {
      'academico': 'Académico',
      'conducta': 'Conducta',
      'asistencia': 'Asistencia',
      'personal': 'Personal',
      'salud': 'Salud',
      'familiar': 'Familiar'
    };

    const estadoTraduccion = {
      'pendiente': 'Pendiente',
      'revisado': 'Revisado',
      'resuelto': 'Resuelto'
    };

    const prioridadTraduccion = {
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja'
    };

    // Generar HTML para PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reportes del Estudiante - ${estudianteData[0].nombre}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .info-estudiante { 
            margin-bottom: 30px; 
            padding: 15px; 
            background: #f5f5f5; 
            border-radius: 5px;
            border-left: 4px solid #3498db;
          }
          .reporte { 
            margin-bottom: 20px; 
            padding: 15px; 
            border: 1px solid #ddd; 
            border-radius: 5px;
            page-break-inside: avoid;
          }
          .reporte.pendiente { border-left: 5px solid #f39c12; }
          .reporte.revisado { border-left: 5px solid #3498db; }
          .reporte.resuelto { border-left: 5px solid #27ae60; }
          .reporte.alta { border-left: 5px solid #e74c3c; }
          .label { font-weight: bold; color: #555; }
          .badge { 
            display: inline-block; 
            padding: 3px 8px; 
            border-radius: 3px; 
            font-size: 12px; 
            color: white; 
            margin-right: 5px;
          }
          .badge.academico { background: #3498db; }
          .badge.conducta { background: #9b59b6; }
          .badge.asistencia { background: #e67e22; }
          .badge.personal { background: #1abc9c; }
          .badge.salud { background: #e74c3c; }
          .badge.familiar { background: #34495e; }
          .badge.pendiente { background: #f39c12; }
          .badge.revisado { background: #3498db; }
          .badge.resuelto { background: #27ae60; }
          .badge.alta { background: #e74c3c; }
          .badge.media { background: #f39c12; }
          .badge.baja { background: #27ae60; }
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            font-size: 12px; 
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .resumen {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border: 1px solid #dee2e6;
          }
          .resumen-item {
            display: inline-block;
            margin-right: 20px;
            font-size: 14px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Reportes del Estudiante</h1>
          <h2>${estudianteData[0].nombre}</h2>
          <p>Generado el: ${new Date().toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        
        <div class="info-estudiante">
          <h3>👤 Información del Estudiante</h3>
          <p><span class="label">Nombre:</span> ${estudianteData[0].nombre}</p>
          <p><span class="label">Tutor:</span> ${estudianteData[0].tutor || 'No especificado'}</p>
          <p><span class="label">Teléfono:</span> ${estudianteData[0].telefono || 'No especificado'}</p>
          <p><span class="label">Email:</span> ${estudianteData[0].email || 'No especificado'}</p>
        </div>
        
        <div class="resumen">
          <h3>📊 Resumen General</h3>
          <div class="resumen-item"><strong>Total reportes:</strong> ${reportes.length}</div>
          <div class="resumen-item"><strong>Pendientes:</strong> ${reportes.filter(r => r.estado === 'pendiente').length}</div>
          <div class="resumen-item"><strong>Revisados:</strong> ${reportes.filter(r => r.estado === 'revisado').length}</div>
          <div class="resumen-item"><strong>Resueltos:</strong> ${reportes.filter(r => r.estado === 'resuelto').length}</div>
          <div class="resumen-item"><strong>Alta prioridad:</strong> ${reportes.filter(r => r.prioridad === 'alta').length}</div>
        </div>
        
        <h2>📋 Reportes (${reportes.length})</h2>
        
        ${reportes.length > 0 ? reportes.map((r, i) => `
          <div class="reporte ${r.estado} ${r.prioridad === 'alta' ? 'alta' : ''}">
            <h3>Reporte #${i + 1} - <span class="badge ${r.tipo}">${tipoTraduccion[r.tipo] || r.tipo.toUpperCase()}</span></h3>
            <p><span class="label">ID:</span> ${r.id}</p>
            <p><span class="label">Fecha:</span> ${new Date(r.fecha).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
            <p><span class="label">Maestro:</span> ${r.maestro || 'No especificado'}</p>
            <p><span class="label">Estado:</span> <span class="badge ${r.estado}">${estadoTraduccion[r.estado] || r.estado}</span></p>
            <p><span class="label">Prioridad:</span> <span class="badge ${r.prioridad}">${prioridadTraduccion[r.prioridad] || r.prioridad}</span></p>
            <p><span class="label">Motivo:</span> ${r.motivo || 'No especificado'}</p>
            <p><span class="label">Descripción:</span> ${r.descripcion || 'No especificada'}</p>
            ${r.accionesTomadas ? `<p><span class="label">Acciones tomadas:</span> ${r.accionesTomadas}</p>` : ''}
            ${r.observaciones ? `<p><span class="label">Observaciones:</span> <br>${r.observaciones.replace(/\\n/g, '<br>')}</p>` : ''}
          </div>
        `).join('') : '<p style="text-align: center; color: #777; padding: 40px;">🎉 No hay reportes registrados para este estudiante.</p>'}
        
        <div class="footer">
          <p><strong>🏫 COLEGIO NUEVOS HORIZONTES</strong></p>
          <p>Sistema de Gestión Educativa - Módulo de Reportes</p>
          <p>📞 Contacto: administracion@colegionuevoshorizontes.edu.mx</p>
          <p class="no-print">⚠️ Este documento fue generado automáticamente. Para imprimir, use Ctrl+P.</p>
        </div>
      </body>
      </html>
    `;

    // Configurar respuesta como archivo descargable
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="reportes-${estudianteData[0].nombre.replace(/\s+/g, '-').toLowerCase()}-${new Date().getTime()}.html"`);
    res.send(htmlContent);

    console.log(`✅ [Reportes] PDF exportado para ${estudianteData[0].nombre}`);

  } catch (error) {
    console.error('❌ [Reportes] Error exportando PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ================== RUTA DE PRUEBA ==================
exports.test = (req, res) => {
  console.log('🧪 [Reportes] Endpoint de prueba accedido');
  
  res.json({
    success: true,
    message: '✅ Módulo de reportes para alumnos funcionando (VERSIÓN CORREGIDA)',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    availableEndpoints: {
      reportes: 'GET /api/reportes-alumno?estudianteId=ID',
      reportesCompatible: 'GET /api/estudiante/reportes?estudianteId=ID',
      resumen: 'GET /api/reportes-alumno/resumen?estudianteId=ID',
      marcarLeido: 'POST /api/reportes-alumno/:id/leido',
      agregarObservacion: 'POST /api/reportes-alumno/:id/observacion',
      exportarPDF: 'GET /api/reportes-alumno/exportar/pdf?estudianteId=ID',
      test: 'GET /api/reportes-alumno/test'
    },
    correcciones: [
      '✅ Corregido: u.nombre → tutor_nombre',
      '✅ Incluido estado "revisado"',
      '✅ Todas las consultas SQL corregidas',
      '✅ Manejo de 6 tipos de reportes'
    ],
    debug: {
      controladorCargado: true,
      dbConfig: typeof db !== 'undefined',
      archivo: __filename,
      fecha: new Date().toLocaleString('es-MX')
    }
  });
};

// ================== VERIFICAR TABLA REPORTES ==================
exports.verificarTabla = async (req, res) => {
  try {
    console.log('🔍 [Reportes] Verificando tabla de reportes...');
    
    // Verificar si la tabla reportes existe
    const [tablas] = await db.query(`
      SHOW TABLES LIKE 'reportes'
    `);
    
    const tablaExiste = tablas.length > 0;
    
    if (tablaExiste) {
      // Obtener estructura de la tabla
      const [estructura] = await db.query(`
        DESCRIBE reportes
      `);
      
      // Contar reportes totales
      const [conteo] = await db.query(`
        SELECT COUNT(*) as total FROM reportes
      `);
      
      res.json({
        success: true,
        tablaExiste: true,
        estructura,
        totalReportes: conteo[0]?.total || 0,
        mensaje: '✅ Tabla reportes verificada correctamente'
      });
    } else {
      res.json({
        success: false,
        tablaExiste: false,
        mensaje: '❌ La tabla "reportes" no existe en la base de datos',
        solucion: 'Ejecutar el script de creación de tabla reportes'
      });
    }
    
  } catch (error) {
    console.error('❌ [Reportes] Error verificando tabla:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error verificando tabla de reportes',
      error: error.message
    });
  }
};