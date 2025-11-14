// src/app/features/maestro/asistencia/asistencia.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpParams,
} from '@angular/common/http';

interface RegistroAsistencia {
  estudiante_id: number;
  nombre: string;
  edad?: number | null;
  estado: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO' | ''; // '' = sin marcar
  comentario_maestro: string;
}

interface ListaResponse {
  ok: boolean;
  params?: any;
  alumnos?: RegistroAsistencia[];
  message?: string;
  error?: string;
}

interface GuardarResponse {
  ok: boolean;
  message?: string;
  rows?: number;
  error?: string;
}

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.scss'],
})
export class AsistenciaComponent implements OnInit {
  // 🔐 Luego esto se obtendrá del login del maestro
  private readonly MAESTRO_ID = 1;

  // ===== filtros =====
  fecha: string = this.hoyISO(); // yyyy-MM-dd
  horaClase: string = '08:00';   // HH:mm

  // ===== estado UI =====
  cargando = false;
  guardando = false;
  errorMsg: string | null = null;
  okMsg: string | null = null;

  // ===== datos =====
  registros: RegistroAsistencia[] = [];

  // ===== endpoints =====
  private apiListaUrl   = 'http://localhost/gestion_e/Asistencia/lista.php';
  private apiGuardarUrl = 'http://localhost/gestion_e/Asistencia/guardar.php';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarRegistros();
  }

  // ======================== UTILIDADES ========================

  private hoyISO(): string {
    const d = new Date();
    const offsetMs = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offsetMs);
    return local.toISOString().substring(0, 10);
  }

  get totalAlumnos(): number {
    return this.registros.length;
  }
  get totalPresentes(): number {
    return this.registros.filter(r => r.estado === 'PRESENTE').length;
  }
  get totalAusentes(): number {
    return this.registros.filter(r => r.estado === 'AUSENTE').length;
  }
  get totalJustificados(): number {
    return this.registros.filter(r => r.estado === 'JUSTIFICADO').length;
  }
  get totalSinMarcar(): number {
    return this.registros.filter(r => r.estado === '').length;
  }

  // ================== EVENTOS UI ==================

  onFechaChange(): void {
    this.cargarRegistros();
  }

  onHoraChange(): void {
    // Si quieres que recargue cuando cambie la hora:
    // this.cargarRegistros();
  }

  marcarEstado(
    reg: RegistroAsistencia,
    estado: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO'
  ): void {
    reg.estado = estado;
  }

  // ================== CARGAR LISTA ==================

  cargarRegistros(): void {
    this.cargando = true;
    this.errorMsg = null;
    this.okMsg = null;
    this.registros = [];

    // A backend le mandamos hora con segundos
    const horaNormalizada =
      this.horaClase.length === 5 ? this.horaClase + ':00' : this.horaClase;

    const params = new HttpParams()
      .set('maestro_id', String(this.MAESTRO_ID))
      .set('fecha', this.fecha)
      .set('hora_clase', horaNormalizada);

    this.http.get<ListaResponse>(this.apiListaUrl, { params }).subscribe({
      next: (res) => {
        if (!res.ok) {
          console.error('Respuesta no OK:', res);
          this.errorMsg =
            res.message ||
            res.error ||
            'No se pudo cargar la lista de alumnos.';
          this.cargando = false;
          return;
        }

        const alumnos = res.alumnos || [];
        this.registros = alumnos.map((a) => ({
          estudiante_id: a.estudiante_id,
          nombre: a.nombre,
          edad: a.edad ?? null,
          estado: (a.estado || '') as any,
          comentario_maestro: a.comentario_maestro || '',
        }));

        if (this.registros.length === 0) {
          this.okMsg = 'No hay alumnos registrados para esta fecha/hora.';
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar asistencia', err);
        this.errorMsg = 'No se pudo cargar la lista de alumnos.';
        this.cargando = false;
      },
    });
  }

  // ================== GUARDAR ==================

  guardarAsistencia(): void {
    if (this.registros.length === 0) {
      this.errorMsg = 'No hay registros para guardar.';
      return;
    }

    this.guardando = true;
    this.errorMsg = null;
    this.okMsg = null;

    const horaNormalizada =
      this.horaClase.length === 5 ? this.horaClase + ':00' : this.horaClase;

    const payload = {
      maestro_id: this.MAESTRO_ID,
      fecha: this.fecha,
      hora_clase: horaNormalizada,
      registros: this.registros.map((r) => ({
        estudiante_id: r.estudiante_id,
        estado: r.estado,
        comentario_maestro: r.comentario_maestro,
      })),
    };

    this.http.post<GuardarResponse>(this.apiGuardarUrl, payload).subscribe({
      next: (res) => {
        if (!res.ok) {
          console.error('Error al guardar:', res);
          this.errorMsg =
            res.message || res.error || 'Ocurrió un error al guardar.';
        } else {
          this.okMsg = res.message || 'Asistencia guardada correctamente.';

          // 🔁 Dejar todo "nuevo": sin estado y sin comentario
          this.registros = this.registros.map((r) => ({
            ...r,
            estado: '',
            comentario_maestro: '',
          }));
        }
        this.guardando = false;
      },
      error: (err) => {
        console.error('Error HTTP al guardar asistencia', err);
        this.errorMsg = 'No se pudo guardar la asistencia.';
        this.guardando = false;
      },
    });
  }
}
