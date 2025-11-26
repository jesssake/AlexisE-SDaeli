import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ChatPanelComponent } from './chat-panel.component';

interface PadreFila {
  alumno_id: number;
  alumno_nombre: string;
  tutor_id: number | null;
  tutor_nombre: string | null;
  tutor_correo: string | null;
}

@Component({
  selector: 'app-padres',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ChatPanelComponent],
  templateUrl: './padres.component.html',
  styleUrls: ['./padres.component.scss'],
})
export class PadresComponent implements OnInit {
  private readonly baseUrl = '/api/chat/tutores_del_maestro.php';

  private get maestroId(): number {
    const x = Number(localStorage.getItem('maestro_id'));
    return Number.isFinite(x) && x > 0 ? x : 1;
  }

  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  private _padres = signal<PadreFila[]>([]);
  get padres() { return this._padres(); }

  filtro = signal<string>('');
  ordenCampo = signal<'alumno' | 'tutor' | 'correo'>('alumno');
  ordenAsc = signal<boolean>(true);

  chatAbierto = signal<boolean>(false);
  selAlumnoId = signal<number | null>(null);
  selTutorId = signal<number | null>(null);
  selTitulo = signal<string>('Chat con Tutor');

  listaFiltradaOrdenada = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    const campo = this.ordenCampo();
    const asc = this.ordenAsc();
    const base = this._padres();

    const filtrada = q
      ? base.filter(r =>
          (`${r.alumno_nombre} ${r.tutor_nombre ?? ''} ${r.tutor_correo ?? ''}`)
            .toLowerCase().includes(q)
        )
      : base;

    const sorted = [...filtrada].sort((a, b) => {
      const get = (x: PadreFila) =>
        campo === 'alumno' ? (x.alumno_nombre ?? '') :
        campo === 'tutor'  ? (x.tutor_nombre  ?? '') :
                             (x.tutor_correo  ?? '');
      const A = (get(a) || '').toLowerCase();
      const B = (get(b) || '').toLowerCase();
      if (A < B) return asc ? -1 : 1;
      if (A > B) return asc ?  1 : -1;
      return 0;
    });

    return sorted;
  });

  readonly dummyRows = Array.from({ length: 8 });

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.cargarPadres(); }

  cargarPadres() {
    this.cargando.set(true);
    this.error.set(null);

    const params = new HttpParams().set('maestro_id', String(this.maestroId));

    this.http.get<any[]>(this.baseUrl, { params }).subscribe({
      next: (rows) => {
        console.log('tutores_del_maestro.php rows:', rows);
        const normalizados: PadreFila[] = (rows ?? []).map((r: any) => {
          let alumno_id: any =
            r.alumno_id ?? r.nino_id ?? r.id_alumno ?? r.alumnoId ??
            r.id_nino ?? r.id ?? r.alumno;

          if (typeof alumno_id === 'string') {
            const m = alumno_id.match(/\d+/);
            alumno_id = m ? Number(m[0]) : 0;
          }

          const tutor_id: any =
            r.tutor_id ?? r.id_tutor ?? r.tutorId ?? r.id_padre ?? null;

          return {
            alumno_id: Number(alumno_id || 0),
            alumno_nombre: String(
              r.alumno_nombre ?? r.nino_nombre ?? r.alumno ?? r.nombre_alumno ?? r.nombre ?? ''
            ),
            tutor_id: tutor_id != null ? Number(tutor_id) : null,
            tutor_nombre: (r.tutor_nombre ?? r.tutor ?? r.nombre_tutor ?? r.padre ?? null) as string | null,
            tutor_correo: (r.tutor_correo ?? r.email_tutor ?? r.correo_tutor ?? r.email ?? null) as string | null,
          };
        });

        this._padres.set(normalizados);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('tutores_del_maestro.php error:', err);
        this.error.set('No se pudo cargar la lista (revisa maestro_id o nombres de campos en PHP).');
        this.cargando.set(false);
      }
    });
  }

  aplicarFiltro() {}

  toggleOrdenDir() { this.ordenAsc.set(!this.ordenAsc()); }

  abrirChatInline(row: PadreFila) {
    if (!row) return;

    if (!row.alumno_id || row.alumno_id <= 0) {
      // Informo, pero dejo abrir con tutor_id (el panel usará tutor_id + maestro_id)
      alert('No se encontró un ID de alumno en la fila. Abriremos el chat usando Tutor + Maestro.\n' +
            'Revisa que tutores_del_maestro.php devuelva el id del alumno.');
    }

    this.selAlumnoId.set(row.alumno_id || 0);
    this.selTutorId.set(row.tutor_id ?? null);
    this.selTitulo.set(`Chat: ${row.alumno_nombre}${row.tutor_nombre ? ' · ' + row.tutor_nombre : ''}`);
    this.chatAbierto.set(true);
  }

  cerrarChatInline() {
    this.chatAbierto.set(false);
    this.selAlumnoId.set(null);
    this.selTutorId.set(null);
  }

  trackByAlumno = (_: number, r: PadreFila) => r.alumno_id;
}
