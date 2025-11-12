import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpParams,
} from '@angular/common/http';

interface AlumnoPerfil {
  id: number;
  nombre: string;
  email: string;

  rol?: string | null;
  tipo?: string | null;
  avatar_url?: string | null;

  creado_en?: string | null;
  actualizado_en?: string | null;
  notificaciones_email?: boolean;

  tutor_id?: number | null;
  tutor_nombre?: string | null;
  tutor_email?: string | null;
  fecha_nacimiento?: string | null;
  condiciones_medicas?: string | null;
  activo?: number | boolean;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss'],
})
export class ConfiguracionComponent implements OnInit {
  // proxy: /configuracion -> http://localhost/gestion_e/configuracion
  private readonly API = '/configuracion';

  // ---- estado general ----
  alumno = signal<AlumnoPerfil | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  editando = signal(false);

  cambiandoPass = signal(false);   // ¿se está mostrando el form de pass?
  guardandoPass = signal(false);   // ¿estamos enviando la nueva pass?
  subiendoAvatar = signal(false);

  error = signal<string | null>(null);
  exito = signal<string | null>(null);
  errorPass = signal<string | null>(null);
  exitoPass = signal<string | null>(null);
  errorAvatar = signal<string | null>(null);
  exitoAvatar = signal<string | null>(null);

  alumnoEmail: string | null = null;
  alumnoId: number | null = null;

  // ---- formulario principal ----
  form = {
    nombre: '',
    email: '',
    tipo: '',
    fecha_nacimiento: '',
    condiciones_medicas: '',
    notificaciones: true,
    avatar_url: '',
  };

  // ---- formulario contraseña ----
  passForm = {
    actual: '',
    nueva: '',
    confirmar: '',
  };

  // ---- derivados ----
  nombreCorto = computed(() => {
    const nombre = this.alumno()?.nombre || 'Alumno';
    return nombre.split(' ')[0];
  });

