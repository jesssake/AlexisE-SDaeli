// src/app/core/registro.service.ts
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** ----- Tipos de respuesta de tus PHP ----- */
export interface MetricasResponse {
  total: number;
  activos: number;
  inactivos: number;
  total_ninos: number;
  edad_promedio: number;
  tutores_unicos: number;
  tutores_registrados: number | null;
}

export interface Estudiante {
  id: number;
  nombre: string;
  fecha_nacimiento: string | null;
  edad: number | null;
  tutor_id: number | null;
  correo_tutor: string | null;
}

export interface RegistrarTutorNinoPlanoBody {
  tutor_nombre: string;
  tutor_email: string;
  tutor_telefono?: string;
  tutor_password?: string;
  nino_nombre?: string;
  nino_condiciones?: string;      // 👈 NUEVO: condiciones_medicas
  fecha_nacimiento?: string;      // YYYY-MM-DD
}

export interface RegistrarTutorNinoResponse {
  ok: boolean;
  tutor?: { id: number; email: string; reutilizado: boolean };
  nino?: { id: number; nombre: string } | null;
  error?: string;
}

export interface ActualizarNinoResponse {
  ok: boolean;
  updated?: number;
  id?: number;
  error?: string;
}

export interface EliminarNinoResponse {
  ok: boolean;
  affected?: number;
  id?: number;
  already_inactive?: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class RegistroService {
  /** Usa proxy /api en dev. Si no tienes proxy, cambia a 'http://localhost/gestion_e' */
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  /** ----------------- Endpoints públicos ----------------- */

  /** Métricas rápidas del dashboard (metricas.php) */
  getMetricas(): Observable<MetricasResponse> {
    return this.http
      .get<MetricasResponse>(this.url('metricas.php'))
      .pipe(
        catchError((e) =>
          this.handleError(e, 'No se pudieron obtener las métricas')
        )
      );
  }

  /** Lista de niños activos, con búsqueda opcional por nombre o correo del tutor (estudiantes.php) */
  buscarEstudiantes(q?: string): Observable<Estudiante[]> {
    let params = new HttpParams();
    if (q && q.trim()) params = params.set('q', q.trim());
    return this.http
      .get<Estudiante[]>(this.url('estudiantes.php'), { params })
      .pipe(
        catchError((e) =>
          this.handleError(e, 'No se pudieron obtener los estudiantes')
        )
      );
  }

  /** Actualiza parcialmente un niño por id (actualizar_nino.php) */
  actualizarNino(
    id: number,
    patch: { nombre?: string; fecha_nacimiento?: string | null; tutor_id?: number | null }
  ): Observable<ActualizarNinoResponse> {
    if (!id || id <= 0) return throwError(() => new Error('Id inválido'));
    const body: any = { id };
    if (patch.nombre !== undefined) body.nombre = patch.nombre;
    if (patch.fecha_nacimiento !== undefined) body.fecha_nacimiento = patch.fecha_nacimiento;
    if (patch.tutor_id !== undefined) body.tutor_id = patch.tutor_id;
    return this.http
      .post<ActualizarNinoResponse>(this.url('actualizar_nino.php'), body, this.jsonOpts())
      .pipe(
        catchError((e) =>
          this.handleError(e, 'No se pudo actualizar el registro')
        )
      );
  }

  /** Soft-delete de niño (eliminar_nino.php) */
  eliminarNino(id: number): Observable<EliminarNinoResponse> {
    if (!id || id <= 0) return throwError(() => new Error('Id inválido'));
    return this.http
      .post<EliminarNinoResponse>(this.url('eliminar_nino.php'), { id }, this.jsonOpts())
      .pipe(
        catchError((e) =>
          this.handleError(e, 'No se pudo eliminar el registro')
        )
      );
  }

  /**
   * Alta de tutor y, opcionalmente, de niño (Registro/register_tutor_nino.php)
   * con CLAVES PLANAS.
   */
  registrarTutorNinoPlano(
    body: RegistrarTutorNinoPlanoBody
  ): Observable<RegistrarTutorNinoResponse> {
    return this.http
      .post<RegistrarTutorNinoResponse>(
        this.url('Registro/register_tutor_nino.php'), // 👈 carpeta Registro
        body,
        this.jsonOpts()
      )
      .pipe(
        catchError((e) =>
          this.handleError(e, 'No se pudo registrar el tutor/niño')
        )
      );
  }

  /**
   * Conveniencia: recibe el modelo del formulario y arma el body plano que espera el PHP.
   * Úsalo si tu componente mantiene nombres "camelCase" en el form.
   */
  registrarTutorNinoDesdeModelo(model: {
    tutorName: string;
    tutorEmail: string;
    tutorPhone?: string;
    tutorPassword?: string;
    childName?: string;
    childBirth?: string;       // YYYY-MM-DD
    childCondition?: string;   // condiciones_medicas
  }): Observable<RegistrarTutorNinoResponse> {
    const body: RegistrarTutorNinoPlanoBody = {
      tutor_nombre:     model.tutorName,
      tutor_email:      model.tutorEmail,
      tutor_telefono:   model.tutorPhone,
      tutor_password:   model.tutorPassword,
      nino_nombre:      model.childName,
      nino_condiciones: model.childCondition,
      fecha_nacimiento: model.childBirth
    };
    return this.registrarTutorNinoPlano(body);
  }

  /** ----------------- Utilidades ----------------- */

  private url(path: string): string {
    // Acepta 'foo.php' o '/foo.php'
    const p = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${p}`;
  }

  private jsonOpts() {
    return { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
  }

  private handleError(
    err: HttpErrorResponse,
    fallbackMsg = 'Error de red'
  ): Observable<never> {
    const serverMsg =
      (err.error && (err.error.error || err.error.message)) ||
      (typeof err.error === 'string' ? err.error : null);
    const msg = serverMsg || `${fallbackMsg} (HTTP ${err.status || '0'})`;
    return throwError(() => new Error(msg));
  }
}
