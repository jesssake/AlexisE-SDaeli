// reportes.component.ts (para estudiantes)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReportesAlumnoService, ReporteAlumnoDTO, ResumenAlumno, TipoReporte, EstadoReporte, Prioridad } from './reportes-alumno.service';

@Component({
  selector: 'app-reportes-alumno',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesAlumnoComponent implements OnInit {
  // Datos del estudiante
  estudianteId: number = 0;
  estudianteNombre: string = '';
  tutorNombre: string = '';
  grupo: string = '';

  // Datos
  reportes: ReporteAlumnoDTO[] = [];
  resumen: ResumenAlumno = { total: 0, pendientes: 0, resueltos: 0, altaPrioridad: 0 };

  // Filtros
  filtroTipo: 'todos' | TipoReporte = 'todos';
  filtroEstado: 'todos' | EstadoReporte = 'todos';
  filtroPrioridad: 'todos' | Prioridad = 'todos';
  filtroMes: string = '';
  filtroAnio: string = '';

  // Catálogos
  tiposReporte = [
    { valor: 'academico' as TipoReporte, nombre: 'Académico', icono: '📚' },
    { valor: 'conducta' as TipoReporte, nombre: 'Conducta', icono: '👥' },
    { valor: 'asistencia' as TipoReporte, nombre: 'Asistencia', icono: '✅' },
    { valor: 'personal' as TipoReporte, nombre: 'Personal', icono: '💬' },
    { valor: 'salud' as TipoReporte, nombre: 'Salud', icono: '🏥' },
    { valor: 'familiar' as TipoReporte, nombre: 'Familiar', icono: '👨‍👩‍👧‍👦' },
  ];

  nivelesPrioridad = [
    { valor: 'baja' as Prioridad, nombre: 'Baja', color: '#27ae60' },
    { valor: 'media' as Prioridad, nombre: 'Media', color: '#f39c12' },
    { valor: 'alta' as Prioridad, nombre: 'Alta', color: '#e74c3c' },
  ];

  estadosReporte = [
    { valor: 'pendiente' as EstadoReporte, nombre: 'Pendiente', color: '#f39c12' },
    { valor: 'revisado' as EstadoReporte, nombre: 'Revisado', color: '#3498db' },
    { valor: 'resuelto' as EstadoReporte, nombre: 'Resuelto', color: '#27ae60' },
  ];

  // Modal
  reporteSeleccionado: ReporteAlumnoDTO | null = null;
  mostrarModal = false;
  nuevaObservacion = '';

  // UI
  cargando = false;
  meses = [
    { valor: '', nombre: 'Todos los meses' },
    { valor: '1', nombre: 'Enero' },
    { valor: '2', nombre: 'Febrero' },
    { valor: '3', nombre: 'Marzo' },
    { valor: '4', nombre: 'Abril' },
    { valor: '5', nombre: 'Mayo' },
    { valor: '6', nombre: 'Junio' },
    { valor: '7', nombre: 'Julio' },
    { valor: '8', nombre: 'Agosto' },
    { valor: '9', nombre: 'Septiembre' },
    { valor: '10', nombre: 'Octubre' },
    { valor: '11', nombre: 'Noviembre' },
    { valor: '12', nombre: 'Diciembre' }
  ];
  
  anios = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  constructor(private reportesService: ReportesAlumnoService) {}

  ngOnInit(): void {
    this.cargarDatosEstudiante();
    this.cargarReportes();
  }

  private cargarDatosEstudiante(): void {
    try {
      // Obtener datos del localStorage
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        
        this.estudianteId = userData.id || 0;
        this.estudianteNombre = userData.nino_nombre || userData.nombre || 'Estudiante';
        this.tutorNombre = userData.tutor_nombre || userData.nombre || 'Tutor';
        this.grupo = userData.grupo || 'Sin grupo';
        
        console.log('👤 Datos estudiante cargados:', {
          id: this.estudianteId,
          nombre: this.estudianteNombre,
          tutor: this.tutorNombre,
          grupo: this.grupo
        });
      } else {
        console.warn('⚠️ No se encontraron datos del estudiante en localStorage');
      }
    } catch (error) {
      console.error('❌ Error cargando datos del estudiante:', error);
    }
  }

  cargarReportes(): void {
    if (!this.estudianteId) {
      console.warn('⚠️ No hay ID de estudiante para cargar reportes');
      return;
    }

    this.cargando = true;

    const filtros = {
      tipo: this.filtroTipo !== 'todos' ? this.filtroTipo : undefined,
      estado: this.filtroEstado !== 'todos' ? this.filtroEstado : undefined,
      prioridad: this.filtroPrioridad !== 'todos' ? this.filtroPrioridad : undefined,
      mes: this.filtroMes || undefined,
      anio: this.filtroAnio || undefined
    };

    this.reportesService.getReportesPorEstudiante(this.estudianteId, filtros).subscribe({
      next: ({ reportes, resumen }) => {
        this.reportes = reportes;
        this.resumen = resumen;
        console.log(`✅ ${reportes.length} reportes cargados`);
        this.cargando = false;
      },
      error: (error) => {
        console.error('❌ Error cargando reportes:', error);
        this.reportes = [];
        this.resumen = { total: 0, pendientes: 0, resueltos: 0, altaPrioridad: 0 };
        this.cargando = false;
      }
    });
  }

  // ================== FILTROS ==================
  get reportesFiltrados(): ReporteAlumnoDTO[] {
    return this.reportes; // Ya vienen filtrados del backend
  }

  aplicarFiltros(): void {
    this.cargarReportes();
  }

  limpiarFiltros(): void {
    this.filtroTipo = 'todos';
    this.filtroEstado = 'todos';
    this.filtroPrioridad = 'todos';
    this.filtroMes = '';
    this.filtroAnio = '';
    this.cargarReportes();
  }

  // ================== ACCIONES ==================
  abrirModal(reporte: ReporteAlumnoDTO): void {
    this.reporteSeleccionado = reporte;
    this.nuevaObservacion = '';
    this.mostrarModal = true;
    
    // Marcar como leído
    this.reportesService.marcarComoLeido(reporte.id).subscribe({
      next: () => console.log('✅ Reporte marcado como leído'),
      error: (error) => console.warn('⚠️ No se pudo marcar como leído:', error)
    });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.reporteSeleccionado = null;
    this.nuevaObservacion = '';
  }

  agregarObservacion(): void {
    if (!this.reporteSeleccionado || !this.nuevaObservacion.trim()) {
      return;
    }

    this.reportesService.agregarObservacion(this.reporteSeleccionado.id, this.nuevaObservacion).subscribe({
      next: () => {
        alert('✅ Observación agregada exitosamente');
        
        // Actualizar reporte localmente
        if (this.reporteSeleccionado) {
          this.reporteSeleccionado.observaciones = 
            (this.reporteSeleccionado.observaciones || '') + 
            `\n[${new Date().toLocaleString('es-MX')}]: ${this.nuevaObservacion}`;
        }
        
        this.nuevaObservacion = '';
        this.cargarReportes(); // Recargar para actualizar
      },
      error: (error) => {
        console.error('❌ Error agregando observación:', error);
        alert('❌ Error al agregar observación');
      }
    });
  }

  exportarPDF(): void {
    if (!this.estudianteId) {
      alert('⚠️ No hay datos del estudiante para exportar');
      return;
    }

    this.reportesService.exportarPDF(this.estudianteId);
  }

  // ================== HELPERS UI ==================
  obtenerNombreTipo(tipo: TipoReporte): string {
    return this.tiposReporte.find(t => t.valor === tipo)?.nombre ?? '—';
  }

  iconoTipo(tipo: TipoReporte): string {
    return this.tiposReporte.find(t => t.valor === tipo)?.icono ?? '📄';
  }

  fechaBonita(fecha: string): string {
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  }

  obtenerColorPrioridad(prioridad: Prioridad): string {
    return this.nivelesPrioridad.find(p => p.valor === prioridad)?.color ?? '#95a5a6';
  }

  obtenerColorEstado(estado: EstadoReporte): string {
    return this.estadosReporte.find(e => e.valor === estado)?.color ?? '#95a5a6';
  }

  tieneObservaciones(reporte: ReporteAlumnoDTO): boolean {
    return !!(reporte.observaciones && reporte.observaciones.trim());
  }

  // ================== KPI CARDS ==================
  obtenerPorcentajeResueltos(): number {
    if (this.resumen.total === 0) return 0;
    return Math.round((this.resumen.resueltos / this.resumen.total) * 100);
  }

  obtenerPorcentajePendientes(): number {
    if (this.resumen.total === 0) return 0;
    return Math.round((this.resumen.pendientes / this.resumen.total) * 100);
  }

  // ================== DEBUG ==================
  debugInfo(): void {
    console.log('🐛 DEBUG INFO:');
    console.log('👤 Estudiante:', {
      id: this.estudianteId,
      nombre: this.estudianteNombre,
      tutor: this.tutorNombre,
      grupo: this.grupo
    });
    console.log('📊 Resumen:', this.resumen);
    console.log('📋 Reportes:', this.reportes);
    console.log('🎯 Filtros:', {
      tipo: this.filtroTipo,
      estado: this.filtroEstado,
      prioridad: this.filtroPrioridad,
      mes: this.filtroMes,
      anio: this.filtroAnio
    });
  }

  testConnection(): void {
    this.reportesService.testConnection().subscribe({
      next: (resp) => console.log('✅ Test conexión:', resp),
      error: (error) => console.error('❌ Test conexión falló:', error)
    });
  }
}