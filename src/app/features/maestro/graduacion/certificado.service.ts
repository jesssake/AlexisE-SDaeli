import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

@Injectable({
  providedIn: 'root',
})
export class CertificadoService {
  constructor(private http: HttpClient) {}

  // Genera un PDF a partir de la plantilla y escribe el nombre
  async generarPDFConNombre(nombre: string): Promise<Uint8Array> {
    const pdfUrl = 'assets/Certificado Graduación Moderno Dorado.pdf';

    // Cargar el PDF base desde assets
    const existingPdfBytes = await this.http
      .get(pdfUrl, { responseType: 'arraybuffer' })
      .toPromise();

    const pdfDoc = await PDFDocument.load(existingPdfBytes!);
    const pages = pdfDoc.getPages();
    const primeraPagina = pages[0];

    // Fuente embebida
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Dibuja el nombre en el PDF
    primeraPagina.drawText(nombre, {
      x: 200, // ajusta según el diseño del PDF
      y: 280, // ajusta según el diseño del PDF
      size: 28,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  // Descarga el PDF generado
  
descargarPDF(pdfBytes: Uint8Array, nombreArchivo: string) {
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  link.click();

  window.URL.revokeObjectURL(url);
}
}
