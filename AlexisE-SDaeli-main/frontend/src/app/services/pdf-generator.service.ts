// frontend/src/app/shared/services/pdf-generator.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import { firstValueFrom } from 'rxjs';
import { limpiarNombrePropio, limpiarTextoWinAnsi } from '../../utils/pdfUtils';

export interface CertificadoData {
  nombreAlumno: string;
  promedio: number;
  cicloEscolar: string;
  nombreMaestro: string;
  certificadoId?: number;
  fecha?: Date;
  tipo?: 'excelencia' | 'graduacion';
}

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  private plantillaCache: ArrayBuffer | null = null;
  private readonly PLANTILLA_URL = 'assets/certificado-graduacion.pdf';

  constructor(private http: HttpClient) {}

  /**
   * Genera el certificado PDF con formato consistente
   */
  async generarCertificado(data: CertificadoData): Promise<Uint8Array> {
    try {
      // 1. Cargar plantilla (con caché)
      const plantillaBytes = await this.cargarPlantilla();
      
      // 2. Cargar PDF
      const pdfDoc = await PDFDocument.load(plantillaBytes);
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();
      
      // 3. Limpiar textos (usar tus funciones existentes)
      const nombreLimpio = this.limpiarNombreCertificado(data.nombreAlumno);
      const cicloLimpio = this.limpiarCicloEscolar(data.cicloEscolar);
      const maestroLimpio = this.limpiarNombreMaestro(data.nombreMaestro);
      
      // 4. Cargar fuentes (una sola vez)
      const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
      
      // 5. Dibujar en el PDF (coordenadas centralizadas)
      this.dibujarCertificado({
        pdfDoc,
        page,
        width,
        height,
        fonts: { regular: fontRegular, bold: fontBold, italic: fontItalic },
        data: {
          ...data,
          nombreLimpio,
          cicloLimpio,
          maestroLimpio
        }
      });
      
      // 6. Guardar y retornar
      return await pdfDoc.save();
      
    } catch (error) {
      console.error('❌ Error generando certificado:', error);
      // Fallback: generar PDF desde cero si la plantilla falla
      return await this.generarCertificadoDesdeCero(data);
    }
  }

  /**
   * Carga la plantilla con caché para mejor performance
   */
  private async cargarPlantilla(): Promise<ArrayBuffer> {
    if (this.plantillaCache) {
      return this.plantillaCache;
    }
    
    const response = await firstValueFrom(
      this.http.get(this.PLANTILLA_URL, { responseType: 'arraybuffer' })
    );
    
    this.plantillaCache = response as ArrayBuffer;
    return this.plantillaCache;
  }

  /**
   * Dibuja todo el contenido del certificado
   */
  private dibujarCertificado(params: {
    pdfDoc: PDFDocument;
    page: any;
    width: number;
    height: number;
    fonts: { regular: PDFFont; bold: PDFFont; italic: PDFFont };
    data: any;
  }): void {
    const { page, width, height, fonts, data } = params;
    
    // ========================================
    // COORDENADAS CENTRALIZADAS (AJUSTA SEGÚN TU PLANTILLA)
    // ========================================
    
    // 1. TÍTULO PRINCIPAL
    const titulo = "CERTIFICADO DE EXCELENCIA ACADÉMICA";
    this.drawCenteredText(page, titulo, height - 100, 24, fonts.bold, rgb(0.2, 0.3, 0.8));
    
    // 2. TEXTO "Se le otorga el presente"
    const textoIntro = "Se le otorga el presente";
    this.drawCenteredText(page, textoIntro, height - 160, 14, fonts.italic, rgb(0, 0, 0));
    
    // 3. TEXTO "RECONOCIMIENTO"
    const textoReconocimiento = "RECONOCIMIENTO";
    this.drawCenteredText(page, textoReconocimiento, height - 190, 18, fonts.bold, rgb(0.2, 0.3, 0.8));
    
    // 4. TEXTO "A el Alumno/a:"
    const textoAlumno = "A el Alumno/a:";
    this.drawCenteredText(page, textoAlumno, height - 240, 12, fonts.italic, rgb(0, 0, 0));
    
    // 5. NOMBRE DEL ALUMNO (Grande y cursiva)
    page.drawText(data.nombreLimpio, {
      x: (width - fonts.italic.widthOfTextAtSize(data.nombreLimpio, 28)) / 2,
      y: height - 290,
      size: 28,
      font: fonts.italic,
      color: rgb(0, 0, 0)
    });
    
    // 6. CICLO ESCOLAR
    page.drawText(data.cicloLimpio, {
      x: (width - fonts.bold.widthOfTextAtSize(data.cicloLimpio, 18)) / 2,
      y: height - 350,
      size: 18,
      font: fonts.bold,
      color: rgb(0, 0, 0)
    });
    
    // 7. PROMEDIO (Izquierda)
    const promedioTexto = `Promedio obtenido: ${data.promedio.toFixed(2)}`;
    page.drawText(promedioTexto, {
      x: 120,
      y: height - 410,
      size: 12,
      font: fonts.regular,
      color: rgb(0, 0, 0)
    });
    
    // 8. NOMBRE DEL MAESTRO (Derecha)
    const maestroTexto = `Nombre del Mtro.: ${data.maestroLimpio}`;
    page.drawText(maestroTexto, {
      x: width - 220 - fonts.regular.widthOfTextAtSize(maestroTexto, 12),
      y: height - 410,
      size: 12,
      font: fonts.regular,
      color: rgb(0, 0, 0)
    });
    
    // 9. LÍNEA PARA FIRMA
    const lineaX = width - 220;
    page.drawLine({
      start: { x: lineaX, y: height - 450 },
      end: { x: lineaX + 150, y: height - 450 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });
    
    // 10. TEXTO "Firma del Director"
    page.drawText("Firma del Director", {
      x: lineaX + 75 - fonts.italic.widthOfTextAtSize("Firma del Director", 10) / 2,
      y: height - 470,
      size: 10,
      font: fonts.italic,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // 11. FECHA
    const fecha = (data.fecha || new Date()).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    page.drawText(`Expedido: ${fecha}`, {
      x: 50,
      y: 50,
      size: 9,
      font: fonts.italic,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // 12. FOLIO
    if (data.certificadoId) {
      const folio = `FOLIO: CERT-${String(data.certificadoId).padStart(4, '0')}`;
      page.drawText(folio, {
        x: width - 130,
        y: 50,
        size: 9,
        font: fonts.italic,
        color: rgb(0.5, 0.5, 0.5)
      });
    }
  }

  /**
   * Helper para dibujar texto centrado
   */
  private drawCenteredText(page: any, text: string, y: number, size: number, font: PDFFont, color: any): void {
    const { width } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: y,
      size: size,
      font: font,
      color: color
    });
  }

  /**
   * Fallback: Generar PDF desde cero si la plantilla falla
   */
  private async generarCertificadoDesdeCero(data: CertificadoData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // Tamaño carta
    
    const fonts = {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    };
    
    this.dibujarCertificado({
      pdfDoc,
      page,
      width: 595,
      height: 842,
      fonts,
      data: {
        ...data,
        nombreLimpio: this.limpiarNombreCertificado(data.nombreAlumno),
        cicloLimpio: this.limpiarCicloEscolar(data.cicloEscolar),
        maestroLimpio: this.limpiarNombreMaestro(data.nombreMaestro)
      }
    });
    
    return await pdfDoc.save();
  }

  // ========================================
  // FUNCIONES DE LIMPIEZA (USAR TUS EXISTENTES)
  // ========================================
  
  private limpiarNombreCertificado(nombre: string): string {
    // Usar tu función existente limpiarNombrePropio
    return limpiarNombrePropio(nombre).toUpperCase();
  }
  
  private limpiarCicloEscolar(ciclo: string): string {
    return limpiarTextoWinAnsi(ciclo).replace(/[^0-9-]/g, '');
  }
  
  private limpiarNombreMaestro(nombre: string): string {
    return limpiarNombrePropio(nombre);
  }

  /**
   * Descargar el PDF generado
   */
  descargarPDF(pdfBytes: Uint8Array, nombreArchivo: string): void {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}