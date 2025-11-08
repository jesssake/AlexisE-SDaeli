import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/** Modelo normalizado para el front */
export interface Estudiante {
  id: number;
  nombre: string;                        // puede venir como nombre o estudiante
  fecha_nacimiento?: string | null;
  edad?: number | null;                  // si no viene, la calculas en el componente
  tutor_id?: number | null;
  correo_tutor?: string | null;
}

/** Métricas que usan las tarjetas del front */
export interface Metricas {
  total: number;
  activos: number;
  inactivos: number;
}

@Injectable({ providedIn: 'root' })
export class EstudiantesService {
  /**
   * Si NO usas proxy, deja esta base:
   *   http://localhost/gestion_e
   *
   * Si usas proxy en Angular (recomendado):
   *   - crea proxy.conf.json apuntando a http://localhost/gestion_e
   *   - cambia la base a '/api'
   */
  private readonly baseUrl = 'http://localhost/gestion_e';
  // private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // ========= Helpers =========
  private handleError = (err: HttpErrorResponse) => {
    const msg =
      (err.error && (err.error.detail || err.error.message)) ||
      err.message ||
      'Error de red';
    return throwError(() => new Error(msg));
  };

  /** Normaliza cualquier forma cruda que venga del backend a Estudiante */
  private normalize = (raw: any): Estudiante => ({
    id: Number(raw?.id ?? 0),
    nombre: String(raw?.nombre ?? raw?.estudiante ?? ''),
    fecha_nacimiento: (raw?.fecha_nacimiento ?? raw?.fecha ?? null) as string | null,
    edad: raw?.edad != null ? Number(raw.edad) : null,
    tutor_id:
      raw?.tutor_id != null ? Number(raw.tutor_id)
      : raw?.id_tutor != null ? Number(raw.id_tutor)
      : null,
    correo_tutor: raw?.correo_tutor ?? raw?.correoTutor ?? null,
  });

  // ========= Lecturas =========

  /** GET: lista de estudiantes (lee estudiantes.php) */
  getEstudiantes(q?: string): Observable<Estudiante[]> {
    const url = `${this.baseUrl}/estudiantes.php`;
    const params = q ? new HttpParams().set('q', q) : undefined;

    return this.http.get<any>(url, { params }).pipe(
      map((resp) => {
        // Soporta varias formas: [], {data: []}, {estudiantes: []}
        const lista =
          Array.isArray(resp) ? resp
          : Array.isArray(resp?.data) ? resp.data
          : Array.isArray(resp?.estudiantes) ? resp.estudiantes
          : [];
        return lista.map(this.normalize);
      }),
      catchError(this.handleError)
    );
  }

  /** GET: métricas para tarjetas (lee metricas.php) */
  getMetricas(): Observable<Metricas> {
    return this.http.get<any>(`${this.baseUrl}/metricas.php`).pipe(
      map((raw) => ({
        // Acepta ambas formas por compatibilidad
        total: Number(raw?.total ?? 0),
        activos: Number(raw?.activos ?? raw?.total_ninos ?? 0),
        inactivos: Number(raw?.inactivos ?? 0),
      })),
      catchError(this.handleError)
    );
  }

  /** Helper: obtener un estudiante por id (filtrando de la lista) */
  getEstudiante(id: number): Observable<Estudiante | null> {
    return this.getEstudiantes().pipe(
      map((ls) => ls.find((e) => e.id === id) ?? null)
    );
  }

  // ========= Escrituras (CRUD) =========

  /**
   * POST: crear estudiante
   * Backend sugerido: crear_nino.php (recibe form-url-encoded)
   * Si aún no lo tienes y usas register_tutor_nino.php, cambia el endpoint abajo.
   */
  createEstudiante(payload: {
    nombre: string;
    fecha_nacimiento: string;
    tutor_id?: number | null;
    correo_tutor?: string | null;
  }): Observable<{ ok: boolean; id?: number }> {
    let body = new HttpParams()
      .set('nombre', payload.nombre ?? '')
      .set('fecha_nacimiento', payload.fecha_nacimiento ?? '');
    if (payload.tutor_id != null) body = body.set('tutor_id', String(payload.tutor_id));
    if (payload.correo_tutor != null) body = body.set('correo_tutor', payload.correo_tutor);

    return this.http.post<any>(`${this.baseUrl}/crear_nino.php`, body).pipe(
      map((r) => ({
        ok: !!(r?.ok ?? r?.success ?? r?.status === 'ok'),
        id: r?.id != null ? Number(r.id) : undefined,
      })),
      catchError(this.handleError)
    );
  }

  /**
   * POST: actualizar estudiante (actualizar_nino.php)
   * Puedes mandar sólo los campos que cambien.
   */
  updateEstudiante(
    id: number,
    payload: { nombre?: string; fecha_nacimiento?: string; tutor_id?: number | null; correo_tutor?: string | null }
  ): Observable<{ ok: boolean }> {
    let body = new HttpParams().set('id', String(id));
    if (payload.nombre != null) body = body.set('nombre', payload.nombre);
    if (payload.fecha_nacimiento != null) body = body.set('fecha_nacimiento', payload.fecha_nacimiento);
    if (payload.tutor_id !== undefined) body = body.set('tutor_id', payload.tutor_id != null ? String(payload.tutor_id) : '');
    if (payload.correo_tutor !== undefined) body = body.set('correo_tutor', payload.correo_tutor ?? '');

    return this.http.post<any>(`${this.baseUrl}/actualizar_nino.php`, body).pipe(
      map((r) => ({ ok: !!(r?.ok ?? r?.success ?? r?.status === 'ok') })),
      catchError(this.handleError)
    );
  }

  /** POST: eliminar estudiante (eliminar_nino.php) */
  deleteEstudiante(id: number): Observable<{ ok: boolean }> {
    const body = new HttpParams().set('id', String(id));
    return this.http.post<any>(`${this.baseUrl}/eliminar_nino.php`, body).pipe(
      map((r) => ({ ok: !!(r?.ok ?? r?.success ?? r?.status === 'ok') })),
      catchError(this.handleError)
    );
  }
}
