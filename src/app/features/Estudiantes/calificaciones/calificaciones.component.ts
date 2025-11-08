import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';

type Trimestre = {
  id: number;
  nombre: string;
  promedio: number | null;
  tareas: {
    tarea_id: number;
    titulo: string;
    instrucciones: string;
    fecha_cierre: string | null;
    maestro_id: number;
    calificacion: number | null;
  }[];
};

type Resp = {
  ok: boolean;
  alumno_id: number;
  promedio_global: number | null;
  trimestres: Trimestre[];
};

@Component({
  selector: 'app-calificaciones-alumno',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './calificaciones.component.html',
  styleUrls: ['./calificaciones.component.scss'],
})
export class CalificacionesComponent implements OnInit {
  cargando = false;
  error: string | null = null;

  promedioGlobal: number | null = null;
  trimestres: Trimestre[] = [];

  // Endpoint PHP (ajústalo si usas otro path)
  private api = 'http://localhost/gestion_e/CalificacionesAlumno/listar.php';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargar();
  }

  private correoAlumno(): string | null {
    // Lo guardas al iniciar sesión del alumno
    return localStorage.getItem('correo');
  }

  cargar(): void {
    this.cargando = true;
    this.error = null;

    let params = new HttpParams();
    const correo = this.correoAlumno();
    if (correo) params = params.set('correo', correo);

    this.http.get<Resp>(this.api, { params }).subscribe({
      next: (resp) => {
        if (!resp?.ok) {
          this.error = 'No se pudieron cargar tus calificaciones.';
          this.trimestres = [];
          this.promedioGlobal = null;
        } else {
          this.trimestres = resp.trimestres ?? [];
          this.promedioGlobal = resp.promedio_global ?? null;
        }
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error de conexión con el servidor.';
        this.cargando = false;
      },
    });
  }

  // Utilidad: formato de fecha simple (YYYY-MM-DD → DD/MM/YYYY)
  fmt(fecha: string | null): string {
    if (!fecha) return '—';
    // admite fecha o datetime
    const d = fecha.slice(0, 10).split('-'); // [YYYY,MM,DD]
    if (d.length !== 3) return fecha;
    return `${d[2]}/${d[1]}/${d[0]}`;
  }
}
