// reportes.component.ts (para estudiantes)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReportesAlumnoService, ReporteAlumnoDTO, ResumenAlumno, TipoReporte, EstadoReporte, Prioridad } from './reportes-alumno.service';
import { LoggingService } from '../../../services/logging.service';

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

  constructor(
    private reportesService: ReportesAlumnoService, 
    private logger: LoggingService
  ) {}

  ngOnInit(): void {
    this.cargarDatosEstudiante();
    this.cargarReportes();
  }

  // ✅ ACTUALIZADO: Usar sessionStorage en lugar de localStorage
  private cargarDatosEstudiante(): void {
    try {
      // Buscar en sessionStorage primero
      let userDataStr = sessionStorage.getItem('userData');
      
      // Si no hay en sessionStorage, buscar en localStorage (fallback)
      if (!userDataStr) {
        userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          // ✅ CORREGIDO: Quitado punto y coma
          this.logger.log('⚠️ Datos encontrados en localStorage (fallback), migrando a sessionStorage...');
          // Migrar datos a sessionStorage
          const userData = JSON.parse(userDataStr);
          sessionStorage.setItem('userData', JSON.stringify(userData));
          if (userData.id) sessionStorage.setItem('userId', userData.id.toString());
          if (userData.rol) sessionStorage.setItem('userRole', userData.rol);
          if (userData.nombre) sessionStorage.setItem('userNombre', userData.nombre);
          if (userData.email) sessionStorage.setItem('userEmail', userData.email);
          if (userData.nino_nombre) sessionStorage.setItem('ninoNombre', userData.nino_nombre);
          if (userData.tutor_nombre) sessionStorage.setItem('tutorNombre', userData.tutor_nombre);
        }
      }
      
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        
        // ✅ CORRECCIÓN: Priorizar nino_id para el ID del estudiante
        this.estudianteId = userData.nino_id || userData.id || userData.userId || 0;
        
        // ✅ CORRECCIÓN: Priorizar nino_nombre para el nombre del estudiante
        if (userData.nino_nombre && userData.nino_nombre !== 'null' && userData.nino_nombre !== 'undefined') {
          this.estudianteNombre = userData.nino_nombre;
        } else {
          this.estudianteNombre = userData.nombre || 'Estudiante';
        }
        
        // Nombre del tutor
        this.tutorNombre = userData.tutor_nombre || userData.nombre || 'Tutor';
        
        // Grupo
        this.grupo = userData.grupo || userData.seccion || 'Sin grupo';
        
        this.logger.log('👤 Datos estudiante cargados desde sessionStorage:', {
          id: this.estudianteId,
          nombre: this.estudianteNombre,
          tutor: this.tutorNombre,
          grupo: this.grupo,
          nino_id: userData.nino_id,
          nino_nombre: userData.nino_nombre
        });
        
        // Validar que tenemos ID válido
        if (!this.estudianteId || this.estudianteId === 0) {
          this.logger.warn('⚠️ No se pudo obtener ID del estudiante, datos disponibles:', userData);
        }
      } else {
        this.logger.warn('⚠️ No se encontraron datos del estudiante en sessionStorage ni localStorage');
        
        // Intentar obtener datos de campos individuales en sessionStorage
        const userId = sessionStorage.getItem('userId');
        const userNombre = sessionStorage.getItem('userNombre');
        const ninoNombre = sessionStorage.getItem('ninoNombre');
        const tutorNombre = sessionStorage.getItem('tutorNombre');
        
        if (userId) {
          this.estudianteId = parseInt(userId, 10);
          this.estudianteNombre = ninoNombre || userNombre || 'Estudiante';
          this.tutorNombre = tutorNombre || userNombre || 'Tutor';
          this.logger.log('👤 Datos estudiante cargados desde campos individuales:', {
            id: this.estudianteId,
            nombre: this.estudianteNombre
          });
        }
      }
    } catch (error) {
      this.logger.error('❌ Error cargando datos del estudiante:', error);
    }
  }

  cargarReportes(): void {
    if (!this.estudianteId || this.estudianteId === 0) {
      this.logger.warn('⚠️ No hay ID de estudiante para cargar reportes');
      this.reportes = [];
      this.resumen = { total: 0, pendientes: 0, resueltos: 0, altaPrioridad: 0 };
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

    this.logger.log('🔄 Cargando reportes para estudiante ID:', this.estudianteId, 'Filtros:', filtros);

    this.reportesService.getReportesPorEstudiante(this.estudianteId, filtros).subscribe({
      next: ({ reportes, resumen }) => {
        this.reportes = reportes;
        this.resumen = resumen;
        this.logger.log(`✅ ${reportes.length} reportes cargados`);
        this.cargando = false;
      },
      error: (error) => {
        this.logger.error('❌ Error cargando reportes:', error);
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
    // ✅ CORREGIDO: Quitado punto y coma y agregado cuerpo de función
    this.reportesService.marcarComoLeido(reporte.id).subscribe({
      next: () => {
        this.logger.log('✅ Reporte marcado como leído');
      },
      error: (error) => {
        this.logger.warn('⚠️ No se pudo marcar como leído:', error);
      }
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
          const fechaActual = new Date().toLocaleString('es-MX');
          const nuevaObservacionFormateada = `\n[${fechaActual}] 📝 ${this.nuevaObservacion}`;
          this.reporteSeleccionado.observaciones = 
            (this.reporteSeleccionado.observaciones || '') + nuevaObservacionFormateada;
        }
        
        this.nuevaObservacion = '';
        this.cargarReportes(); // Recargar para actualizar
      },
      error: (error) => {
        this.logger.error('❌ Error agregando observación:', error);
        alert('❌ Error al agregar observación');
      }
    });
  }

  exportarPDF(): void {
    if (!this.estudianteId || this.estudianteId === 0) {
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

  // ================== REFRESCAR DATOS ==================
  refrescarDatos(): void {
    this.logger.log('🔄 Refrescando datos...');
    this.cargarDatosEstudiante();
    this.cargarReportes();
  }

  // ================== DEBUG - CORREGIDO ==================
  debugInfo(): void {
    this.logger.group('🐛 DEBUG INFO - Reportes Estudiante');
    this.logger.log('👤 Estudiante:', {
      id: this.estudianteId,
      nombre: this.estudianteNombre,
      tutor: this.tutorNombre,
      grupo: this.grupo
    });
    this.logger.log('📊 Resumen:', this.resumen);
    this.logger.log('📋 Reportes:', this.reportes.length);
    this.logger.log('🎯 Filtros:', {
      tipo: this.filtroTipo,
      estado: this.filtroEstado,
      prioridad: this.filtroPrioridad,
      mes: this.filtroMes,
      anio: this.filtroAnio
    });
    this.logger.log('💾 Datos en sessionStorage:');
    // ✅ CORREGIDO: Quitados puntos y coma
    this.logger.log('   userId:', sessionStorage.getItem('userId'));
    this.logger.log('   userRole:', sessionStorage.getItem('userRole'));
    this.logger.log('   ninoNombre:', sessionStorage.getItem('ninoNombre'));
    this.logger.log('   userData:', sessionStorage.getItem('userData'));
    this.logger.groupEnd();
  }

  testConnection(): void {
    this.logger.log('🔍 Probando conexión con el servicio...');
    this.reportesService.testConnection().subscribe({
      next: (resp) => {
        this.logger.log('✅ Test conexión exitoso:', resp);
        alert('✅ Conexión con el backend establecida correctamente');
      },
      error: (error) => {
        this.logger.error('❌ Test conexión falló:', error);
        alert('❌ No se pudo conectar con el backend. Verifica que esté ejecutándose en http://localhost:3000');
      }
    });
  }
}