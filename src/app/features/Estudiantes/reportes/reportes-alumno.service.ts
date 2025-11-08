// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\Estudiantes\reportes\reportes-alumno.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReporteAlumno {
  id: number;
  alumno_id: number;
  tipo: 'academico' | 'conducta' | 'asistencia' | 'personal';
  motivo: string;
  descripcion: string | null;
  estado: 'pendiente' | 'revisado' | 'resuelto';
  prioridad: 'baja' | 'media' | 'alta';
  acciones: string | null;       // acciones_tomadas en backend → mapeado a 'acciones'
  fecha: string;                 // YYYY-MM-DD
  maestro_id: number;
  leido?: 0 | 1;
  visto_en?: string | null;
  folio?: string | null;         // opcional si lo quieres mostrar
}

export interface ConteoReportes {
  total: number;
  pendiente: number;
  revisado: number;
  resuelto: number;
  alta: number;
  media: number;
  baja: number;
}

export interface ListaResponse {
  ok: boolean;
  alumno_id: number;
  conteo: ConteoReportes;
  reportes: ReporteAlumno[];
  error?: string;
  message?: string;
}

export interface VerResponse {
  ok: boolean;
  alumno_id: number;
  reporte?: ReporteAlumno;
  error?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportesAlumnoService {
  private http = inject(HttpClient);

  /** Cambia si mueves la carpeta PHP */
  private base = 'http://localhost/gestion_e/ReportesAlumno';

  listar(opts: {
    alumno_id?: number;
    correo?: string;
    estado?: 'pendiente' | 'revisado' | 'resuelto';
    prioridad?: 'baja' | 'media' | 'alta';
  }): Observable<ListaResponse> {
    let params = new HttpParams();
    if (opts.alumno_id) params = params.set('alumno_id', String(opts.alumno_id));
    if (opts.correo)    params = params.set('correo', opts.correo);
    if (opts.estado)    params = params.set('estado', opts.estado);
    if (opts.prioridad) params = params.set('prioridad', opts.prioridad);
    return this.http.get<ListaResponse>(`${this.base}/lista.php`, { params });
  }

  ver(alumno_id: number, reporte_id: number): Observable<VerResponse> {
    const params = new HttpParams()
      .set('alumno_id', String(alumno_id))
      .set('reporte_id', String(reporte_id));
    return this.http.get<VerResponse>(`${this.base}/ver.php`, { params });
  }

  marcarLeido(alumno_id: number, reporte_id: number): Observable<{ ok: boolean; message?: string }> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const body = new URLSearchParams();
    body.set('alumno_id', String(alumno_id));
    body.set('reporte_id', String(reporte_id));
    return this.http.post<{ ok: boolean; message?: string }>(`${this.base}/marcar_leido.php`, body.toString(), { headers });
  }

  exportarWord(alumno_id: number, estado?: string, prioridad?: string): void {
    const url = new URL(`${this.base}/export_word.php`);
    url.searchParams.set('alumno_id', String(alumno_id));
    if (estado) url.searchParams.set('estado', estado);
    if (prioridad) url.searchParams.set('prioridad', prioridad);
    // abre descarga
    window.open(url.toString(), '_blank');
  }
}
