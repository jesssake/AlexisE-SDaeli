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
  alumnos?: RegistroAsistencia[];
  total?: number;
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

  // ===== endpoints ACTUALIZADOS para Node.js =====
  private apiBaseUrl = 'http://localhost:3000/api/maestro/asistencia';
  private apiListaUrl = `${this.apiBaseUrl}/lista`;
  private apiGuardarUrl = `${this.apiBaseUrl}/guardar`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    console.log('🎯 AsistenciaComponent inicializado');
    this.cargarRegistros();
  }

  // ======================== UTILIDADES ========================

  private hoyISO(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  get porcentajeAsistencia(): number {
    const totalMarcados = this.totalPresentes + this.totalAusentes + this.totalJustificados;
    return totalMarcados > 0 ? Math.round((this.totalPresentes + this.totalJustificados) / totalMarcados * 100) : 0;
  }

  // ================== EVENTOS UI ==================

  onFechaChange(): void {
    this.cargarRegistros();
  }

  onHoraChange(): void {
    this.cargarRegistros();
  }

  marcarEstado(
    reg: RegistroAsistencia,
    estado: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO'
  ): void {
    reg.estado = estado;
    if (estado === 'PRESENTE') {
      reg.comentario_maestro = '';
    }
    console.log(`📝 Marcado ${reg.nombre} como ${estado}`);
  }

  // ================== CARGAR LISTA ==================

  cargarRegistros(): void {
    this.cargando = true;
    this.errorMsg = null;
    this.okMsg = null;
    this.registros = [];

    const horaNormalizada =
      this.horaClase.length === 5 ? this.horaClase + ':00' : this.horaClase;

    console.log('🔄 Cargando registros:', { 
      fecha: this.fecha, 
      hora: horaNormalizada,
      maestro_id: this.MAESTRO_ID 
    });

    const params = new HttpParams()
      .set('maestro_id', String(this.MAESTRO_ID))
      .set('fecha', this.fecha)
      .set('hora_clase', horaNormalizada);

    this.http.get<ListaResponse>(this.apiListaUrl, { params }).subscribe({
      next: (res) => {
        console.log('✅ Respuesta del servidor:', res);
        
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

        console.log(`📊 Registros cargados: ${this.registros.length}`);

        if (this.registros.length === 0) {
          this.okMsg = 'No hay alumnos registrados para esta fecha/hora.';
        } else {
          this.okMsg = `Cargados ${this.registros.length} estudiantes`;
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar asistencia', err);
        this.errorMsg = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en puerto 3000.';
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

    const registrosSinEstado = this.registros.filter(r => r.estado === '');
    if (registrosSinEstado.length > 0) {
      this.errorMsg = `Hay ${registrosSinEstado.length} estudiantes sin marcar asistencia.`;
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
      registros: this.registros
        .filter(r => r.estado !== '')
        .map((r) => ({
          estudiante_id: r.estudiante_id,
          estado: r.estado,
          comentario_maestro: r.comentario_maestro || '',
        })),
    };

    console.log('💾 Enviando datos para guardar:', payload);

    this.http.post<GuardarResponse>(this.apiGuardarUrl, payload).subscribe({
      next: (res) => {
        console.log('✅ Respuesta del servidor al guardar:', res);
        
        if (!res.ok) {
          console.error('Error al guardar:', res);
          this.errorMsg =
            res.message || res.error || 'Ocurrió un error al guardar.';
        } else {
          this.okMsg = res.message || `Asistencia guardada correctamente para ${res.rows} estudiantes.`;

          // Recargar para ver los cambios
          setTimeout(() => {
            this.cargarRegistros();
          }, 1500);
        }
        this.guardando = false;
      },
      error: (err) => {
        console.error('❌ Error HTTP al guardar asistencia', err);
        if (err.status === 0) {
          this.errorMsg = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.';
        } else {
          this.errorMsg = `Error del servidor: ${err.message}`;
        }
        this.guardando = false;
      },
    });
  }

  // ================== MÉTODOS ADICIONALES ==================

  limpiarAsistencia(): void {
    this.registros.forEach(reg => {
      reg.estado = '';
      reg.comentario_maestro = '';
    });
    this.okMsg = 'Asistencia limpiada localmente.';
  }

  marcarTodos(estado: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO'): void {
    this.registros.forEach(reg => {
      reg.estado = estado;
      if (estado === 'PRESENTE') {
        reg.comentario_maestro = '';
      }
    });
    this.okMsg = `Todos los estudiantes marcados como ${estado}.`;
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PRESENTE': return 'estado-presente';
      case 'AUSENTE': return 'estado-ausente';
      case 'JUSTIFICADO': return 'estado-justificado';
      default: return 'estado-sin-marcar';
    }
  }

  getEstadoText(estado: string): string {
    switch (estado) {
      case 'PRESENTE': return 'Presente';
      case 'AUSENTE': return 'Ausente';
      case 'JUSTIFICADO': return 'Justificado';
      default: return 'Sin marcar';
    }
  }

  // Método para debug
  probarConexion(): void {
    console.log('🔍 Probando conexión con el backend...');
    this.http.get(this.apiListaUrl).subscribe({
      next: (data) => console.log('✅ Backend responde:', data),
      error: (err) => console.error('❌ Backend no responde:', err)
    });
  }
}