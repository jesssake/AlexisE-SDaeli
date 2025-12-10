import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

type Estado = 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO';

interface Registro {
  fecha: string;
  hora: string;
  estado: string;
  comentario: string;
  maestro_id: number;
}

interface RespuestaHistorial {
  ok: boolean;
  alumno_id: number;
  totales: { PRESENTE: number; AUSENTE: number; JUSTIFICADO: number };
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
  modo = 'mes';
  anio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;

  desde = '';
  hasta = '';

  alumnoId: number | null = null;
  registros: Registro[] = [];
  totales = { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0 };

  private api =
    'http://localhost/gestion_e/AsistenciaAlumno/asistencia_historial.php';

  asistenciaPct = computed(() => {
    const total =
      this.totales.PRESENTE +
      this.totales.AUSENTE +
      this.totales.JUSTIFICADO;

    return total ? Math.round((this.totales.PRESENTE / total) * 100) : 0;
  });

  constructor(
    private http: HttpClient,
    public auth: AuthService // acceso desde HTML
  ) {}

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      this.error = 'Debes iniciar sesión para ver tu asistencia.';
      return;
    }

    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.cargando = true;
    this.error = null;

    if (!this.auth.isAuthenticated()) {
      this.error = 'Sesión expirada. Inicia sesión nuevamente.';
      this.cargando = false;
      return;
    }

    const alumnoId = this.auth.userAlumnoId;
    const correo = this.auth.getUserEmail();

    let params = new HttpParams();

    if (alumnoId) {
      params = params.set('alumno_id', String(alumnoId));
    } else if (correo) {
      params = params.set('correo', correo);
    } else {
      this.error = 'No se pudo identificar al alumno.';
      this.cargando = false;
      return;
    }

    if (this.modo === 'rango' && this.desde && this.hasta) {
      params = params.set('desde', this.desde).set('hasta', this.hasta);
    } else {
      params = params.set('anio', String(this.anio)).set('mes', String(this.mes));
    }

    this.http.get<RespuestaHistorial>(this.api, { params }).subscribe({
      next: (resp) => {
        if (!resp?.ok) {
          this.error = 'No se encontró historial.';
          this.registros = [];
          this.totales = { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0 };
        } else {
          this.alumnoId = resp.alumno_id;
          this.registros = resp.registros;
          this.totales = resp.totales;
        }
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error de conexión con el servidor.';
        this.cargando = false;
      },
    });
  }

  verMesActual(): void {
    const hoy = new Date();
    this.anio = hoy.getFullYear();
    this.mes = hoy.getMonth() + 1;
    this.modo = 'mes';
    this.cargarHistorial();
  }

  aplicarRango(): void {
    if (!this.desde || !this.hasta) {
      this.error = 'Selecciona un rango válido.';
      return;
    }
    if (new Date(this.desde) > new Date(this.hasta)) {
      this.error = 'La fecha "desde" no puede ser mayor.';
      return;
    }
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
      case 'PRESENTE':
        return 'b-green';
      case 'JUSTIFICADO':
        return 'b-amber';
      case 'AUSENTE':
        return 'b-red';
      default:
        return 'b-gray';
    }
  }
}

