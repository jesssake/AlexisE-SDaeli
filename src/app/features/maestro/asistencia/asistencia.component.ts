import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';

interface RegistroAsistencia {
  estudiante_id: number;
  nombre: string;
  edad?: number | null;

  estado: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO' | ''; // '' = sin marcar todavía
  comentario_maestro: string;
}

interface GuardarResponse {
  ok: boolean;
  message?: string;
  rows?: number;
}

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.scss'],
})
export class AsistenciaComponent implements OnInit {
  // 🚨 Nota: luego esto lo sacamos del AuthService del maestro logeado
  private readonly MAESTRO_ID = 1;

  // ===== filtros de la toma actual =====
  fecha: string = this.hoyISO(); // yyyy-MM-dd
  horaClase: string = '08:00';   // HH:mm

  // ===== estado UI =====
  cargando = false;
  guardando = false;
  errorMsg: string | null = null;
  okMsg: string | null = null;

  // ===== datos =====
  registros: RegistroAsistencia[] = [];

  // ===== endpoints backend PHP =====
  // OJO: estas URLs tienen que coincidir con tus rutas reales en XAMPP
  private apiListaUrl = 'http://localhost/gestion_e/Asistencia/lista.php';
  private apiGuardarUrl = 'http://localhost/gestion_e/Asistencia/guardar.php';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarRegistros();
  }

  // ================================
  // Helpers
  // ================================
  private hoyISO(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  get hayRegistros(): boolean {
    return this.registros && this.registros.length > 0;
  }

  // ================================
  // Cargar lista desde backend
  // ================================
  cargarRegistros(): void {
    // si ya está cargando, no disparamos otra
    if (this.cargando) return;

    this.cargando = true;
    this.errorMsg = null;
    this.okMsg = null;

    const params = {
      maestro_id: this.MAESTRO_ID,
      fecha: this.fecha,
      hora_clase: this.horaClase,
    };

    this.http.get<any>(this.apiListaUrl, { params }).subscribe({
      next: (data) => {
        // el backend responde un array de alumnos:
        // [
        //   { estudiante_id, nombre, edad, estado, comentario_maestro },
        //   ...
        // ]
        if (Array.isArray(data)) {
          this.registros = data.map((item: any) => ({
            estudiante_id: item.estudiante_id,
            nombre: item.nombre,
            edad: item.edad ?? null,
            estado: item.estado ?? '',
            comentario_maestro: item.comentario_maestro ?? ''
          }));
        } else {
          // si no vino un arreglo, lo tomamos como error de formato
          this.errorMsg = 'Respuesta inesperada del servidor.';
          this.registros = [];
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar asistencia', err);
        this.errorMsg = 'No se pudo cargar la lista de alumnos.';
        this.registros = [];
        this.cargando = false;
      },
    });
  }

  // ================================
  // Cambiar estado (radio buttons)
  // ================================
  marcarEstado(
    reg: RegistroAsistencia,
    nuevoEstado: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO'
  ): void {
    reg.estado = nuevoEstado;
  }

  // ================================
  // Guardar asistencia en backend
  // ================================
  guardarAsistencia(): void {
    if (this.guardando) return; // evita doble click spam

    this.guardando = true;
    this.errorMsg = null;
    this.okMsg = null;

    // armamos body EXACTO como lo espera guardar.php
    const body = {
      maestro_id: this.MAESTRO_ID,
      fecha: this.fecha,
      hora_clase: this.horaClase,
      registros: this.registros.map(r => ({
        estudiante_id: r.estudiante_id,
        estado: r.estado || 'AUSENTE', // default si no marcaron nada
        comentario_maestro: r.comentario_maestro || ''
      })),
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    this.http
      .post<GuardarResponse>(this.apiGuardarUrl, body, { headers })
      .subscribe({
        next: (resp) => {
          if (resp && resp.ok) {
            this.okMsg = resp.message || 'Asistencia guardada ✔';
            // recargamos la lista desde el servidor
            // para que lo que ves sea lo que está en la BD
            this.cargarRegistros();
          } else {
            this.errorMsg =
              (resp && resp.message) ||
              'No se pudo guardar asistencia.';
          }

          this.guardando = false;
        },
        error: (err) => {
          console.error('Error al guardar asistencia', err);
          this.errorMsg = 'Error al guardar asistencia.';
          this.guardando = false;
        },
      });
  }
}