  avatarPreview = computed(() => {
    if (this.form.avatar_url?.trim()) {
      return this.form.avatar_url.trim();
    }
    return this.alumno()?.avatar_url || null;
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.resolverIdentidad();
    console.warn(
      '[ConfigAlumno] Detectado alumnoId=',
      this.alumnoId,
      'email=',
      this.alumnoEmail
    );

    if (this.alumnoId || this.alumnoEmail) {
      this.cargarPerfil();
    }
  }

  // ======================================================
  //  RESOLVER IDENTIDAD DEL ALUMNO
  // ======================================================
  private resolverIdentidad(): void {
    const params = new URLSearchParams(window.location.search);

    // 1) URL
    const idFromUrl = params.get('alumno_id');
    const emailFromUrl = params.get('alumno_email');

    // 2) Storage de otros módulos
    const idFromStorageDirect = localStorage.getItem('alumno_id');
    const idFromStoragePadres = localStorage.getItem('padres_alumno_id');
    const idFromStorageGeneric = localStorage.getItem('alumnoSeleccionadoId');

    const emailFromStorageAlumno = localStorage.getItem('alumno_email');

    const rawId =
      idFromUrl ||
      idFromStorageDirect ||
      idFromStoragePadres ||
      idFromStorageGeneric ||
      null;

    this.alumnoId = rawId ? Number(rawId) : null;
    this.alumnoEmail = emailFromUrl || emailFromStorageAlumno || null;

    // 3) Intentar leer el objeto de usuario guardado en el login
    if (!this.alumnoId && !this.alumnoEmail) {
      const rawUser =
        localStorage.getItem('usuario') ||
        localStorage.getItem('user') ||
        localStorage.getItem('currentUser') ||
        localStorage.getItem('auth_user');

      if (rawUser) {
        try {
          const u = JSON.parse(rawUser);

          const emailLogin = u.email || u.correo || null;
          const alumnoIdFromUser = u.alumno_id || u.nino_id || u.alumnoId || null;

          if (alumnoIdFromUser) {
            this.alumnoId = Number(alumnoIdFromUser);
            localStorage.setItem('alumno_id', String(this.alumnoId));
          }

          if (emailLogin && !this.alumnoEmail) {
            this.alumnoEmail = emailLogin;
            localStorage.setItem('alumno_email', emailLogin);
          }

          console.warn(
            '[ConfigAlumno] Tomando datos desde objeto usuario almacenado:',
            u
          );
        } catch (e) {
          console.warn(
            '[ConfigAlumno] No se pudo parsear usuario de localStorage',
            e
          );
        }
      }
    }

    // 4) Último fallback: email simple
    if (!this.alumnoId && !this.alumnoEmail) {
      const emailLoginSimple =
        localStorage.getItem('usuario_email') ||
        localStorage.getItem('user_email') ||
        localStorage.getItem('email');

      if (emailLoginSimple) {
        this.alumnoEmail = emailLoginSimple;
        localStorage.setItem('alumno_email', emailLoginSimple);
        console.warn(
          '[ConfigAlumno] Usando email de login simple:',
          emailLoginSimple
        );
      } else {
        console.warn(
          '[ConfigAlumno] No se pudo resolver alumno desde URL, storage ni usuario guardado.'
        );
      }
    }

    // 5) Guardar en storage
    if (this.alumnoId && !idFromStorageDirect) {
      localStorage.setItem('alumno_id', String(this.alumnoId));
    }
    if (this.alumnoEmail && !emailFromStorageAlumno) {
      localStorage.setItem('alumno_email', this.alumnoEmail);
    }
  }

  // ======================================================
  //  CARGAR PERFIL
  // ======================================================
  cargarPerfil(): void {
    if (!this.alumnoId && !this.alumnoEmail) {
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    this.exito.set(null);

    let params = new HttpParams();
    if (this.alumnoId) {
      params = params.set('alumno_id', String(this.alumnoId));
    } else if (this.alumnoEmail) {
      params = params.set('alumno_email', this.alumnoEmail);
    }

    this.http
      .get<string>(`${this.API}/perfil_alumno.php`, {
        params,
        responseType: 'text' as 'json',
      })
      .subscribe({
        next: (raw: any) => {
          try {
            const text = String(raw);
            console.log('[ConfigAlumno] Respuesta cruda PHP:', text);

            const data = JSON.parse(text) as AlumnoPerfil;
            console.log('[ConfigAlumno] JSON parseado:', data);

            this.alumno.set(data);
            this.sincronizarFormulario(data);
          } catch (e) {
            console.error(
              '[ConfigAlumno] Error parseando JSON de perfil_alumno.php',
              e,
              raw
            );
            this.error.set(
              'Error al interpretar la respuesta del servidor (perfil).'
            );
          } finally {
            this.cargando.set(false);
          }
        },
        error: (err) => {
          console.error('Error cargando perfil de alumno', err);
          this.error.set(
            'No se pudo cargar tu información. Inténtalo más tarde.'
          );
          this.cargando.set(false);
        },
      });
  }

  private sincronizarFormulario(a: AlumnoPerfil): void {
    this.form.nombre = a.nombre || '';
    this.form.email = a.email || '';
    this.form.tipo = a.tipo || '';
    this.form.fecha_nacimiento = a.fecha_nacimiento || '';
    this.form.condiciones_medicas = a.condiciones_medicas || '';
    this.form.notificaciones =
      typeof a.notificaciones_email === 'boolean'
        ? a.notificaciones_email
        : true;
    this.form.avatar_url = a.avatar_url || '';
  }

  // ======================================================
  //  EDITAR / CANCELAR
  // ======================================================
  activarEdicion(): void {
    if (!this.alumno()) return;
    this.editando.set(true);
    this.error.set(null);
    this.exito.set(null);
  }

  cancelarEdicion(): void {
    const a = this.alumno();
    if (!a) return;
    this.sincronizarFormulario(a);
    this.editando.set(false);
    this.error.set(null);
    this.exito.set(null);
  }

  // ======================================================
  //  GUARDAR PERFIL
  // ======================================================
  guardarCambios(formRef: NgForm): void {
    if (!this.alumno() || !this.editando() || formRef.invalid) {
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    this.exito.set(null);

    const payload = {
      id: this.alumno()!.id,
      nombre: this.form.nombre,
      email: this.form.email,
      tipo: this.form.tipo,
      fecha_nacimiento: this.form.fecha_nacimiento,
      condiciones_medicas: this.form.condiciones_medicas,
      notificaciones_email: this.form.notificaciones,
      avatar_url: this.form.avatar_url,
    };

    this.http
      .post<{ ok: boolean; mensaje?: string }>(
        `${this.API}/guardar_perfil.php`,
        payload
      )
      .subscribe({
        next: (resp) => {
          if (resp.ok) {
            this.alumno.set({
              ...this.alumno()!,
              ...payload,
            });
            this.exito.set('Cambios guardados correctamente.');
            this.editando.set(false);
          } else {
            this.error.set(
              resp.mensaje || 'No se pudieron guardar los cambios.'
            );
          }
          this.guardando.set(false);
        },
        error: (err) => {
          console.error('Error guardando perfil', err);
          this.error.set('Ocurrió un error al guardar. Inténtalo más tarde.');
          this.guardando.set(false);
        },
      });
  }

  // ======================================================
  //  CAMBIO DE CONTRASEÑA
  // ======================================================
  abrirCambioPass(): void {
    this.passForm.actual = '';
    this.passForm.nueva = '';
    this.passForm.confirmar = '';
    this.errorPass.set(null);
    this.exitoPass.set(null);
    this.cambiandoPass.set(true);
  }

  cancelarCambioPass(): void {
    this.cambiandoPass.set(false);
    this.errorPass.set(null);
    this.exitoPass.set(null);
  }

  guardarNuevaPass(form: NgForm): void {
    if (!this.alumno() || form.invalid) return;

    if (this.passForm.nueva !== this.passForm.confirmar) {
      this.errorPass.set('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    // IMPORTANTE: usamos el correo del tutor si existe, si no el email del perfil
    const correoParaCambio =
      this.alumno()?.tutor_email || this.alumno()?.email || this.alumnoEmail;

    if (!correoParaCambio) {
      this.errorPass.set(
        'No se encontró un correo válido para cambiar la contraseña.'
      );
      return;
    }

    this.guardandoPass.set(true);
    this.errorPass.set(null);
    this.exitoPass.set(null);

    const payload = {
      // puedes dejar alumno_id por si tu PHP lo usa,
      // pero lo importante es el email del usuario en "usuarios"
      alumno_id: this.alumno()?.id ?? null,
      email: correoParaCambio,
      pass_actual: this.passForm.actual,
      pass_nueva: this.passForm.nueva,
    };

    this.http
      .post<{ ok: boolean; mensaje?: string }>(
        `${this.API}/cambiar_password.php`,
        payload
      )
      .subscribe({
        next: (resp) => {
          if (resp.ok) {
            this.exitoPass.set('Contraseña actualizada correctamente.');
            this.passForm.actual = '';
            this.passForm.nueva = '';
            this.passForm.confirmar = '';
            this.cambiandoPass.set(false);
          } else {
            this.errorPass.set(
              resp.mensaje || 'No se pudo cambiar la contraseña.'
            );
          }
          this.guardandoPass.set(false);
        },
        error: (err) => {
          console.error('Error cambiando contraseña', err);
          this.errorPass.set(
            'Ocurrió un error al cambiar la contraseña. Inténtalo más tarde.'
          );
          this.guardandoPass.set(false);
        },
      });
  }

  // ======================================================
  //  AVATAR DESDE ARCHIVO
  // ======================================================
  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.subiendoAvatar.set(true);
    this.errorAvatar.set(null);
    this.exitoAvatar.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;

      const payload = {
        alumno_id: this.alumno()!.id,
        imagen_base64: base64,
        nombre_archivo: file.name,
      };

      this.http
        .post<{ ok: boolean; url?: string; mensaje?: string }>(
          `${this.API}/guardar_avatar.php`,
          payload
        )
        .subscribe({
          next: (resp) => {
            if (resp.ok && resp.url) {
              this.form.avatar_url = resp.url;
              this.alumno.set({
                ...this.alumno()!,
                avatar_url: resp.url,
              });
              this.exitoAvatar.set('Foto actualizada correctamente.');
            } else {
              this.errorAvatar.set(
                resp.mensaje || 'No se pudo actualizar la foto.'
              );
            }
            this.subiendoAvatar.set(false);
          },
          error: (err) => {
            console.error('Error subiendo avatar', err);
            this.errorAvatar.set(
              'Ocurrió un error al subir la foto. Inténtalo más tarde.'
            );
            this.subiendoAvatar.set(false);
          },
        });
    };

    reader.onerror = () => {
      this.subiendoAvatar.set(false);
      this.errorAvatar.set('No se pudo leer el archivo seleccionado.');
    };

    reader.readAsDataURL(file);
  }

  alumnoActual(): AlumnoPerfil | null {
    return this.alumno();
  }
}
