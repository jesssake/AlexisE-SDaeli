const db = require('../../../config/dbConfig');

// ================== OBTENER ESTUDIANTES ==================
exports.getEstudiantes = async (req, res) => {
  try {
    const { maestro_id } = req.query;
    
    console.log('🔍 [Reportes] Buscando estudiantes para maestro_id:', maestro_id);

    // Todos los usuarios que tienen nino_nombre
    const [estudiantes] = await db.query(`
      SELECT 
        id, 
        nino_nombre as nombre
      FROM usuarios 
      WHERE nino_nombre IS NOT NULL 
        AND nino_nombre != ''
        AND TRIM(nino_nombre) != ''
      ORDER BY nino_nombre
    `);

    console.log(`👥 [Reportes] Encontrados ${estudiantes.length} estudiantes`);
    
    // Enviar respuesta directa
    res.json(estudiantes);

  } catch (error) {
    console.error('❌ [Reportes] Error en getEstudiantes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// ================== OBTENER REPORTES ==================
exports.getReportes = async (req, res) => {
  try {
    const { 
      maestroId: usuario_id,  
      tipo, 
      estado, 
      prioridad, 
      estudianteId: nino_id,
      resumen: includeSummary 
    } = req.query;

    console.log('🔍 [Reportes] getReportes llamado con:', {
      usuario_id,
      tipo,
      estado,
      prioridad,
      nino_id,
      includeSummary
    });

    // DEPURACIÓN: Ver todos los reportes sin filtro primero
    const [todosReportes] = await db.query(`SELECT COUNT(*) as total FROM reportes`);
    console.log('📋 [Reportes] Total reportes en BD:', todosReportes[0]?.total);

    // Construir query base - CORREGIDO: sin comentarios de línea (//)
    let sql = `
      SELECT 
        r.id,
        r.usuario_id,
        r.tipo,
        r.nino_id as estudianteId,
        u.nino_nombre as estudianteNombre,
        r.motivo,
        r.descripcion,
        r.estado,
        r.prioridad,
        DATE(r.fecha) as fecha,
        r.accionesTomadas
      FROM reportes r
      LEFT JOIN usuarios u ON r.nino_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Aplicar filtros - OPCIONAL: usuario_id es ahora opcional
    if (usuario_id && usuario_id !== 'todos' && usuario_id !== '') {
      sql += ' AND r.usuario_id = ?';
      params.push(usuario_id);
      console.log('🔍 [Reportes] Filtrando por usuario_id:', usuario_id);
    }
    
    if (tipo && tipo !== 'todos') {
      sql += ' AND r.tipo = ?';
      params.push(tipo);
    }
    if (estado && estado !== 'todos') {
      sql += ' AND r.estado = ?';
      params.push(estado);
    }
    if (prioridad && prioridad !== 'todos') {
      sql += ' AND r.prioridad = ?';
      params.push(prioridad);
    }
    if (nino_id && nino_id > 0) {
      sql += ' AND r.nino_id = ?';
      params.push(nino_id);
    }

    sql += ' ORDER BY r.fecha DESC';

    console.log('📋 [Reportes] SQL:', sql);
    console.log('📋 [Reportes] Params:', params);

    const [reportes] = await db.query(sql, params);

    console.log(`📊 [Reportes] Encontrados ${reportes.length} reportes`);
    
    // DEPURACIÓN: Mostrar distribución por usuario
    const distribucion = {};
    reportes.forEach(r => {
      distribucion[r.usuario_id] = (distribucion[r.usuario_id] || 0) + 1;
    });
    console.log('👥 [Reportes] Distribución por usuario_id:', distribucion);
    
    // Calcular resumen si se solicita
    let summary = null;
    if (includeSummary === '1' || includeSummary === 1 || includeSummary === 'true') {
      let summarySql = `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltos,
        SUM(CASE WHEN prioridad = 'alta' THEN 1 ELSE 0 END) as altaPrioridad
      FROM reportes 
      WHERE 1=1`;
      const summaryParams = [];
      
      if (usuario_id && usuario_id !== 'todos' && usuario_id !== '') {
        summarySql += ' AND usuario_id = ?';
        summaryParams.push(usuario_id);
      }
      
      const [summaryData] = await db.query(summarySql, summaryParams);

      summary = {
        total: summaryData[0]?.total || 0,
        pendientes: summaryData[0]?.pendientes || 0,
        resueltos: summaryData[0]?.resueltos || 0,
        altaPrioridad: summaryData[0]?.altaPrioridad || 0
      };
    }

    // Formatear datos para el frontend
    const formattedReportes = reportes.map(r => ({
      id: r.id,
      usuario_id: r.usuario_id,
      tipo: r.tipo,
      estudianteId: r.estudianteId,
      estudianteNombre: r.estudianteNombre || `Estudiante ID ${r.estudianteId}`,
      motivo: r.motivo,
      descripcion: r.descripcion,
      estado: r.estado,
      prioridad: r.prioridad,
      fecha: r.fecha,
      accionesTomadas: r.accionesTomadas || ''
    }));

    res.json({
      success: true,
      data: formattedReportes,
      summary: summary,
      debug: {
        totalEnBD: todosReportes[0]?.total,
        filtrados: reportes.length,
        distribucionPorUsuario: distribucion
      }
    });

  } catch (error) {
    console.error('❌ [Reportes] Error en getReportes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor: ' + error.message 
    });
  }
};

// ================== CREAR REPORTE ==================
exports.crearReporte = async (req, res) => {
  try {
    const {
      tipo,
      estudianteId: nino_id,
      motivo,
      descripcion,
      prioridad,
      maestroId: usuario_id
    } = req.body;

    console.log('📝 [Reportes] Creando reporte:', {
      tipo, nino_id, motivo, descripcion, prioridad, usuario_id
    });

    // Validar campos requeridos
    if (!tipo || !nino_id || !motivo || !descripcion || !prioridad || !usuario_id) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Insertar reporte
    const [result] = await db.query(`
      INSERT INTO reportes (
        usuario_id, 
        nino_id, 
        tipo, 
        estado, 
        prioridad, 
        motivo, 
        descripcion, 
        fecha
      ) VALUES (?, ?, ?, 'pendiente', ?, ?, ?, NOW())
    `, [usuario_id, nino_id, tipo, prioridad, motivo, descripcion]);

    console.log('✅ [Reportes] Reporte creado con ID:', result.insertId);

    res.json({
      success: true,
      message: 'Reporte creado exitosamente',
      id: result.insertId
    });

  } catch (error) {
    console.error('❌ [Reportes] Error creando reporte:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// ================== CAMBIAR ESTADO ==================
exports.cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, accionesTomadas } = req.body;

    console.log('🔄 [Reportes] Cambiando estado reporte ID:', id);

    if (!id || !estado) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere ID y estado'
      });
    }

    const [result] = await db.query(`
      UPDATE reportes 
      SET estado = ?, 
          accionesTomadas = ?
      WHERE id = ?
    `, [estado, accionesTomadas || '', id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    console.log('✅ [Reportes] Estado actualizado');

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ [Reportes] Error cambiando estado:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// ================== ELIMINAR REPORTE ==================
exports.eliminarReporte = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ [Reportes] Eliminando reporte ID:', id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID del reporte'
      });
    }

    const [result] = await db.query('DELETE FROM reportes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    console.log('✅ [Reportes] Reporte eliminado');

    res.json({
      success: true,
      message: 'Reporte eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ [Reportes] Error eliminando reporte:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// ================== EXPORTAR CSV ==================
exports.exportarCSV = async (req, res) => {
  try {
    const { 
      maestro_id, 
      estado, 
      tipo, 
      prioridad,
      sep = ';' 
    } = req.query;

    console.log('📤 [Reportes] Exportando CSV:', { maestro_id, estado, tipo, prioridad });

    // Construir query base
    let sql = `
      SELECT 
        r.id as "ID",
        r.usuario_id as "ID Maestro",
        u.nino_nombre as "Estudiante",
        r.tipo as "Tipo",
        r.estado as "Estado",
        r.prioridad as "Prioridad",
        r.motivo as "Motivo",
        r.descripcion as "Descripción",
        DATE(r.fecha) as "Fecha",
        r.accionesTomadas as "Acciones Tomadas"
      FROM reportes r
      LEFT JOIN usuarios u ON r.nino_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (maestro_id && maestro_id !== 'todos' && maestro_id !== '') {
      sql += ' AND r.usuario_id = ?';
      params.push(maestro_id);
    }
    if (estado && estado !== 'todos') {
      sql += ' AND r.estado = ?';
      params.push(estado);
    }
    if (tipo && tipo !== 'todos') {
      sql += ' AND r.tipo = ?';
      params.push(tipo);
    }
    if (prioridad && prioridad !== 'todos') {
      sql += ' AND r.prioridad = ?';
      params.push(prioridad);
    }

    sql += ' ORDER BY r.fecha DESC';

    const [reportes] = await db.query(sql, params);

    if (reportes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay reportes para exportar'
      });
    }

    // Convertir a CSV
    const headers = Object.keys(reportes[0]).join(sep);
    const rows = reportes.map(r => 
      Object.values(r).map(v => 
        typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
      ).join(sep)
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;

    // Configurar respuesta como archivo descargable
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=reportes.csv');
    res.send(csvContent);

    console.log(`✅ [Reportes] CSV exportado con ${reportes.length} registros`);

  } catch (error) {
    console.error('❌ [Reportes] Error exportando CSV:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// ================== SUBIR LOGO ==================
exports.uploadLogo = async (req, res) => {
  try {
    console.log('🖼️ [Reportes] Subiendo logo...');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ningún archivo'
      });
    }

    const logoUrl = `uploads/logos/${req.file.filename}`;

    console.log('✅ [Reportes] Logo subido:', logoUrl);

    res.json({
      success: true,
      data: {
        url: logoUrl
      },
      message: 'Logo subido exitosamente'
    });

  } catch (error) {
    console.error('❌ [Reportes] Error subiendo logo:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// ================== EXPORTAR A WORD ==================
exports.exportarWord = async (req, res) => {
  try {
    const {
      id,
      escuela,
      direccion,
      telefono,
      maestro,
      grupo,
      cita,
      folioN,
      logo,
      tipo,
      estudiante,
      prioridad,
      motivo,
      descripcion,
      estado,
      fecha,
      accionesTomadas
    } = req.query;

    console.log('📄 [Reportes] Exportando a Word, parámetros recibidos');

    // Datos para el documento
    const datos = {
      folio: `REP-${String(folioN || '0001').padStart(4, '0')}`,
      fechaDocumento: new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      escuela: escuela || 'COLEGIO NUEVOS HORIZONTES',
      direccion: direccion || 'Dirección no especificada',
      telefono: telefono || 'Teléfono no especificado',
      maestro: maestro || 'Maestro no especificado',
      grupo: grupo || 'Grupo no especificado',
      cita: cita ? new Date(cita).toLocaleString('es-MX') : 'No programada',
      estudiante: estudiante || 'Estudiante no especificado',
      tipo: tipo || 'Tipo no especificado',
      prioridad: prioridad || 'media',
      motivo: motivo || 'Motivo no especificado',
      descripcion: descripcion || 'Descripción no especificada',
      estado: estado || 'pendiente',
      fechaReporte: fecha || new Date().toISOString().split('T')[0],
      accionesTomadas: accionesTomadas || 'No se han tomado acciones aún',
      logoUrl: logo || ''
    };

    // Generar HTML para el documento
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte ${datos.folio}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .logo { max-height: 80px; }
          .folio { float: right; font-weight: bold; background: #f0f0f0; padding: 5px 10px; border-radius: 5px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #555; }
          .value { margin-bottom: 10px; }
          .signature { margin-top: 50px; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #f5f5f5; padding: 10px; text-align: left; border: 1px solid #ddd; }
          td { padding: 10px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          ${datos.logoUrl ? `<img src="http://localhost:3000/${datos.logoUrl}" class="logo" alt="Logo">` : ''}
          <h1>${datos.escuela}</h1>
          <p>${datos.direccion} | Tel: ${datos.telefono}</p>
          <div class="folio">Folio: ${datos.folio}</div>
        </div>
        
        <div class="section">
          <h2>Reporte de Incidencia</h2>
          <p><span class="label">Fecha del documento:</span> ${datos.fechaDocumento}</p>
          <p><span class="label">Maestro responsable:</span> ${datos.maestro}</p>
          <p><span class="label">Grupo:</span> ${datos.grupo}</p>
        </div>
        
        <div class="section">
          <h3>Datos del Estudiante</h3>
          <table>
            <tr><th>Estudiante:</th><td>${datos.estudiante}</td></tr>
            <tr><th>Tipo de reporte:</th><td>${datos.tipo}</td></tr>
            <tr><th>Prioridad:</th><td>${datos.prioridad}</td></tr>
            <tr><th>Estado:</th><td>${datos.estado}</td></tr>
            <tr><th>Fecha del reporte:</th><td>${datos.fechaReporte}</td></tr>
          </table>
        </div>
        
        <div class="section">
          <h3>Detalles del Reporte</h3>
          <p><span class="label">Motivo:</span> ${datos.motivo}</p>
          <p><span class="label">Descripción detallada:</span></p>
          <p class="value">${datos.descripcion}</p>
        </div>
        
        <div class="section">
          <h3>Acciones Tomadas</h3>
          <p class="value">${datos.accionesTomadas}</p>
        </div>
        
        <div class="section">
          <h3>Información de Cita</h3>
          <p><span class="label">Cita programada:</span> ${datos.cita}</p>
        </div>
        
        <div class="signature">
          <p>_________________________</p>
          <p>${datos.maestro}</p>
          <p>Maestro(a) responsable</p>
        </div>
      </body>
      </html>
    `;

    // Configurar respuesta como archivo descargable
    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-${datos.folio}.doc"`);
    res.send(htmlContent);

    console.log('✅ [Reportes] Documento Word generado:', datos.folio);

  } catch (error) {
    console.error('❌ [Reportes] Error exportando a Word:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// ================== DEBUG ==================
exports.debugInfo = async (req, res) => {
  try {
    const { maestro_id } = req.query;
    
    console.log('🐛 [Reportes] Debug info para maestro:', maestro_id);

    // Obtener información de debug
    const [usuarios] = await db.query(`
      SELECT id, nino_nombre, tutor_nombre, rol 
      FROM usuarios 
      WHERE nino_nombre IS NOT NULL 
      ORDER BY id
    `);

    const [reportesCount] = await db.query(`
      SELECT COUNT(*) as total 
      FROM reportes 
      WHERE 1=1 ${maestro_id ? ' AND usuario_id = ?' : ''}
    `, maestro_id ? [maestro_id] : []);

    const [tiposReporte] = await db.query(`
      SELECT DISTINCT tipo, COUNT(*) as cantidad 
      FROM reportes 
      WHERE 1=1 ${maestro_id ? ' AND usuario_id = ?' : ''}
      GROUP BY tipo
    `, maestro_id ? [maestro_id] : []);

    res.json({
      success: true,
      debug: {
        maestro_id: maestro_id || 'todos',
        total_usuarios: usuarios.length,
        total_reportes: reportesCount[0]?.total || 0,
        usuarios: usuarios.slice(0, 10),
        tipos_reporte: tiposReporte
      }
    });

  } catch (error) {
    console.error('❌ [Reportes] Error en debug:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error debug' 
    });
  }
};