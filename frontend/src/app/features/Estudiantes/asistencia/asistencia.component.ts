// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\Estudiantes\asistencia\asistencia.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';

interface AsistenciaEstudiante {
  id: number;
  fecha: string;
  fecha_formateada: string;
  hora_clase: string;
  estado: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO';
  comentario_maestro: string;
  maestro_nombre: string;
  dia_semana: string;
  dia: number;
  mes_numero: number;
  mes_nombre: string;
  anio: number;  // Cambiado de 'año' a 'anio'
}

interface EstadisticasGenerales {
  total_dias: number;
  presentes: number;
  ausentes: number;
  justificados: number;
  porcentaje_asistencia: number;
}

interface EstadisticasMes {
  total_dias_mes?: number;
  presentes_mes?: number;
  ausentes_mes?: number;
  justificados_mes?: number;
  porcentaje_mes?: number;
}

interface ResumenMensual {
  mes_numero: number;
  mes_nombre: string;
  total_dias: number;
  presentes: number;
  ausentes: number;
  justificados: number;
  porcentaje: number;
}

interface UltimaAsistencia {
  fecha: string;
  estado: string;
  comentario_maestro: string;
}

@Component({
  selector: 'app-estudiante-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.scss']
})
export class EstudianteAsistenciaComponent implements OnInit {
  // Datos del estudiante
  estudianteId: number = 0;
  estudianteNombre: string = '';
  tutorNombre: string = '';
  
  // Filtros - Cambiados sin ñ
  mesSeleccionado: string = '';
  anioSeleccionado: string = '';  // Cambiado de 'añoSeleccionado' a 'anioSeleccionado'
  limiteRegistros: number = 50;
  
  // Datos
  asistencias: AsistenciaEstudiante[] = [];
  estadisticas: {
    generales: EstadisticasGenerales;
    mes_actual?: EstadisticasMes;
  } = {
    generales: {
      total_dias: 0,
      presentes: 0,
      ausentes: 0,
      justificados: 0,
      porcentaje_asistencia: 0
    }
  };
  
  resumenMensual: ResumenMensual[] = [];
  ultimaAsistencia: UltimaAsistencia | null = null;
  
  // Estados
  cargando: boolean = false;
  error: string = '';
  mensajeExito: string = '';
  
  // Fecha actual para mostrar en footer
  fechaActual: string = '';
  
