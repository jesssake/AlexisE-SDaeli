// C:\Codigos\HTml\gestion-educativa\backend\controllers\maestro\graduacion\graduacionController.js
const pool = require('../../../config/dbConfig');
const fs = require('fs').promises;
const path = require('path');
const { limpiarTextoWinAnsi, limpiarTextoMayusculas, limpiarNombrePropio } = require('../../../utils/pdfUtils');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// ========================================
// FUNCIÓN PARA GENERAR PDF
// ========================================
async function generarPDFCertificadoCompleto(certificado, alumno_nombre) {
  try {
    // LIMPIAR TEXTOS PRIMERO
    const nombreLimpio = limpiarTextoMayusculas(alumno_nombre);
    const cicloLimpio = limpiarTextoWinAnsi(certificado.ciclo || '2025-2026');
    const maestroLimpio = limpiarNombrePropio(certificado.maestro_firma || 'Director(a)');
    
    console.log('📝 [PDF MAESTRO] Textos limpios:', {
      nombre: nombreLimpio,
      ciclo: cicloLimpio,
      maestro: maestroLimpio,
      promedio: certificado.promedio
    });

    // Ruta de la plantilla
    const templatePath = path.join(__dirname, '../../../../frontend/src/assets/certificado-graduacion.pdf');
    
    // Verificar si existe la plantilla
    let existingPdfBytes;
    try {
      existingPdfBytes = await fs.readFile(templatePath);
      console.log('✅ Plantilla PDF cargada exitosamente');
    } catch (error) {
      console.warn('⚠️ Plantilla no encontrada, creando PDF desde cero');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      existingPdfBytes = await pdfDoc.save();
    }
    
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Obtener la primera página
    const pages = pdfDoc.getPages();
    const page = pages[0] || pdfDoc.addPage();
    
    const { width, height } = page.getSize();
    const centerX = width / 2;
    
    console.log('📏 Dimensiones del PDF:', { width, height });
    
    // Fuentes
    const fontItalica = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const negro = rgb(0, 0, 0);
    const azul = rgb(0.2, 0.3, 0.8);
    
    // 1. Título
    const titulo = "CERTIFICADO DE EXCELENCIA ACADÉMICA";
    const tituloWidth = fontBold.widthOfTextAtSize(titulo, 18);
    page.drawText(titulo, {
      x: centerX - tituloWidth / 2,
      y: height - 80,
      size: 18,
      font: fontBold,
      color: azul
    });
    
    // 2. Nombre del alumno
    const fontSizeNombre = 24;
    const nombreWidth = fontItalica.widthOfTextAtSize(nombreLimpio, fontSizeNombre);
    page.drawText(nombreLimpio, {
      x: centerX - nombreWidth / 2,
      y: height - 140,
      size: fontSizeNombre,
      font: fontItalica,
      color: negro
    });
    
    // 3. Texto de reconocimiento
    const textoReconocimiento = "Por su destacado desempeño académico durante el ciclo escolar";
    const textoWidth = fontItalica.widthOfTextAtSize(textoReconocimiento, 12);
    page.drawText(textoReconocimiento, {
      x: centerX - textoWidth / 2,
      y: height - 180,
      size: 12,
      font: fontItalica,
      color: negro
    });
    
    // 4. Ciclo escolar
    const cicloWidth = fontBold.widthOfTextAtSize(cicloLimpio, 14);
    page.drawText(cicloLimpio, {
      x: centerX - cicloWidth / 2,
      y: height - 210,
      size: 14,
      font: fontBold,
      color: negro
    });
    
    // 5. Promedio
    const promedioTexto = `Con un promedio de ${parseFloat(certificado.promedio).toFixed(2)}`;
    const promedioWidth = fontItalica.widthOfTextAtSize(promedioTexto, 12);
    page.drawText(promedioTexto, {
      x: centerX - promedioWidth / 2,
      y: height - 240,
      size: 12,
      font: fontItalica,
      color: negro
    });
    
    // 6. Firma del maestro
    const maestroWidth = fontItalica.widthOfTextAtSize(maestroLimpio, 11);
    page.drawText(maestroLimpio, {
      x: width - 200 - (maestroWidth > 150 ? 0 : 0),
      y: height - 300,
      size: 11,
      font: fontItalica,
      color: negro
    });
    
    // Línea para firma
    page.drawLine({
      start: { x: width - 250, y: height - 320 },
      end: { x: width - 100, y: height - 320 },
      thickness: 1,
      color: negro
    });
    
    // Texto "Firma del Director"
    const firmaTexto = "Firma del Director";
    const firmaWidth = fontItalica.widthOfTextAtSize(firmaTexto, 10);
    page.drawText(firmaTexto, {
      x: width - 200 - firmaWidth / 2,
      y: height - 340,
      size: 10,
      font: fontItalica,
      color: negro
    });
    
    // 7. Fecha de emisión
    const fecha = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const fechaLimpia = limpiarTextoWinAnsi(fecha);
    const fechaTexto = `Expedido el ${fechaLimpia}`;
    page.drawText(fechaTexto, {
      x: 50,
      y: 80,
      size: 10,
      font: fontItalica,
      color: negro
    });
    
    // 8. Folio
    const folio = `FOLIO: CERT-${String(certificado.id).padStart(4, '0')}`;
    const folioLimpio = limpiarTextoWinAnsi(folio);
    page.drawText(folioLimpio, {
      x: 50,
      y: 60,
      size: 9,
      font: fontItalica,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    console.log('✅ PDF generado exitosamente');
    return await pdfDoc.save();
    
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    throw error;
  }
}

// =============================
// POST - Crear nuevo certificado (VERSIÓN CON GUARDADO DE PDF)
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
    
    // Verificar que el alumno existe
    const [alumnoCheck] = await pool.query(
      'SELECT id, nino_nombre FROM usuarios WHERE id = ?',
      [alumno_id]
    );
    
    if (alumnoCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El alumno seleccionado no existe'
      });
    }
    
    const alumno = alumnoCheck[0];
    
    // Limpiar textos antes de guardar
    const cicloLimpio = limpiarTextoWinAnsi(ciclo);
    const maestroFirmaLimpia = limpiarNombrePropio(maestro_firma);
    
    // Insertar certificado
    const [result] = await pool.query(`
      INSERT INTO certificados 
        (alumno_id, maestro_id, promedio, ciclo, maestro_firma, estado) 
      VALUES (?, ?, ?, ?, ?, 'pendiente')
    `, [alumno_id, maestro_id, promedio, cicloLimpio, maestroFirmaLimpia]);

    const certificadoId = result.insertId;
    console.log(`✅ Certificado creado con ID: ${certificadoId}`);
    
    // ========================================
    // GENERAR Y GUARDAR EL PDF
    // ========================================
    try {
      console.log('📄 Generando PDF para el certificado...');
      
      // Crear objeto certificado para el PDF
      const certificadoPDF = {
        id: certificadoId,
        alumno_id: alumno_id,
        alumno_nombre: alumno.nino_nombre,
        promedio: promedio,
        ciclo: cicloLimpio,
        maestro_firma: maestroFirmaLimpia,
        estado: 'pendiente'
      };
      
      // Generar PDF
      const pdfBytes = await generarPDFCertificadoCompleto(certificadoPDF, alumno.nino_nombre);
      
      // Guardar PDF en disco
      const uploadDir = path.join(__dirname, '../../../../uploads/certificados');
      
      // Crear directorio si no existe
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        console.log('📁 Directorio de uploads creado/verificado:', uploadDir);
      } catch (err) {
        console.log('📁 Directorio ya existe o error:', err.message);
      }
      
      const fileName = `certificado_${certificadoId}_${Date.now()}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      
      await fs.writeFile(filePath, pdfBytes);
      console.log('✅ PDF guardado en:', filePath);
      
      // Actualizar BD con la ruta del archivo
      await pool.query(
        'UPDATE certificados SET archivo_pdf = ? WHERE id = ?',
        [fileName, certificadoId]
      );
      console.log('✅ Ruta del PDF actualizada en BD');
      
    } catch (pdfError) {
      console.error('❌ Error guardando PDF:', pdfError);
      // No fallamos la creación del certificado si falla el PDF
    }
    
    // Intentar actualizar configuración
    try {
      await pool.query(`
        INSERT INTO configuracion 
          (maestro_id, ciclo_actual, nombre_maestro_firma, ultimo_alumno_id, actualizado_en) 
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          ciclo_actual = VALUES(ciclo_actual),
          nombre_maestro_firma = VALUES(nombre_maestro_firma),
          ultimo_alumno_id = VALUES(ultimo_alumno_id),
          actualizado_en = NOW()
      `, [maestro_id, cicloLimpio, maestroFirmaLimpia, alumno_id]);
      
      console.log('✅ Configuración actualizada');
    } catch (configError) {
      console.log('⚠️ No se pudo actualizar configuración:', configError.message);
    }
    
    res.json({
      success: true,
      message: 'Certificado creado exitosamente',
      certificado_id: certificadoId
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
// 🔥 NUEVO: Guardar certificado con PDF (multipart/form-data)
// =============================
const guardarCertificadoConPDF = async (req, res) => {
  try {
    const { maestro_id } = req.params;
    const { alumno_id, promedio, ciclo, maestro_firma } = req.body;
    
    // Verificar que se recibió el archivo PDF
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'El archivo PDF es requerido'
      });
    }
    
    console.log(`📥 [MAESTRO] Guardando certificado con PDF para maestro ${maestro_id}`);
    console.log(`📦 Datos:`, { alumno_id, promedio, ciclo, maestro_firma });
    
    // Validaciones
    if (!alumno_id || !promedio || !ciclo || !maestro_firma) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {}
      
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }
    
    if (promedio < 0 || promedio > 10) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {}
      
      return res.status(400).json({
        success: false,
        message: 'El promedio debe estar entre 0 y 10'
      });
    }
    
    // Verificar que el alumno existe
    const [alumnoCheck] = await pool.query(
      'SELECT id, nino_nombre FROM usuarios WHERE id = ?',
      [alumno_id]
    );
    
    if (alumnoCheck.length === 0) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {}
      
      return res.status(400).json({
        success: false,
        message: 'El alumno seleccionado no existe'
      });
    }
    
    const alumno = alumnoCheck[0];
    
    // Limpiar textos
    const cicloLimpio = limpiarTextoWinAnsi(ciclo);
    const maestroFirmaLimpia = limpiarNombrePropio(maestro_firma);
    
    // Insertar certificado en BD (con archivo_pdf temporal)
    const [result] = await pool.query(`
      INSERT INTO certificados 
        (alumno_id, maestro_id, promedio, ciclo, maestro_firma, estado, archivo_pdf) 
      VALUES (?, ?, ?, ?, ?, 'pendiente', ?)
    `, [alumno_id, maestro_id, promedio, cicloLimpio, maestroFirmaLimpia, req.file.filename]);
    
    const certificadoId = result.insertId;
    
    // Renombrar archivo con el ID del certificado
    const oldPath = req.file.path;
    const newFileName = `certificado_${certificadoId}.pdf`;
    const newPath = path.join(path.dirname(oldPath), newFileName);
    
    try {
      await fs.rename(oldPath, newPath);
      console.log(`✅ Archivo renombrado a: ${newFileName}`);
    } catch (renameError) {
      console.error(`❌ Error renombrando archivo:`, renameError);
      await fs.copyFile(oldPath, newPath);
      await fs.unlink(oldPath);
    }
    
    // Actualizar BD con el nuevo nombre
    await pool.query(
      'UPDATE certificados SET archivo_pdf = ? WHERE id = ?',
      [newFileName, certificadoId]
    );
    
    console.log(`✅ Certificado ${certificadoId} guardado con PDF: ${newFileName}`);
    
    // Actualizar configuración
    try {
      await pool.query(`
        INSERT INTO configuracion 
          (maestro_id, ciclo_actual, nombre_maestro_firma, ultimo_alumno_id, actualizado_en) 
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          ciclo_actual = VALUES(ciclo_actual),
          nombre_maestro_firma = VALUES(nombre_maestro_firma),
          ultimo_alumno_id = VALUES(ultimo_alumno_id),
          actualizado_en = NOW()
      `, [maestro_id, cicloLimpio, maestroFirmaLimpia, alumno_id]);
      
      console.log('✅ Configuración actualizada');
    } catch (configError) {
      console.log('⚠️ No se pudo actualizar configuración:', configError.message);
    }
    
    res.json({
      success: true,
      message: 'Certificado creado exitosamente',
      certificado_id: certificadoId,
      archivo_pdf: newFileName
    });
    
  } catch (error) {
    console.error('❌ Error en guardarCertificadoConPDF:', error);
    
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {}
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al guardar certificado',
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
// DELETE - Eliminar certificado (elimina también el PDF)
// =============================
const eliminarCertificado = async (req, res) => {
  try {
    const { certificado_id } = req.params;
    
    console.log(`🗑️ Eliminando certificado ID: ${certificado_id}`);

    const [certificado] = await pool.query(
      'SELECT archivo_pdf FROM certificados WHERE id = ?',
      [certificado_id]
    );
    
    if (certificado.length > 0 && certificado[0].archivo_pdf) {
      const uploadDir = path.join(__dirname, '../../../../uploads/certificados');
      const filePath = path.join(uploadDir, certificado[0].archivo_pdf);
      
      try {
        await fs.unlink(filePath);
        console.log('🗑️ Archivo PDF eliminado:', filePath);
      } catch (err) {
        console.log('⚠️ No se pudo eliminar el archivo PDF:', err.message);
      }
    }

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
// GET - Listar certificados (incluye archivo_pdf)
// =============================
const listarCertificados = async (req, res) => {
  try {
    const { maestro_id } = req.params;
    const { tipo, estado, alumnoId } = req.query;
    
    console.log('📜 Listando certificados para maestro:', maestro_id);
    
    let query = `
      SELECT 
        c.id,
        c.alumno_id,
        u.nino_nombre AS alumno_nombre,
        c.promedio,
        c.ciclo,
        c.maestro_firma,
        COALESCE(c.estado, 'pendiente') AS estado,
        c.archivo_pdf,
        DATE_FORMAT(c.creado_en, '%Y-%m-%d %H:%i') AS fecha_creacion,
        DATE_FORMAT(c.creado_en, '%d/%m/%Y') AS fecha_formateada
      FROM certificados c
      LEFT JOIN usuarios u ON c.alumno_id = u.id
      WHERE c.maestro_id = ?
    `;
    
    const params = [maestro_id];
    
    if (tipo && tipo !== 'todos') {
      query += ` AND c.tipo = ?`;
      params.push(tipo);
    }
    
    if (estado && estado !== 'todos') {
      query += ` AND c.estado = ?`;
      params.push(estado);
    }
    
    if (alumnoId && alumnoId > 0) {
      query += ` AND c.alumno_id = ?`;
      params.push(alumnoId);
    }
    
    query += ` ORDER BY c.creado_en DESC`;

    const [rows] = await pool.query(query, params);

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
// GET - Obtener alumnos
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
// GET - Obtener configuración
// =============================
const getConfiguracion = async (req, res) => {
  try {
    const { maestro_id } = req.params;
    
    console.log('⚙️ Obteniendo configuración para maestro:', maestro_id);
    
    try {
      const [rows] = await pool.query(`
        SELECT 
          ciclo_actual,
          nombre_maestro_firma
        FROM configuracion 
        WHERE maestro_id = ?
      `, [maestro_id]);

      if (rows.length === 0) {
        console.log('⚠️ Configuración no encontrada');
        return res.json({
          ciclo_actual: '2025-2026',
          nombre_maestro_firma: 'Juan Perez'
        });
      }

      const config = rows[0];
      config.nombre_maestro_firma = limpiarNombrePropio(config.nombre_maestro_firma);
      
      console.log('✅ Configuración encontrada:', config);
      res.json(config);
      
    } catch (tableError) {
      console.log('⚠️ Tabla configuracion no existe, usando valores por defecto');
      res.json({
        ciclo_actual: '2025-2026',
        nombre_maestro_firma: 'Juan Perez'
      });
    }
    
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
// EXPORTACIÓN CORRECTA
// =============================
module.exports = {
  getAlumnos,
  getConfiguracion,
  crearCertificado,
  listarCertificados,
  getEstadisticas,
  cambiarEstado,
  eliminarCertificado,
  guardarCertificadoConPDF  // 🔥 NUEVA FUNCIÓN
};