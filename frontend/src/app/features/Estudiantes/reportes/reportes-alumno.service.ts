import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Estado = 'pendiente' | 'revisado' | 'resuelto';
export type Prioridad = 'baja' | 'media' | 'alta';

export interface ReporteAlumno {
  id: number;
  estudianteId: number;
  estudianteNombre: string;
  tipo: string;
  motivo: string;
  descripcion: string;
  prioridad: Prioridad;
  estado: Estado;
  folio: string;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class ReportesAlumnoService {
  private http = inject(HttpClient);

  private base = 'http://localhost/gestion_e/reportes';
  private listaUrl = `${this.base}/lista.php`;
  private wordUrl  = `${this.base}/export_word.php`;
  private estUrl   = `${this.base}/estudiantes.php`;

  private takeArray(resp: any): any[] {
    if (Array.isArray(resp)) return resp;
    if (resp?.data && Array.isArray(resp.data)) return resp.data;
    if (resp?.rows && Array.isArray(resp.rows)) return resp.rows;
    return [];
  }

  async getPorAlumnoId(alumnoId: number): Promise<ReporteAlumno[]> {
    const resp = await firstValueFrom(
      this.http.get<any>(`${this.listaUrl}?nino_id=${alumnoId}`)
    );
    return this.mapear(this.takeArray(resp));
  }

  async getPorEmail(email: string): Promise<ReporteAlumno[]> {
    const resp = await firstValueFrom(
      this.http.get<any>(`${this.listaUrl}?email=${encodeURIComponent(email)}`)
    );
    return this.mapear(this.takeArray(resp));
  }

  async getHijosDeTutor(tutorId: number) {
    const resp = await firstValueFrom(
      this.http.get<any>(`${this.estUrl}?tutor_id=${tutorId}`)
    );
    return this.takeArray(resp).map((x: any) => ({
      id: Number(x.id),
      nombre: String(x.nombre)
    }));
  }

  descargarWord(id: number) {
    const a = document.createElement('a');
    a.href = `${this.wordUrl}?id=${id}`;
    a.target = '_blank';
    a.click();
    a.remove();
  }

  private mapear(rows: any[]): ReporteAlumno[] {
    return rows.map((x: any) => ({
      id: Number(x.id || 0),
      estudianteId: Number(x.nino_id || x.estudianteId || 0),
      estudianteNombre: String(x.estudianteNombre || x.nombre || ''),
      tipo: String(x.tipo || ''),
      motivo: String(x.motivo || ''),
      descripcion: String(x.descripcion || ''),
      prioridad: (String(x.prioridad || 'media') as Prioridad),
      estado: (String(x.estado || 'pendiente') as Estado),
      folio: String(x.folio || '—'),
      fecha: String(x.fecha || x.created_at || new Date().toISOString()),
    }));
  }
}
