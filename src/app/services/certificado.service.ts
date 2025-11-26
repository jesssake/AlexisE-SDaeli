// C:\Codigos\HTml\gestion-educativa\frontend\src\app\services\certificado.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CertificadoService {
  constructor(private http: HttpClient) {}

  // Obtener certificados de un alumno
  obtenerCertificadosEstudiante(alumnoId: number): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(
      `/api/certificados_estudiante.php?alumnoId=${alumnoId}`
    );
  }

  // Descargar un certificado en binario
  descargarCertificado(certificadoId: number) {
    return this.http.get(`/api/descargar_certificado.php?id=${certificadoId}`, {
      responseType: 'arraybuffer' as 'json'
    });
  }

  // Crear y descargar el PDF en el navegador
  descargarPDF(bytes: ArrayBuffer, nombreArchivo: string) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  }
}
