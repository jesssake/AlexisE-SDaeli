import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpHeaders,
  HttpClientModule,
  HttpParams,
} from '@angular/common/http';

export interface Estudiante {
  id: number;
  tutor_id: number | null;
  nombre: string;
  fecha_nacimiento: string | null;
  condiciones_medicas: string | null;
  activo: number;
  creado_en: string;
  actualizado_en: string;
  correo_tutor: string | null; // <- viene del JOIN (solo lectura)
  edad?: number | null;        // <- calculado en frontend
}

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './estudiantes.component.html',
  styleUrls: ['./estudiantes.component.scss'],
})
export class EstudiantesComponent implements OnInit {
  // ===== Estado UI =====
  cargando = false;
  errorCarga: string | null = null;

  // ===== Datos =====
  estudiantes: Estudiante[] = [];

  // ===== Modal =====
  modalAbierto = false;
  editando = false;

  // Form del modal (datos que edita el profe)
  form: {
    id?: number;
    nombre: string;
    fecha_nacimiento: string;        // YYYY-MM-DD
    tutor_id: string;                // se guarda como string en input, se manda como número
    correo_tutor: string;            // <- agregado para que el HTML no truene, pero NO se manda al backend
    condiciones_medicas: string;
    activo: number;                  // 1 o 0
  } = {
    nombre: '',
    fecha_nacimiento: '',
    tutor_id: '',
    correo_tutor: '',
    condiciones_medicas: '',
    activo: 1,
  };

private baseUrl = 'http://localhost/gestion_e/Estudiantes';


