// reportes-alumno.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type TipoReporte = 'academico'|'conducta'|'asistencia'|'personal'|'salud'|'familiar';
export type EstadoReporte = 'pendiente'|'revisado'|'resuelto';
export type Prioridad = 'baja'|'media'|'alta';

export interface ReporteAlumnoDTO {
  id: number;
  tipo: TipoReporte;
  motivo: string;
  descripcion: string;
  estado: EstadoReporte;
  prioridad: Prioridad;
  fecha: string;
  fechaCreacion: string;
  maestro: string;
  grupo: string;
  accionesTomadas?: string;
  observaciones?: string;
}

export interface ResumenAlumno {
  total: number;
  pendientes: number;
  resueltos: number;
  altaPrioridad: number;
  ultimoReporte?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportesAlumnoService {
  private baseUrl = 'http://localhost:3000/api/reportes-alumno';

  constructor(private http: HttpClient) {}

  // Obtener reportes de un estudiante específico
  getReportesPorEstudiante(estudianteId: number, filtros?: any): Observable<{reportes: ReporteAlumnoDTO[], resumen: ResumenAlumno}> {
    let params = new HttpParams().set('estudianteId', estudianteId.toString());
    
    if (filtros) {
      if (filtros.tipo && filtros.tipo !== 'todos') params = params.set('tipo', filtros.tipo);
      if (filtros.estado && filtros.estado !== 'todos') params = params.set('estado', filtros.estado);
      if (filtros.prioridad && filtros.prioridad !== 'todos') params = params.set('prioridad', filtros.prioridad);
      if (filtros.mes) params = params.set('mes', filtros.mes);
      if (filtros.anio) params = params.set('anio', filtros.anio);
    }

    return this.http.get<{success: boolean, reportes: ReporteAlumnoDTO[], resumen: ResumenAlumno}>(`${this.baseUrl}`, { params })
      .pipe(map(response => ({
        reportes: response.reportes || [],
        resumen: response.resumen || { total: 0, pendientes: 0, resueltos: 0, altaPrioridad: 0 }
      })));
  }

  // Obtener resumen general del estudiante
  getResumenEstudiante(estudianteId: number): Observable<ResumenAlumno> {
    return this.http.get<{success: boolean, resumen: ResumenAlumno}>(`${this.baseUrl}/resumen`, {
      params: new HttpParams().set('estudianteId', estudianteId.toString())
    }).pipe(map(response => response.resumen || { total: 0, pendientes: 0, resueltos: 0, altaPrioridad: 0 }));
  }

  // Marcar reporte como leído
  marcarComoLeido(reporteId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${reporteId}/leido`, {});
  }

  // Agregar comentario/observación del estudiante/padre
  agregarObservacion(reporteId: number, observacion: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${reporteId}/observacion`, { observacion });
  }

  // Exportar reportes del estudiante a PDF
  exportarPDF(estudianteId: number): void {
    const url = `${this.baseUrl}/exportar/pdf?estudianteId=${estudianteId}`;
    window.open(url, '_blank');
  }

  // Test de conexión
  testConnection(): Observable<any> {
    return this.http.get(`${this.baseUrl}/test`);
  }
}