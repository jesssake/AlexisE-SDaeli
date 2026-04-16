import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
// OJO con la ruta al environment (desde .../features/maestro/dashboard → ../../../../)
import { environment } from '../../../../environments/environment';

export type Prioridad = 'alta' | 'media' | 'baja';

export interface Aviso {
  id: number;
  titulo: string;
  contenido: string;
  prioridad: Prioridad;
  activo: 0 | 1 | boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CreateAvisoDTO {
  titulo: string;
  contenido: string;
  prioridad: Prioridad;
  activo?: boolean | 0 | 1;
}

@Injectable({ providedIn: 'root' })
export class AvisosService {
  private http = inject(HttpClient);

  /** Base API: '/api' con proxy; si algún día cambias, ajústalo en environment */
  private readonly base = (environment.apiBase || '/api').replace(/\/+$/, '');  // Ajustado para usar apiBase
  private url(p: string) { return `${this.base}/${p.replace(/^\/+/, '')}`; }

  /** GET /api/avisos.php → lista completa */
  getTodos() {
    return this.http.get<{ success?: boolean; ok?: boolean; avisos?: Aviso[] }>(
      this.url('avisos.php')
    );
  }

  /** GET /api/avisos_activos.php → solo activos */
  getActivos() {
    return this.http.get<{ success?: boolean; ok?: boolean; avisos?: Aviso[] }>(
      this.url('avisos_activos.php')
    );
  }

  /** POST /api/avisos.php → crear */
  crear(data: CreateAvisoDTO) {
    return this.http.post<{ success?: boolean; ok?: boolean; id?: number }>(
      this.url('avisos.php'),
      data
    );
  }

  /**
   * POST /api/avisos_toggle.php → alternar activo/inactivo
   * (Tu backend expone avisos_toggle.php; suele esperar JSON { id } por POST)
   */
  toggle(id: number) {
    return this.http.post<{ success?: boolean; ok?: boolean }>(
      this.url('avisos_toggle.php'),
      { id }
    );
  }

  /** DELETE (o POST) /api/avisos_id.php → borrar por id
   * Si tu PHP no maneja DELETE, usa la variante POST (descomenta la que aplique).
   */
  borrar(id: number) {
    // Variante A: DELETE con querystring ?id=
    const params = new HttpParams().set('id', String(id));
    return this.http.delete<{ success?: boolean; ok?: boolean }>(
      this.url('avisos_id.php'),
      { params }
    );

    // Variante B (si tu PHP espera POST):
    // return this.http.post<{ success?: boolean; ok?: boolean }>(
    //   this.url('avisos_id.php'),
    //   { id, action: 'delete' }
    // );
  }

  /** (Opcional) Obtener por id si lo necesitas */
  obtenerPorId(id: number) {
    const params = new HttpParams().set('id', String(id));
    return this.http.get<{ success?: boolean; ok?: boolean; aviso?: Aviso }>(
      this.url('avisos_id.php'),
      { params }
    );
  }
}
