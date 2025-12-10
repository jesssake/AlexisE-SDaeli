// src/app/features/Estudiantes/padres/padres.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChatPanelComponent } from '../../maestro/padres/chat-panel.component'; // ajusta la ruta si es otra

interface TutorAlumnoRow {
  alumno_id: number;
  alumno_nombre: string | null;
  tutor_id: number | null;
  tutor_nombre: string | null;
  tutor_correo: string | null;
}

@Component({
  selector: 'app-padres',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ChatPanelComponent],
  templateUrl: './padres.component.html',
  styleUrls: ['./padres.component.scss'],
})
export class PadresComponent implements OnInit {
  // Endpoint que ya tienes
  private readonly baseUrl = '/api/chat/tutores_del_maestro.php';

  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  alumnoId = signal<number | null>(null);
  alumnoNombre = signal<string | null>(null);

  tutorId = signal<number | null>(null);
  tutorNombre = signal<string | null>(null);
  tutorCorreo = signal<string | null>(null);

  chatAbierto = signal<boolean>(false);
  tituloChat = signal<string>('Chat con mi tutor');

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const idDetectado = this.detectarAlumnoId();
    this.alumnoId.set(idDetectado || null);

    // ✅ Ya NO marcamos error si no se detecta el ID.
    // En su lugar, cargamos los datos y, si no hay id, usamos el primer alumno de la lista.
    this.cargarDatosTutor(idDetectado ?? undefined);
  }

  // ==========================
  // Helpers
  // ==========================

  /** Intenta encontrar el id del alumno en localStorage o en la URL */
  private detectarAlumnoId(): number | null {
    // 1) Varios posibles nombres en localStorage
    const posiblesKeys = [
      'alumno_id',
      'nino_id',
      'id_nino',
      'id_alumno',
      'alumnoId',
      'idAlumno',
    ];

    for (const key of posiblesKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const num = Number(raw);
      if (Number.isFinite(num) && num > 0) {
        console.log('[PadresAlumno] ID detectado desde localStorage:', key, num);
        return num;
      }
    }

    // 2) Parámetros en la URL (?alumno_id= / ?nino_id= / ?id_alumno= / ?idAlumno=)
    try {
      const params = new URLSearchParams(window.location.search);
      const paramKeys = ['alumno_id', 'nino_id', 'id_alumno', 'idAlumno'];

      for (const k of paramKeys) {
        const v = params.get(k);
        if (!v) continue;
        const num = Number(v);
        if (Number.isFinite(num) && num > 0) {
          console.log('[PadresAlumno] ID detectado desde URL:', k, num);
          return num;
        }
      }
    } catch {
      // ignorar
    }

    console.warn('[PadresAlumno] No se detectó alumno_id ni en storage ni en URL');
    return null;
  }

  /**
   * Carga la info de alumno+tutor:
   * - Si idAlumno viene, busca esa fila.
   * - Si NO viene, toma la primera fila de la lista (para demo / pruebas).
   */
  private cargarDatosTutor(idAlumno?: number) {
    this.cargando.set(true);
    this.error.set(null);

    this.http.get<any[]>(this.baseUrl).subscribe({
      next: (rows) => {
        const lista = (rows ?? []) as any[];

        const normalizados: TutorAlumnoRow[] = lista.map((r) => {
          let alumno_id: any =
            r.alumno_id ?? r.nino_id ?? r.id_alumno ?? r.id ?? r.alumno;
          if (typeof alumno_id === 'string') {
            const m = alumno_id.match(/\d+/);
            alumno_id = m ? Number(m[0]) : 0;
          }

          const tutor_id: any =
            r.tutor_id ?? r.id_tutor ?? r.tutorId ?? r.id_padre ?? null;

          return {
            alumno_id: Number(alumno_id || 0),
            alumno_nombre: (r.alumno_nombre ??
              r.nino_nombre ??
              r.alumno ??
              r.nombre_alumno ??
              r.nombre ??
              null) as string | null,
            tutor_id: tutor_id != null ? Number(tutor_id) : null,
            tutor_nombre: (r.tutor_nombre ??
              r.tutor ??
              r.nombre_tutor ??
              r.padre ??
              null) as string | null,
            tutor_correo: (r.tutor_correo ??
              r.email_tutor ??
              r.correo_tutor ??
              r.email ??
              null) as string | null,
          };
        });

        if (!normalizados.length) {
          this.error.set(
            'No se encontraron alumnos/tutores registrados. Consulta con el maestro.'
          );
          this.cargando.set(false);
          return;
        }

        // 👉 Elegimos la fila:
        let fila: TutorAlumnoRow | null = null;

        if (idAlumno && idAlumno > 0) {
          fila = normalizados.find((x) => x.alumno_id === idAlumno) ?? null;
        }

        // Si no se encontró por ID o no había ID → tomamos el primero de la lista
        if (!fila) {
          fila = normalizados[0];
          // de paso guardamos ese id en alumnoId para que el chat funcione
          this.alumnoId.set(fila.alumno_id);
          console.warn(
            '[PadresAlumno] Usando primer alumno de la lista como fallback:',
            fila
          );
        }

        this.alumnoNombre.set(fila.alumno_nombre ?? 'Alumno');
        this.tutorId.set(fila.tutor_id);
        this.tutorNombre.set(fila.tutor_nombre);
        this.tutorCorreo.set(fila.tutor_correo);

        const titulo =
          'Chat: ' +
          (fila.alumno_nombre ?? 'Alumno') +
          ' · ' +
          (fila.tutor_nombre ?? 'Tutor');
        this.tituloChat.set(titulo);

        this.cargando.set(false);
      },
      error: (err) => {
        console.error('tutores_del_maestro.php error (alumno):', err);
        this.error.set(
          'No se pudo cargar la información de tu tutor. Intenta más tarde.'
        );
        this.cargando.set(false);
      },
    });
  }

  // ==========================
  // Chat
  // ==========================

  abrirChat() {
    if (!this.alumnoId()) {
      alert(
        'No se pudo determinar tu ID de alumno. Verifica con el administrador.'
      );
      return;
    }
    this.chatAbierto.set(true);
  }

  cerrarChat() {
    this.chatAbierto.set(false);
  }
}
