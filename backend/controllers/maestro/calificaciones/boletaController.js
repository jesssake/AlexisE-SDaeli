const db = require('../../../config/dbConfig');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// =======================================
// Helper: limpiar texto para PDF
// =======================================
function cleanText(text) {
  if (!text) return '';
  let s = text.toString();

  // Si viene ya con � (0xFFFD), lo quitamos
  s = s.replace(/\uFFFD/g, '');

  // Quitar acentos (á -> a, ñ -> n, etc.)
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Opcional: quitar cualquier carácter no ASCII básico
  s = s.replace(/[^\x20-\x7E]/g, '');

  return s;
}

// ================================================================
// GENERAR BOLETA POR ALUMNO
// ================================================================
exports.generarBoleta = async (req, res) => {
  try {
    const { alumno_id, trimestre_id, escuela, logoBase64 } = req.body;

    if (!alumno_id || !trimestre_id) {
      return res.status(400).json({ ok: false, mensaje: "Datos insuficientes" });
    }

    // ---------------------------------
    // Datos del alumno
    // ---------------------------------
    const [alumno] = await db.query(`
      SELECT id AS id_nino, nino_nombre AS nombre_alumno, tutor_nombre
      FROM usuarios
      WHERE id = ?
    `, [alumno_id]);

    if (!alumno.length) {
      return res.status(404).json({ ok: false, mensaje: "Alumno no encontrado" });
    }

    const info = alumno[0];

    // Limpiar textos para PDF
    const nombreAlumnoPDF = cleanText(info.nombre_alumno);
    const nombreTutorPDF  = cleanText(info.tutor_nombre);
    const escuelaPDF      = cleanText(escuela || "Mi Escuela");

    // ---------------------------------
    // Calificaciones del trimestre
    // ---------------------------------
    const [tareas] = await db.query(`
      SELECT 
        t.titulo AS titulo_tarea,
        e.calificacion,
        COALESCE(c.porcentaje, 0) AS porcentaje
      FROM entregas_tareas e
      INNER JOIN tareas t ON t.id_tarea = e.id_tarea
      LEFT JOIN calificaciones_trimestre c 
        ON c.estudiante_id = e.estudiante_id 
       AND c.tarea_id = e.id_tarea
       AND c.trimestre_id = ?
      WHERE e.estudiante_id = ?
    `, [trimestre_id, alumno_id]);

    // ---------------------------------
    // Calcular promedio
    // ---------------------------------
    let sumaPonderada = 0;
    let sumaPorcentaje = 0;

    tareas.forEach((t) => {
      const porc = t.porcentaje || 0;
      sumaPonderada += t.calificacion * porc;
      sumaPorcentaje += porc;
    });

    let promedio = 0;
    if (tareas.length > 0) {
      if (sumaPorcentaje > 0) {
        promedio = sumaPonderada / sumaPorcentaje;
      } else {
        promedio =
          tareas.reduce((acc, t) => acc + t.calificacion, 0) / tareas.length;
      }
    }

    promedio = Number(promedio.toFixed(2));

    // ============================================================
    // CREAR PDF
    // ============================================================
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // Carta
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // Fondo
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 595,
      height: 842,
      color: rgb(1, 1, 1),
    });

    let y = 780;

    // ------------------------------
    // LOGO (opcional)
    // ------------------------------
    if (logoBase64) {
      try {
        const logoBytes = Buffer.from(logoBase64.split(',')[1], 'base64');
        const image = await pdf.embedPng(logoBytes);
        const width = 120;
        const height = (image.height / image.width) * 120;

        page.drawImage(image, {
          x: 40,
          y: 720,
          width,
          height,
        });
      } catch (e) {
        console.warn('No se pudo incrustar el logo en la boleta:', e.message);
      }
    }

    // ------------------------------
    // TÍTULO
    // ------------------------------
    page.drawText(escuelaPDF, {
      x: 200,
      y: 780,
      size: 22,
      font: bold,
      color: rgb(0, 0, 0),
    });

    page.drawText('Boleta de Evaluacion', {
      x: 200,
      y: 750,
      size: 16,
      font: bold,
      color: rgb(0, 0, 0),
    });

    // ------------------------------
    // Datos del alumno
    // ------------------------------
    page.drawText(`Alumno: ${nombreAlumnoPDF}`, {
      x: 40,
      y: 680,
      size: 14,
      font,
    });
    page.drawText(`Tutor: ${nombreTutorPDF}`, {
      x: 40,
      y: 655,
      size: 14,
      font,
    });
    page.drawText(`Trimestre: ${trimestre_id}`, {
      x: 40,
      y: 630,
      size: 14,
      font,
    });
    page.drawText(`Promedio Final: ${promedio}`, {
      x: 40,
      y: 605,
      size: 14,
      font: bold,
    });

    // ------------------------------
    // Encabezados tabla
    // ------------------------------
    y = 560;
    page.drawText('Tarea', { x: 40, y, size: 12, font: bold });
    page.drawText('Calificacion', { x: 250, y, size: 12, font: bold });
    page.drawText('%', { x: 400, y, size: 12, font: bold });
    y -= 25;

    // ------------------------------
    // Filas de tareas
    // ------------------------------
    tareas.forEach((t) => {
      const tituloPDF = cleanText(t.titulo_tarea);

      page.drawText(tituloPDF, { x: 40, y, size: 11, font });
      page.drawText(String(t.calificacion), { x: 260, y, size: 11, font });
      page.drawText(String(t.porcentaje), { x: 410, y, size: 11, font });
      y -= 20;
    });

    // ------------------------------
    // Firma
    // ------------------------------
    y -= 40;
    page.drawText('_____________________________', {
      x: 40,
      y,
      size: 12,
      font,
    });
    page.drawText('Firma del maestro', {
      x: 40,
      y: y - 15,
      size: 12,
      font,
    });

    // ------------------------------
    // Exportar
    // ------------------------------
    const pdfBytes = await pdf.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=boleta_${nombreAlumnoPDF}.pdf`
    );

    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('ERROR generar boleta:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
};
