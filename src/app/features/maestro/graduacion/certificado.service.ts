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

  // Genera un PDF a partir de la plantilla y escribe nombre + promedio
  async generarPDF(nombre: string, promedio: number): Promise<Uint8Array> {
    const pdfUrl = 'assets/certificado-graduacion.pdf';

    const baseBytes = await firstValueFrom(
      this.http.get(pdfUrl, { responseType: 'arraybuffer' })
    );

    const pdfDoc = await PDFDocument.load(baseBytes);
    const [page] = pdfDoc.getPages();
    const { width } = page.getSize();

    const fontNombre = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontProm = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const nombreSize = 28;
    const textoNombre = nombre.toUpperCase();
    const nombreWidth = fontNombre.widthOfTextAtSize(textoNombre, nombreSize);
    const xNombre = (width - nombreWidth) / 2;
    const yNombre = 340;

    page.drawText(textoNombre, {
      x: xNombre,
      y: yNombre,
      size: nombreSize,
      font: fontNombre,
      color: rgb(0.1, 0.1, 0.1),
    });

    const promSize = 16;
    const promText = `Promedio: ${promedio.toFixed(1)}`;
    const promWidth = fontProm.widthOfTextAtSize(promText, promSize);
    const xProm = (width - promWidth) / 2;
    const yProm = yNombre - 40;

    page.drawText(promText, {
      x: xProm,
      y: yProm,
      size: promSize,
      font: fontProm,
      color: rgb(0.25, 0.25, 0.25),
    });

    const bytes = await pdfDoc.save();
    return bytes;
  }

  descargarPDF(bytes: Uint8Array, nombreArchivo: string) {
    const blobPart: BlobPart = bytes as unknown as BlobPart;
    const blob = new Blob([blobPart], { type: 'application/pdf' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Convierte Uint8Array → base64
  private uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  // Genera pdf y lo manda al PHP para enviarlo por correo
  async enviarPorCorreo(
    estudianteId: number,
    nombre: string,
    promedio: number
  ): Promise<{ success: boolean; message: string }> {
    const pdfBytes = await this.generarPDF(nombre, promedio);
    const pdfBase64 = this.uint8ToBase64(pdfBytes);

    const body = {
      estudianteId,
      nombreAlumno: nombre,
      promedio,
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
