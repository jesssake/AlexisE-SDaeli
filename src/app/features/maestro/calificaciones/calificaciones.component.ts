import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpParams,
} from '@angular/common/http';

//
// Tipos de datos del backend PHP
//
export interface Trimestre {
  id: number;
  nombre: string;
  activo: number;
}

export interface FilaCalificacionTarea {
  alumno_id: number;
  alumno_nombre: string;
  tarea_id: number;
  titulo_tarea: string;
  calificacion: number;
  porcentaje: number | null;
  trimestre_id: number;
}

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './calificaciones.component.html',
  styleUrls: ['./calificaciones.component.scss'],
})
export class CalificacionesComponent implements OnInit {
  // ===== Estado UI =====
  cargando = false;
  guardando = false;
  errorMsg: string | null = null;
  successMsg: string | null = null;

  // ===== Datos =====
  trimestres = signal<Trimestre[]>([]);
  trimestreSeleccionado = signal<number | null>(null);
  filas = signal<FilaCalificacionTarea[]>([]);

  // ===== Agrupar por alumno + promedio =====
  gruposAlumnos = computed(() => {
    const mapa = new Map<
      number,
      {
        alumno_id: number;
        alumno_nombre: string;
        tareas: Array<{
          tarea_id: number;
          titulo_tarea: string;
          calificacion: number;
          porcentaje: number;
        }>;
      }
    >();

    for (const row of this.filas()) {
      const alumnoId = row.alumno_id;
      if (!mapa.has(alumnoId)) {
        mapa.set(alumnoId, {
          alumno_id: alumnoId,
          alumno_nombre: row.alumno_nombre,
          tareas: [],
        });
      }
      mapa.get(alumnoId)!.tareas.push({
        tarea_id: row.tarea_id,
        titulo_tarea: row.titulo_tarea,
        calificacion: row.calificacion,
        porcentaje: row.porcentaje ?? 0,
      });
    }

    const resultado: Array<{
      alumno_id: number;
      alumno_nombre: string;
      promedioTrimestre: number;
      tareas: Array<{
        tarea_id: number;
        titulo_tarea: string;
        calificacion: number;
        porcentaje: number;
      }>;
    }> = [];

    mapa.forEach((alumnoData) => {
      let sumaPonderada = 0;
      let sumaPorcentajes = 0;

      for (const t of alumnoData.tareas) {
        sumaPonderada += t.calificacion * t.porcentaje;
        sumaPorcentajes += t.porcentaje;
      }

      let promedio = 0;
      if (sumaPorcentajes > 0) {
        promedio = sumaPonderada / sumaPorcentajes;
      } else if (alumnoData.tareas.length > 0) {
        const sumaNotas = alumnoData.tareas.reduce((acc, t) => acc + t.calificacion, 0);
        promedio = sumaNotas / alumnoData.tareas.length;
      }

      resultado.push({
        alumno_id: alumnoData.alumno_id,
        alumno_nombre: alumnoData.alumno_nombre,
        promedioTrimestre: Number(promedio.toFixed(2)),
        tareas: alumnoData.tareas,
      });
    });

    return resultado;
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarTrimestres();
  }

  // ===== Trimestres =====
  cargarTrimestres() {
    this.cargando = true;
    this.errorMsg = null;

    this.http
      .get<Trimestre[]>('http://localhost/gestion_e/calificaciones/obtener_trimestres.php')
      .subscribe({
        next: (data) => {
          this.trimestres.set(data || []);
          const activo = (data || []).find((t) => t.activo === 1);
          if (activo) this.trimestreSeleccionado.set(activo.id);
          else if (data && data.length > 0) this.trimestreSeleccionado.set(data[0].id);
          else this.trimestreSeleccionado.set(null);

          if (this.trimestreSeleccionado()) {
            this.cargarCalificaciones(this.trimestreSeleccionado()!);
          }
          this.cargando = false;
        },
        error: () => {
          this.cargando = false;
          this.errorMsg = 'No se pudieron cargar los trimestres.';
        },
      });
  }

  // ===== Calificaciones por trimestre =====
  cargarCalificaciones(trimestreId: number) {
    if (!trimestreId || trimestreId <= 0) {
      this.filas.set([]);
      return;
    }

    this.cargando = true;
    this.errorMsg = null;

    const params = new HttpParams().set('trimestre', String(trimestreId));

    this.http
      .get<FilaCalificacionTarea[]>(
        'http://localhost/gestion_e/calificaciones/calificaciones.php',
        { params }
      )
      .subscribe({
        next: (data) => {
          this.filas.set((data || []).map((f) => ({ ...f, porcentaje: f.porcentaje ?? 0 })));
          this.cargando = false;
          this.successMsg = null;
        },
        error: () => {
          this.cargando = false;
          this.errorMsg = 'No se pudieron cargar las calificaciones de este trimestre.';
        },
      });
  }

  // ===== Cambiar trimestre =====
  onTrimestreChange(evt: Event) {
    const value = (evt.target as HTMLSelectElement).value;
    const id = Number(value);
    this.trimestreSeleccionado.set(id);
    this.cargarCalificaciones(id);
  }

  // ===== Editar % en memoria =====
  actualizarPorcentaje(alumno_id: number, tarea_id: number, nuevoValor: number) {
    const actual = this.filas();
    const nuevoPorcentaje = isNaN(nuevoValor) ? 0 : nuevoValor;

    const actualizado = actual.map((fila) => {
      if (fila.alumno_id === alumno_id && fila.tarea_id === tarea_id) {
        return { ...fila, porcentaje: nuevoPorcentaje };
      }
      return fila;
    });

    this.filas.set(actualizado);
  }

  // ===== Guardar % al backend =====
  guardarCambios() {
    if (!this.trimestreSeleccionado()) {
      this.errorMsg = 'Selecciona un trimestre primero.';
      return;
    }

    this.errorMsg = null;
    this.successMsg = null;
    this.guardando = true;

    const payload = {
      trimestre_id: this.trimestreSeleccionado()!,
      items: this.filas().map((f) => ({
        alumno_id: f.alumno_id,
        tarea_id: f.tarea_id,
        porcentaje: f.porcentaje ?? 0,
      })),
    };

    this.http
      .post<{ ok: boolean; mensaje?: string }>(
        'http://localhost/gestion_e/calificaciones/calificaciones.php',
        payload
      )
      .subscribe({
        next: (resp) => {
          this.guardando = false;
          if (resp.ok) this.successMsg = 'Cambios guardados';
          else this.errorMsg = resp.mensaje || 'No se pudieron guardar los cambios.';
        },
        error: () => {
          this.guardando = false;
          this.errorMsg = 'Error al guardar cambios.';
        },
      });
  }
}
