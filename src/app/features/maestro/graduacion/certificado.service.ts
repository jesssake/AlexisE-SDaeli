import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CertificadoService {
  private apiEnviar = 'http://localhost/gestion_e/Certificados/enviar_certificado.php';

  constructor(private http: HttpClient) {}

  // dataURL (base64) → Uint8Array
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

  // ================== Generar PDF ==================
  async generarPDF(
    nombre: string,
    promedio: number,
    ciclo?: string,
    teacherName?: string,
    logoDataUrl?: string | null
  ): Promise<Uint8Array> {
    const pdfUrl = 'assets/certificado-graduacion.pdf';

    const existingPdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPage(0);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Nombre
    page.drawText(nombre.toUpperCase(), {
      x: 210,
      y: 360,
      size: 26,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Promedio
    page.drawText(`Promedio: ${promedio.toFixed(1)}`, {
      x: 270,
      y: 320,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    // Ciclo
    if (ciclo) {
      page.drawText(ciclo, {
        x: 270,
        y: 300,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // Maestro
    if (teacherName) {
      page.drawText(teacherName, {
        x: 210,
        y: 210,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // Logo
    if (logoDataUrl) {
      try {
        const imgBytes = this.dataUrlToUint8Array(logoDataUrl);
        let img;
        try {
          img = await pdfDoc.embedPng(imgBytes);
        } catch {
          img = await pdfDoc.embedJpg(imgBytes);
        }
        const scaled = img.scale(0.18);

        page.drawImage(img, {
          x: 90,
          y: 470,
          width: scaled.width,
          height: scaled.height,
        });
      } catch (e) {
        console.warn('No se pudo incrustar el logo en el PDF', e);
      }
    }

    return await pdfDoc.save();
  }

  // Descargar PDF
  descargarPDF(bytes: Uint8Array, fileName: string): void {
    const blob = new Blob([bytes as unknown as BlobPart], {
      type: 'application/pdf',
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);
  }

  // ================== Enviar al servidor ==================
  async enviarAlServidor(
    estudianteId: number,
    nombre: string,
    promedio: number,
    ciclo: string,
    tipo: string,
    pdfBytes: Uint8Array
  ): Promise<{ success: boolean; message: string }> {
    // Uint8Array → base64
    let binary = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      binary += String.fromCharCode(pdfBytes[i]);
    }
    const pdfBase64 = btoa(binary);

    const body = {
      estudianteId,
      nombreAlumno: nombre,
      promedio,
      ciclo,
      tipo,
      pdfBase64,
    };

    return await firstValueFrom(
      this.http.post<{ success: boolean; message: string }>(
        this.apiEnviar,
        body
      )
    );
  }
}