  private jsonHeaders = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.recargar();
  }

  /* ==========================================
   * GET - Cargar estudiantes
   * ========================================== */
  recargar(): void {
    this.cargando = true;
    this.errorCarga = null;

    this.http
      .get<{
        success: boolean;
        alumnos: any[];
      }>(`${this.baseUrl}/estudiantes.php`)
      .subscribe({
        next: (resp) => {
          this.cargando = false;

          if (!resp?.success) {
            this.errorCarga = 'Error al cargar estudiantes';
            this.estudiantes = [];
            return;
          }

          // Adaptar backend -> frontend
          this.estudiantes = (resp.alumnos || []).map((row: any) => {
            const fechaNac = row.fecha_nacimiento ?? null;
            const edad = this.calcularEdad(fechaNac);

            const est: Estudiante = {
              id: Number(row.id),
              tutor_id:
                row.tutor_id !== null && row.tutor_id !== undefined
                  ? Number(row.tutor_id)
                  : null,
              nombre: row.nombre ?? '',
              fecha_nacimiento: fechaNac,
              condiciones_medicas: row.condiciones_medicas ?? null,
              activo: Number(row.activo ?? 1),
              creado_en: row.creado_en ?? row.created_at ?? '',
              actualizado_en:
                row.actualizado_en ?? row.updated_at ?? '',
              correo_tutor: row.correo_tutor ?? null,
              edad,
            };

            return est;
          });
        },
        error: (err) => {
          console.error('GET estudiantes.php error:', err);
          this.cargando = false;
          this.errorCarga = 'Error al cargar estudiantes';
          this.estudiantes = [];
        },
      });
  }

  private calcularEdad(fecha: string | null): number | null {
    if (!fecha) return null;
    // fecha esperada: "YYYY-MM-DD"
    const parts = fecha.split('-');
    if (parts.length < 3) return null;

    const yyyy = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    const dd = parseInt(parts[2], 10);

    if (isNaN(yyyy) || isNaN(mm) || isNaN(dd)) return null;

    const nac = new Date(yyyy, mm - 1, dd);
    if (isNaN(nac.getTime())) return null;

    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();

    const mesDif = hoy.getMonth() - nac.getMonth();
    const diaDif = hoy.getDate() - nac.getDate();
    if (mesDif < 0 || (mesDif === 0 && diaDif < 0)) {
      edad--;
    }
    return edad;
  }

  /* ==========================================
   * MODAL NUEVO
   * ========================================== */
  abrirModalNuevo(): void {
    this.editando = false;
    this.form = {
      nombre: '',
      fecha_nacimiento: '',
      tutor_id: '',
      correo_tutor: '',            // <- limpio
      condiciones_medicas: '',
      activo: 1,
    };
    this.modalAbierto = true;
  }

  /* ==========================================
   * MODAL EDITAR
   * ========================================== */
  abrirModalEditar(e: Estudiante): void {
    this.editando = true;
    this.form = {
      id: e.id,
      nombre: e.nombre ?? '',
      fecha_nacimiento: e.fecha_nacimiento ?? '',
      tutor_id: e.tutor_id != null ? String(e.tutor_id) : '',
      correo_tutor: e.correo_tutor ?? '',   // <- mostramos lo que vino del backend
      condiciones_medicas: e.condiciones_medicas ?? '',
      activo: e.activo ?? 1,
    };
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  /* ==========================================
   * CREAR / ACTUALIZAR
   * ========================================== */
  guardar(): void {
    if (!this.form.nombre?.trim()) {
      this.toast('Ingresa el nombre del alumno', 'error');
      return;
    }

    if (!this.editando) {
      // ===== CREAR (POST estudiantes.php)
      const body = {
        tutor_id: this.form.tutor_id ? Number(this.form.tutor_id) : 0,
        nombre: this.form.nombre.trim(),
        fecha_nacimiento: this.form.fecha_nacimiento || null,
        condiciones_medicas: this.form.condiciones_medicas || null,
        activo: Number(this.form.activo ?? 1),
        // NOTA: correo_tutor NO se envía aquí porque pertenece al tutor
      };

      this.http
        .post<{
          success: boolean;
          message?: string;
          id?: number;
        }>(`${this.baseUrl}/estudiantes.php`, body, this.jsonHeaders)
        .subscribe({
          next: (res) => {
            if (!res?.success) {
              console.error('crear alumno FAIL:', res);
              this.toast(res?.message || 'No se pudo crear', 'error');
              return;
            }
            this.toast('Estudiante agregado', 'success');
            this.cerrarModal();
            this.recargar();
          },
          error: (err) => {
            console.error('POST estudiantes.php error:', err);
            this.toast('Error al agregar estudiante', 'error');
          },
        });

    } else {
      // ===== EDITAR (PUT actualizar_nino.php?id=###)
      if (!this.form.id) {
        this.toast('ID inválido', 'error');
        return;
      }

      // Sólo mandamos los campos que el backend acepta actualizar:
      // tutor_id, nombre, fecha_nacimiento, condiciones_medicas, activo
      const patch: any = {
        tutor_id: this.form.tutor_id
          ? Number(this.form.tutor_id)
          : undefined,
        nombre: this.form.nombre.trim(),
        fecha_nacimiento: this.form.fecha_nacimiento || null,
        condiciones_medicas: this.form.condiciones_medicas || null,
        activo: Number(this.form.activo ?? 1),
        // correo_tutor NO se manda
      };

      // limpiar undefined (para que no se mande basura)
      Object.keys(patch).forEach((k) => {
        if (patch[k] === undefined) delete patch[k];
      });

      this.http
        .put<{
          success: boolean;
          message?: string;
        }>(
          `${this.baseUrl}/actualizar_nino.php?id=${this.form.id}`,
          patch,
          this.jsonHeaders
        )
        .subscribe({
          next: (res) => {
            if (!res?.success) {
              console.error('actualizar alumno FAIL:', res);
              this.toast(res?.message || 'No se pudo actualizar', 'error');
              return;
            }
            this.toast('Cambios guardados', 'success');
            this.cerrarModal();
            this.recargar();
          },
          error: (err) => {
            console.error('PUT actualizar_nino.php error:', err);
            this.toast('Error al guardar cambios', 'error');
          },
        });
    }
  }

  /* ==========================================
   * ELIMINAR
   * ========================================== */
  confirmarEliminar(e: Estudiante): void {
    if (!e?.id) return;
    const ok = window.confirm(
      `¿Eliminar al estudiante "${e.nombre}" (#${e.id})?`
    );
    if (!ok) return;

    const params = new HttpParams().set('id', String(e.id));

    this.http
      .delete<{
        success: boolean;
        message?: string;
      }>(`${this.baseUrl}/eliminar_nino.php`, { params })
      .subscribe({
        next: (res) => {
          if (!res?.success) {
            console.error('eliminar alumno FAIL:', res);
            this.toast(res?.message || 'No se pudo eliminar', 'error');
            return;
          }
          this.toast('Estudiante eliminado', 'success');
          this.recargar();
        },
        error: (err) => {
          console.error('DELETE eliminar_nino.php error:', err);
          this.toast('Error al eliminar', 'error');
        },
      });
  }

  /* ==========================================
   * Toast simple visual
   * ========================================== */
  private toast(
    msg: string,
    type: 'info' | 'success' | 'error' = 'info'
  ): void {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    Object.assign(el.style, {
      position: 'fixed',
      right: '16px',
      bottom: '16px',
      background:
        type === 'success'
          ? 'rgba(16,185,129,.95)'
          : type === 'error'
          ? 'rgba(239,68,68,.95)'
          : 'rgba(99,102,241,.95)',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: '10px',
      zIndex: '9999',
      boxShadow: '0 10px 25px rgba(0,0,0,.35)',
      fontSize: '13px',
      fontWeight: '600',
    } as CSSStyleDeclaration);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}
