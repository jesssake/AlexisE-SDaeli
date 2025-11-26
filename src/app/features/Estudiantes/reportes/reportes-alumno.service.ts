import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Estado = 'pendiente' | 'revisado' | 'resuelto';
export type Prioridad = 'baja' | 'media' | 'alta';

export interface ReporteAlumno {
  id: number;
  estudianteId: number;           // = nino_id
  estudianteNombre: string;
  tipo: string;
  motivo: string;
  descripcion: string;
  prioridad: Prioridad;
  estado: Estado;
  folio: string;
  fecha: string;                  // ISO
}

@Injectable({ providedIn: 'root' })
export class ReportesAlumnoService {
  private http = inject(HttpClient);

  // Ajusta si cambias el prefijo
  private base = 'http://localhost/gestion_e/reportes';
  private listaUrl = `${this.base}/lista.php`;
  private wordUrl  = `${this.base}/export_word.php`;
  private estUrl   = `${this.base}/estudiantes.php`;

  /** Utilidad: normaliza cualquier respuesta (array plano o {ok/data} o {success/data}) */
  private takeArray(resp: any): any[] {
    if (Array.isArray(resp)) return resp;
    if (resp && Array.isArray(resp.data)) return resp.data;
    if (resp && Array.isArray(resp.rows)) return resp.rows;
    return [];
  }

  /** Trae reportes por ID de alumno (ninos.id) */
  async getPorAlumnoId(alumnoId: number): Promise<ReporteAlumno[]> {
    const url = `${this.listaUrl}?nino_id=${alumnoId}`;
    const resp = await firstValueFrom(this.http.get<any>(url));
    return this.mapear(this.takeArray(resp));
  }

  /** Fallback por email (si tu PHP lo soporta) */
  async getPorEmail(email: string): Promise<ReporteAlumno[]> {
    const url = `${this.listaUrl}?email=${encodeURIComponent(email)}`;
    const resp = await firstValueFrom(this.http.get<any>(url));
    return this.mapear(this.takeArray(resp));
  }

  /** Lista hijos de un tutor (tu PHP regresa array plano) */
  async getHijosDeTutor(tutorId: number): Promise<Array<{id:number; nombre:string}>> {
    const url = `${this.estUrl}?tutor_id=${tutorId}`;
    const resp = await firstValueFrom(this.http.get<any>(url));
    const rows = this.takeArray(resp);
    return rows.map((r:any)=>({ id: Number(r.id), nombre: String(r.nombre) }));
  }

  /** Fallback: obtiene reportes del tutor y arma lista de alumnos únicos */
  async getReportesPorTutor(tutorId: number) {
    const url = `${this.listaUrl}?tutor_id=${tutorId}`;
    const resp = await firstValueFrom(this.http.get<any>(url));
    const rows = this.mapear(this.takeArray(resp));
    const mapa = new Map<number, string>();
    rows.forEach(r => mapa.set(r.estudianteId, r.estudianteNombre));
    const hijos = Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }));
    return { hijos, reportes: rows };
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
      id: Number(x.id || x.reporteId || 0),
      estudianteId: Number(x.nino_id || x.estudianteId || 0),
      estudianteNombre: String(x.estudianteNombre || x.nombre || ''),
      tipo: String(x.tipo || ''),
      motivo: String(x.motivo || ''),
      descripcion: String(x.descripcion || ''),
      prioridad: (String(x.prioridad || 'media') as any),
      estado: (String(x.estado || 'pendiente') as any),
      folio: String(x.folio || '—'),
      fecha: String(x.fecha || x.created_at || new Date().toISOString()),
    }));
  }
}
