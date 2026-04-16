import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type TipoReporte   = 'academico'|'conducta'|'asistencia'|'personal'|'salud'|'familiar';
export type EstadoReporte = 'pendiente'|'revisado'|'resuelto';
export type Prioridad     = 'baja'|'media'|'alta';

export interface EstudianteOpt { id: number; nombre: string; }

export interface ReporteDTO {
  id: number;
  tipo: TipoReporte;
  estudianteId: number;
  motivo: string;
  descripcion: string;
  estado: EstadoReporte;
  prioridad: Prioridad;
  fecha: string;                 // YYYY-MM-DD
  accionesTomadas?: string;      // opcional
}

export interface GetReportesResp {
  data: ReporteDTO[];
  summary?: { total: number; pendientes: number; resueltos: number; altaPrioridad: number };
}

export interface ExportCsvParams {
  maestroId?: number;
  estado?: EstadoReporte | 'todos';
  tipo?: TipoReporte | 'todos';
  prioridad?: Prioridad | 'todos';
  sep?: ';' | ',' | string;      // separador opcional
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private base = 'http://localhost/gestion_e/reportes';

  constructor(private http: HttpClient) {}

  // Normalizamos para que SIEMPRE devuelva EstudianteOpt[]
  getEstudiantes(): Observable<EstudianteOpt[]> {
    return this.http.get<any>(`${this.base}/estudiantes.php`).pipe(
      map((r) => Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : []))
    );
  }

  getReportes(params: any): Observable<GetReportesResp> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<GetReportesResp>(`${this.base}/lista.php`, { params: httpParams });
  }

  crear(payload: {
    tipo: TipoReporte;
    estudianteId: number;
    motivo: string;
    descripcion: string;
    prioridad: Prioridad;
    maestroId?: number;
  }) {
    return this.http.post(`${this.base}/crear.php`, payload);
  }

  cambiarEstado(payload: { id: number; estado: EstadoReporte; accionesTomadas?: string }) {
    return this.http.post(`${this.base}/cambiar_estado.php`, payload);
  }

  eliminar(id: number) {
    const params = new HttpParams().set('id', String(id));
    return this.http.delete(`${this.base}/eliminar.php`, { params });
  }

  // Abre el CSV en una pestaña; admite 'sep'
  exportarCSV(params: ExportCsvParams = {}) {
    const q = new URLSearchParams();
    if (params.maestroId) q.set('maestro_id', String(params.maestroId));
    if (params.estado && params.estado !== 'todos') q.set('estado', String(params.estado));
    if (params.tipo && params.tipo !== 'todos') q.set('tipo', String(params.tipo));
    if (params.prioridad && params.prioridad !== 'todos') q.set('prioridad', String(params.prioridad));
    if (params.sep) q.set('sep', String(params.sep));
    const url = `${this.base}/export_csv.php?${q.toString()}`;
    window.open(url, '_blank');
  }
}
