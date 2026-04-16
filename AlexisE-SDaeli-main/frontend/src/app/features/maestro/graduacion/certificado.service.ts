// C:\Codigos\HTml\AlexisE-SDaeli-main\AlexisE-SDaeli-main\frontend\src\app\features\maestro\graduacion\certificado.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CertificadoService {
  private apiBase = 'http://localhost:3000/api/maestro/graduacion/';

  constructor(private http: HttpClient) {}

  // ========================================
  // UTILIDADES
  // ========================================
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  private getUploadHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  private dataUrlToUint8Array(dataUrl: string): Uint8Array {
    const [, base64] = dataUrl.split(',');
    const binary = atob(base64 || '');
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // ========================================
  // GENERAR PDF MEJORADO (para maestro)
  // ========================================
  async generarPDF(
    nombre: string,
    promedio: number,
    ciclo?: string,
    teacherName?: string,
    logoDataUrl?: string | null,
    settings?: any
  ): Promise<Uint8Array> {
    try {
      const pdfUrl = 'assets/certificado-graduacion.pdf';

      const existingPdfBytes = await fetch(pdfUrl).then((res) => {
        if (!res.ok) throw new Error('Plantilla no encontrada');
        return res.arrayBuffer();
      });
      
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();
      const centerX = width / 2;

      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
      const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const negro = rgb(0, 0, 0);
      const azul = rgb(0.2, 0.3, 0.8);

      // 1. Título principal
      const titulo = "CERTIFICADO DE EXCELENCIA ACADÉMICA";
      const tituloWidth = fontBold.widthOfTextAtSize(titulo, 24);
      page.drawText(titulo, {
        x: centerX - tituloWidth / 2,
        y: height - 80,
        size: 24,
        font: fontBold,
        color: azul
      });

      // 2. Nombre del alumno
      const nombreAlumno = nombre.toUpperCase();
      const nombreWidth = fontItalic.widthOfTextAtSize(nombreAlumno, 32);
      page.drawText(nombreAlumno, {
        x: centerX - nombreWidth / 2,
        y: height - 150,
        size: 32,
        font: fontItalic,
        color: negro
      });

      // 3. Texto de reconocimiento
      const textoReconocimiento = "Por su destacado desempeño académico durante el ciclo escolar";
      const textoWidth = fontItalic.widthOfTextAtSize(textoReconocimiento, 14);
      page.drawText(textoReconocimiento, {
        x: centerX - textoWidth / 2,
        y: height - 200,
        size: 14,
        font: fontItalic,
        color: negro
      });

      // 4. Ciclo escolar
      const cicloEscolar = ciclo || '2025-2026';
      const cicloWidth = fontBold.widthOfTextAtSize(cicloEscolar, 20);
      page.drawText(cicloEscolar, {
        x: centerX - cicloWidth / 2,
        y: height - 240,
        size: 20,
        font: fontBold,
        color: negro
      });

      // 5. Promedio
      const promedioTexto = `Promedio obtenido: ${promedio.toFixed(2)}`;
      page.drawText(promedioTexto, {
        x: 150,
        y: height - 300,
        size: 14,
        font: fontNormal,
        color: negro
      });

      // 6. Nombre del maestro
      const maestroTexto = `Nombre del Mtro.: ${teacherName || 'Director(a)'}`;
      const maestroWidth = fontNormal.widthOfTextAtSize(maestroTexto, 14);
      page.drawText(maestroTexto, {
        x: width - 150 - maestroWidth,
        y: height - 300,
        size: 14,
        font: fontNormal,
        color: negro
      });

      // 7. Línea para firma
      const lineaX = width - 250;
      page.drawLine({
        start: { x: lineaX, y: height - 340 },
        end: { x: lineaX + 180, y: height - 340 },
        thickness: 1.5,
        color: negro
      });

      // 8. Texto "Firma del Director"
      const firmaTexto = "Firma del Director";
      const firmaWidth = fontItalic.widthOfTextAtSize(firmaTexto, 12);
      page.drawText(firmaTexto, {
        x: lineaX + 90 - firmaWidth / 2,
        y: height - 360,
        size: 12,
        font: fontItalic,
        color: negro
      });

      // 9. Escuela
      if (settings?.escuela) {
        const escuelaTexto = settings.escuela;
        const escuelaWidth = fontBold.widthOfTextAtSize(escuelaTexto, 16);
        page.drawText(escuelaTexto, {
          x: centerX - escuelaWidth / 2,
          y: 100,
          size: 16,
          font: fontBold,
          color: azul
        });
      }

      // 10. Fecha de emisión
      const fecha = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      page.drawText(`Expedido: ${fecha}`, {
        x: 50,
        y: 50,
        size: 10,
        font: fontItalic,
        color: rgb(0.5, 0.5, 0.5)
      });

      // 11. Folio
      if (settings?.folioActual) {
        const folioTexto = `FOLIO: CERT-${String(settings.folioActual).padStart(4, '0')}`;
        const folioWidth = fontItalic.widthOfTextAtSize(folioTexto, 10);
        page.drawText(folioTexto, {
          x: width - 50 - folioWidth,
          y: 50,
          size: 10,
          font: fontItalic,
          color: rgb(0.5, 0.5, 0.5)
        });
      }

      // 12. Logo
      if (logoDataUrl) {
        try {
          const imgBytes = this.dataUrlToUint8Array(logoDataUrl);
          let img;
          try {
            img = await pdfDoc.embedPng(imgBytes);
          } catch {
            img = await pdfDoc.embedJpg(imgBytes);
          }
          const scaled = img.scale(0.15);
          
          page.drawImage(img, {
            x: 50,
            y: height - 130,
            width: scaled.width,
            height: scaled.height,
          });
        } catch (e) {
          console.warn('No se pudo incrustar el logo', e);
        }
      }

      return await pdfDoc.save();
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  // ========================================
  // 🔥 NUEVO: GUARDAR CERTIFICADO CON PDF EN SERVIDOR
  // ========================================
  async guardarCertificadoConPDF(
    maestroId: number,
    alumnoId: number,
    promedio: number,
    ciclo: string,
    maestroFirma: string,
    pdfBytes: Uint8Array
  ): Promise<any> {
    const url = `${this.apiBase}${maestroId}/certificados-con-pdf`;
    
    // Convertir PDF a Blob para enviar
    const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
    const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('alumno_id', alumnoId.toString());
    formData.append('promedio', promedio.toString());
    formData.append('ciclo', ciclo);
    formData.append('maestro_firma', maestroFirma);
    formData.append('pdf', pdfBlob, `certificado_${Date.now()}.pdf`);

    try {
      const response = await firstValueFrom(
        this.http.post<any>(url, formData, {
          headers: this.getUploadHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error guardando certificado con PDF:', error);
      throw error;
    }
  }

  // ========================================
  // GUARDAR CERTIFICADO (solo datos, sin PDF)
  // ========================================
  async guardarCertificadoEnServidor(
    maestroId: number,
    alumnoId: number,
    promedio: number,
    ciclo: string,
    maestroFirma: string
  ): Promise<any> {
    const url = `${this.apiBase}${maestroId}/certificados`;
    
    const payload = {
      alumno_id: alumnoId,
      promedio: promedio,
      ciclo: ciclo,
      maestro_firma: maestroFirma
    };

    try {
      const response = await firstValueFrom(
        this.http.post<any>(url, payload, { headers: this.getHeaders() })
      );
      return response;
    } catch (error) {
      console.error('Error guardando certificado:', error);
      throw error;
    }
  }

  // ========================================
  // DESCARGAR PDF
  // ========================================
  descargarPDF(bytes: Uint8Array, fileName: string): void {
    const pdfArrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    
    const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ========================================
  // OBTENER LISTA DE CERTIFICADOS
  // ========================================
  async obtenerCertificados(maestroId: number): Promise<any[]> {
    const url = `${this.apiBase}${maestroId}/certificados`;
    
    try {
      const response = await firstValueFrom(
        this.http.get<any[]>(url, { headers: this.getHeaders() })
      );
      return response;
    } catch (error) {
      console.error('Error obteniendo certificados:', error);
      throw error;
    }
  }

  // ========================================
  // CAMBIAR ESTADO DEL CERTIFICADO
  // ========================================
  async cambiarEstado(certificadoId: number, estado: string): Promise<any> {
    const url = `${this.apiBase}certificados/${certificadoId}/estado`;
    
    try {
      const response = await firstValueFrom(
        this.http.put<any>(url, { estado }, { headers: this.getHeaders() })
      );
      return response;
    } catch (error) {
      console.error('Error cambiando estado:', error);
      throw error;
    }
  }

  // ========================================
  // ELIMINAR CERTIFICADO
  // ========================================
  async eliminarCertificado(certificadoId: number): Promise<any> {
    const url = `${this.apiBase}certificados/${certificadoId}`;
    
    try {
      const response = await firstValueFrom(
        this.http.delete<any>(url, { headers: this.getHeaders() })
      );
      return response;
    } catch (error) {
      console.error('Error eliminando certificado:', error);
      throw error;
    }
  }

  // ========================================
  // OBTENER ESTADÍSTICAS
  // ========================================
  async obtenerEstadisticas(maestroId: number): Promise<any> {
    const url = `${this.apiBase}${maestroId}/estadisticas`;
    
    try {
      const response = await firstValueFrom(
        this.http.get<any>(url, { headers: this.getHeaders() })
      );
      return response;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // ========================================
  // OBTENER ALUMNOS
  // ========================================
  async obtenerAlumnos(maestroId: number): Promise<any[]> {
    const url = `${this.apiBase}${maestroId}/alumnos`;
    
    try {
      const response = await firstValueFrom(
        this.http.get<any[]>(url, { headers: this.getHeaders() })
      );
      return response;
    } catch (error) {
      console.error('Error obteniendo alumnos:', error);
      throw error;
    }
  }
}