  // API endpoints
    protected apiBaseUrl = 'http://localhost:3000/api/estudiante/asistencia';


  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarDatosEstudiante();
    this.inicializarFechas();
    this.cargarAsistencia();
    this.actualizarFechaActual();
  }

  private cargarDatosEstudiante(): void {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const usuario = JSON.parse(userData);
        
        // Obtener ID del estudiante (puede venir de diferentes formas)
        this.estudianteId = usuario.id || usuario.estudiante_id || 0;
        this.estudianteNombre = usuario.nino_nombre || usuario.nombre || 'Estudiante';
        this.tutorNombre = usuario.tutor_nombre || 'Tutor';
        
        console.log('👤 Datos del estudiante cargados:', {
          id: this.estudianteId,
          nombre: this.estudianteNombre,
          tutor: this.tutorNombre
        });
        
        if (!this.estudianteId) {
          this.error = 'No se pudo identificar al estudiante. Por favor, cierra sesión y vuelve a entrar.';
        }
      } else {
        this.error = 'No hay datos de usuario. Por favor, inicia sesión nuevamente.';
      }
    } catch (error) {
      console.error('Error cargando datos del estudiante:', error);
      this.error = 'Error al cargar los datos del estudiante.';
    }
  }

  private inicializarFechas(): void {
    const hoy = new Date();
    this.mesSeleccionado = (hoy.getMonth() + 1).toString().padStart(2, '0');
    this.anioSeleccionado = hoy.getFullYear().toString();
  }

  private actualizarFechaActual(): void {
    const hoy = new Date();
    this.fechaActual = hoy.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  cargarAsistencia(): void {
    if (!this.estudianteId) {
      this.error = 'ID del estudiante no disponible';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.mensajeExito = '';

    // Construir parámetros
    const params = new HttpParams()
      .set('mes', this.mesSeleccionado)
      .set('año', this.anioSeleccionado)  // Backend espera 'año', pero variable local es 'anioSeleccionado'
      .set('limite', this.limiteRegistros.toString());

    console.log('🔄 Cargando asistencia para estudiante:', {
      id: this.estudianteId,
      mes: this.mesSeleccionado,
      anio: this.anioSeleccionado,
      limite: this.limiteRegistros
    });

    this.http.get<any>(`${this.apiBaseUrl}/${this.estudianteId}`, { params }).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servidor:', response);
        
        if (response.ok) {
          this.asistencias = response.asistencias || [];
          this.estadisticas = response.estadisticas || this.estadisticas;
          this.ultimaAsistencia = response.ultima_asistencia || null;
          
          console.log('📊 Datos cargados:', {
            asistencias: this.asistencias.length,
            estadisticas: this.estadisticas,
            ultimaAsistencia: this.ultimaAsistencia
          });
          
          this.mensajeExito = `Cargadas ${this.asistencias.length} asistencias`;
          
          // Cargar resumen mensual
          this.cargarResumenMensual();
        } else {
          this.error = response.message || 'Error al cargar las asistencias';
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando asistencia:', err);
        if (err.status === 0) {
          this.error = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:3000';
        } else if (err.status === 404) {
          this.error = 'Estudiante no encontrado en el sistema.';
        } else if (err.status === 500) {
          this.error = 'Error del servidor. Por favor, intenta más tarde.';
        } else {
          this.error = `Error: ${err.message}`;
        }
        this.cargando = false;
      }
    });
  }

  private cargarResumenMensual(): void {
    const url = `${this.apiBaseUrl}/${this.estudianteId}/resumen-mensual`;
    const params = new HttpParams().set('año', this.anioSeleccionado);

    this.http.get<any>(url, { params }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.resumenMensual = response.resumen || [];
          console.log('📈 Resumen mensual cargado:', this.resumenMensual.length);
        }
      },
      error: (err) => {
        console.error('Error cargando resumen mensual:', err);
      }
    });
  }

  cargarAsistenciaHoy(): void {
    if (!this.estudianteId) return;

    this.cargando = true;
    this.http.get<any>(`${this.apiBaseUrl}/${this.estudianteId}/hoy`).subscribe({
      next: (response) => {
        if (response.ok) {
          const mensaje = response.tiene_asistencia 
            ? `Hoy: ${response.asistencia.estado} a las ${response.asistencia.hora_clase}`
            : 'No hay asistencia registrada para hoy';
          
          this.mensajeExito = mensaje;
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error verificando asistencia de hoy:', err);
        this.cargando = false;
      }
    });
  }

  generarReporte(): void {
    if (!this.estudianteId) return;

    window.open(`${this.apiBaseUrl}/${this.estudianteId}/reporte?formato=pdf`, '_blank');
    this.mensajeExito = 'Generando reporte...';
  }

  // Métodos para UI
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PRESENTE': return 'estado-presente';
      case 'AUSENTE': return 'estado-ausente';
      case 'JUSTIFICADO': return 'estado-justificado';
      default: return 'estado-desconocido';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'PRESENTE': return '✅';
      case 'AUSENTE': return '❌';
      case 'JUSTIFICADO': return '⚠️';
      default: return '❓';
    }
  }

  getEstadoText(estado: string): string {
    switch (estado) {
      case 'PRESENTE': return 'Presente';
      case 'AUSENTE': return 'Ausente';
      case 'JUSTIFICADO': return 'Justificado';
      default: return 'No registrado';
    }
  }

  getPorcentajeColor(porcentaje: number): string {
    if (porcentaje >= 90) return 'excelente';
    if (porcentaje >= 75) return 'bueno';
    if (porcentaje >= 60) return 'regular';
    return 'bajo';
  }

  getDiaSemana(fecha: string): string {
    const date = new Date(fecha);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[date.getDay()];
  }

  // Filtros
  onMesChange(): void {
    this.cargarAsistencia();
  }

  onAnioChange(): void {  // Cambiado de onAñoChange a onAnioChange
    this.cargarAsistencia();
  }

  onLimiteChange(): void {
    this.cargarAsistencia();
  }

  // Generar meses para el select
  get meses(): Array<{numero: string, nombre: string}> {
    return [
      {numero: '01', nombre: 'Enero'},
      {numero: '02', nombre: 'Febrero'},
      {numero: '03', nombre: 'Marzo'},
      {numero: '04', nombre: 'Abril'},
      {numero: '05', nombre: 'Mayo'},
      {numero: '06', nombre: 'Junio'},
      {numero: '07', nombre: 'Julio'},
      {numero: '08', nombre: 'Agosto'},
      {numero: '09', nombre: 'Septiembre'},
      {numero: '10', nombre: 'Octubre'},
      {numero: '11', nombre: 'Noviembre'},
      {numero: '12', nombre: 'Diciembre'}
    ];
  }

  // Generar años (últimos 5 años) - Cambiado getter
  get anios(): string[] {  // Cambiado de 'años' a 'anios'
    const anioActual = new Date().getFullYear();
    const anios: string[] = [];
    for (let i = 0; i < 5; i++) {
      anios.push((anioActual - i).toString());
    }
    return anios;
  }

  // Opciones de límite
  get limites(): number[] {
    return [10, 25, 50, 100, 250];
  }

  // Método para descargar reporte
  descargarReporte(formato: string = 'pdf'): void {
    if (!this.estudianteId) return;

    const url = `${this.apiBaseUrl}/${this.estudianteId}/reporte?formato=${formato}`;
    window.open(url, '_blank');
    this.mensajeExito = `Descargando reporte en formato ${formato.toUpperCase()}...`;
  }

  // Limpiar filtros
  limpiarFiltros(): void {
    this.inicializarFechas();
    this.limiteRegistros = 50;
    this.cargarAsistencia();
  }

  // Verificar conexión con el backend
  probarConexion(): void {
    console.log('🔍 Probando conexión con el backend...');
    this.http.get(`${this.apiBaseUrl}/test`).subscribe({
      next: (data) => {
        console.log('✅ Backend responde:', data);
        this.mensajeExito = '✅ Conexión con el backend establecida correctamente';
      },
      error: (err) => {
        console.error('❌ Backend no responde:', err);
        this.error = '❌ No se puede conectar con el backend. Verifica que esté ejecutándose.';
      }
    });
  }

  // Formatear fecha
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}