import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';

type Estado = 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO';

interface Registro {
  fecha: string;  // YYYY-MM-DD
  hora:  string;  // HH:mm
  estado: string; // 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO'
  comentario: string;
  maestro_id: number;
}

interface RespuestaHistorial {
  ok: boolean;
  alumno_id: number;
  rango: { desde: string; hasta: string; };
  totales: { PRESENTE: number; AUSENTE: number; JUSTIFICADO: number; };
  registros: Registro[];
}

@Component({
  selector: 'app-est-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.scss'],
})
export class EstudianteAsistenciaComponent implements OnInit {

  cargando = false;
  error: string | null = null;

  // filtros
  modo = 'mes'; // 'mes' | 'rango'
  anio = new Date().getFullYear();
  mes  = new Date().getMonth() + 1; // 1-12

  desde = '';
  hasta = '';

  // datos
  alumnoId: number | null = null;
  registros: Registro[] = [];
  totales = { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0 };

  // endpoints
private api = 'http://localhost/gestion_e/AsistenciaAlumno/asistencia_historial.php';

  // KPI calculado
  asistenciaPct = computed(() => {
    const total = this.totales.PRESENTE + this.totales.AUSENTE + this.totales.JUSTIFICADO;
    if (!total) return 0;
    return Math.round((this.totales.PRESENTE / total) * 100);
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  private getCorreo(): string | null {
    // Igual que tu menú del alumno: se guarda el correo en localStorage
    return localStorage.getItem('correo');
  }

  cargarHistorial(): void {
    this.cargando = true;
    this.error = null;

    let params = new HttpParams();
    const correo = this.getCorreo();
    if (correo) params = params.set('correo', correo);

    if (this.modo === 'rango' && this.desde && this.hasta) {
      params = params.set('desde', this.desde).set('hasta', this.hasta);
    } else {
      params = params.set('anio', String(this.anio)).set('mes', String(this.mes));
    }

    this.http.get<RespuestaHistorial>(this.api, { params }).subscribe({
      next: (resp) => {
        if (!resp?.ok) {
          this.error = 'No se pudo cargar la asistencia del alumno.';
          this.registros = [];
          this.totales = { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0 };
        } else {
          this.alumnoId = resp.alumno_id ?? null;
          this.registros = resp.registros || [];
          this.totales = resp.totales || { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0 };
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error de conexión con el servidor.';
        this.cargando = false;
      }
    });
  }

  verMesActual(): void {
    const hoy = new Date();
    this.anio = hoy.getFullYear();
    this.mes  = hoy.getMonth() + 1;
    this.modo = 'mes';
    this.cargarHistorial();
  }

  aplicarRango(): void {
    if (!this.desde || !this.hasta) return;
    this.modo = 'rango';
    this.cargarHistorial();
  }

  limpiarRango(): void {
    this.desde = '';
    this.hasta = '';
    this.modo = 'mes';
    this.verMesActual();
  }

  badgeClase(estado: string): string {
    switch (estado) {
      case 'PRESENTE':    return 'b-green';
      case 'JUSTIFICADO': return 'b-amber';
      case 'AUSENTE':     return 'b-red';
      default:            return 'b-gray';
    }
  }
}
