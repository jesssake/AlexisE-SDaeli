import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type TipoReporte   = 'academico'|'conducta'|'asistencia'|'personal'|'salud'|'familiar';
export type EstadoReporte = 'pendiente'|'revisado'|'resuelto';
export type Prioridad     = 'baja'|'media'|'alta';

export interface EstudianteOpt { 
  id: number; 
  nombre: string; 
}

export interface ReporteDTO {
  id: number;
  usuario_id?: number;  // AÑADIDO para identificar qué usuario creó el reporte
  tipo: TipoReporte;
  estudianteId: number;
  motivo: string;
  descripcion: string;
  estado: EstadoReporte;
  prioridad: Prioridad;
  fecha: string;                 // YYYY-MM-DD
  accionesTomadas?: string;      // opcional
  estudianteNombre?: string;     // opcional, para mostrar en UI
}

export interface GetReportesResp {
  success: boolean;  // Usar 'success' en lugar de 'ok' para coincidir con backend
  message?: string;
  data: ReporteDTO[];
  summary?: { 
    total: number; 
    pendientes: number; 
    resueltos: number; 
    altaPrioridad: number 
  };
  debug?: any;  // AÑADIDO para información de depuración
}

export interface ExportCsvParams {
  maestroId?: number;
  estado?: EstadoReporte | 'todos';
  tipo?: TipoReporte | 'todos';
  prioridad?: Prioridad | 'todos';
  sep?: ';' | ',' | string;
}

// Interfaces para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean;  // CORREGIDO: usar 'success' en lugar de 'ok'
  message?: string;
  data?: T;
  id?: number;
}

export interface LogoUploadResponse {
  url: string;
}

export interface WordExportParams {
  id?: string;
  escuela: string;
  direccion: string;
  telefono: string;
  maestro: string;
  grupo: string;
  cita: string;
  folioN: string;
  logo: string;
  tipo: string;
  estudiante: string;
  prioridad: string;
  motivo: string;
  descripcion: string;
  estado: string;
  fecha: string;
  accionesTomadas?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private base = 'http://localhost:3000/api/reportes';

  constructor(private http: HttpClient) {}

  // Obtener estudiantes - CORREGIDO: rutas Node.js
  getEstudiantes(maestroId?: number): Observable<EstudianteOpt[]> {
    let params = new HttpParams();
    if (maestroId) {
      params = params.set('maestro_id', String(maestroId));
    }
    
    return this.http.get<EstudianteOpt[]>(`${this.base}/estudiantes`, { params }).pipe(
      map((response: any) => {
        console.log('🔍 Respuesta estudiantes:', response);
        return response;
      })
    );
  }

  // Obtener reportes - CORREGIDO: rutas Node.js
  getReportes(params: any): Observable<GetReportesResp> {
    const httpParams = new HttpParams({ fromObject: params });
    
    console.log('📤 [Frontend] Parámetros enviados al backend:', params);
    
    return this.http.get<GetReportesResp>(`${this.base}`, { params: httpParams }).pipe(
      map(response => {
        console.log('📥 [Frontend] Respuesta del backend:', response);
        return response;
      })
    );
  }

  // Crear reporte - CORREGIDO: rutas Node.js
  crear(payload: {
    tipo: TipoReporte;
    estudianteId: number;
    motivo: string;
    descripcion: string;
    prioridad: Prioridad;
    maestroId?: number;
  }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.base}`, payload);
  }

  // Cambiar estado - CORREGIDO: rutas Node.js (PUT en lugar de POST)
  cambiarEstado(payload: { 
    id: number; 
    estado: EstadoReporte; 
    accionesTomadas?: string 
  }): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.base}/${payload.id}/estado`, payload);
  }

  // Eliminar reporte - CORREGIDO: rutas Node.js
  eliminar(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.base}/${id}`);
  }

  // Subir logo - CORREGIDO: rutas Node.js
  subirLogo(file: File): Observable<ApiResponse<LogoUploadResponse>> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<ApiResponse<LogoUploadResponse>>(
      `${this.base}/upload/logo`,
      formData
    );
  }

  // Exportar CSV - CORREGIDO: rutas Node.js
  exportarCSV(params: any = {}): void {
    const q = new URLSearchParams();
    
    // Compatibilidad: acepta maestroId o maestro_id
    if (params.maestroId) {
      q.set('maestro_id', String(params.maestroId));
    } else if (params.maestro_id) {
      q.set('maestro_id', String(params.maestro_id));
    }
    
    if (params.estado && params.estado !== 'todos') q.set('estado', String(params.estado));
    if (params.tipo && params.tipo !== 'todos') q.set('tipo', String(params.tipo));
    if (params.prioridad && params.prioridad !== 'todos') q.set('prioridad', String(params.prioridad));
    if (params.sep) q.set('sep', String(params.sep));
    
    const url = `${this.base}/exportar/csv?${q.toString()}`;
    console.log('📤 Exportando CSV a:', url);
    window.open(url, '_blank');
  }

  // Exportar a Word - CORREGIDO: rutas Node.js
  exportarWord(params: WordExportParams): void {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        q.set(key, String(value));
      }
    });
    const url = `${this.base}/exportar/word?${q.toString()}`;
    console.log('📄 Exportando Word a:', url);
    window.open(url, '_blank');
  }

  // Probar conexión - CORREGIDO: rutas Node.js
  testConnection(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.base}/test`);
  }
}