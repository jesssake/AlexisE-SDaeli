import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  ReportesService,
  ReporteDTO,
  EstudianteOpt,
  TipoReporte,
  EstadoReporte,
  Prioridad,
  ApiResponse,
  GetReportesResp
} from '../../../services/reportes.service';

type EncabezadoSettings = {
  escuela: string;
  direccion: string;
  telefono: string;
  maestro: string;
  grupo: string;
  citaFecha: string;
  citaHora: string;
  logoUrl: string;
  folioActual: number;
};

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
  encapsulation: ViewEncapsulation.None  // <-- ¡ESTO ARREGLA EL FONDO NEGRO!
})
export class ReportesComponent implements OnInit {
  // ===== Datos =====
  estudiantes: EstudianteOpt[] = [];
  reportes: ReporteDTO[] = [];

  resumen = { total: 0, pendientes: 0, resueltos: 0, altaPrioridad: 0 };
  maestroId = 16; // ✅ ID del maestro

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

  // Formulario
  nuevoReporte = {
    tipo: '' as '' | TipoReporte,
    estudianteId: 0,
    motivo: '',
    descripcion: '',
    prioridad: 'media' as Prioridad,
  };

  // Filtros
  filtroTipo: 'todos' | TipoReporte = 'todos';
  filtroEstado: 'todos' | EstadoReporte = 'todos';
  filtroPrioridad: 'todos' | Prioridad = 'todos';
  filtroEstudiante = 0;

  // UI
  cargando = false;
  guardando = false;
  logoSubiendo = false;

  // Modal
  reporteSeleccionado: ReporteDTO | null = null;
  mostrarModal = false;

  // ===== Encabezado =====
  private SETTINGS_KEY = 'reportes.settings.v1';
  private FOLIO_KEY = 'reportes.folio.v1';

  settings: EncabezadoSettings = {
    escuela: 'COLEGIO NUEVOS HORIZONTES',
    direccion: 'Calle Ejemplo #123, Col. Centro, C.P. 00000',
    telefono: '(000) 000 00 00',
    maestro: 'Juan Pérez',
    grupo: '3° A',
    citaFecha: '',
    citaHora: '',
    logoUrl: '',
    folioActual: 1,
  };

  constructor(private api: ReportesService) { }

  ngOnInit(): void {
    console.log('🔄 Inicializando componente de reportes...');
    
    // Aplicar fondo negro como respaldo (por si el CSS no carga)
    this.applyDarkThemeBackup();
    
    this.cargarSettings();
    this.cargarFolio();
    this.cargarTodo();
  }

  // ================== Fondo negro de respaldo ==================
  private applyDarkThemeBackup() {
    // Esperar un momento para asegurar que el DOM esté listo
    setTimeout(() => {
      const element = document.querySelector('app-reportes');
      if (element) {
        (element as HTMLElement).style.backgroundColor = '#000000';
        (element as HTMLElement).style.color = '#ffffff';
        (element as HTMLElement).style.minHeight = '100vh';
        (element as HTMLElement).style.display = 'block';
      }
      
      // Aplicar también al body para mayor seguridad
      document.body.style.backgroundColor = '#000000';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      
      console.log('🎨 Tema oscuro aplicado como respaldo');
    }, 50);
  }

  // ================== Carga inicial ==================
  private cargarTodo() {
    this.cargando = true;
    console.log('📥 Cargando datos para maestroId:', this.maestroId);

    // Obtener estudiantes - CORREGIDO: pasa maestroId como parámetro
    this.api.getEstudiantes(this.maestroId).subscribe({
      next: (estudiantes: EstudianteOpt[]) => {
        console.log('✅ Estudiantes cargados:', estudiantes);
        this.estudiantes = estudiantes;
        
        if (this.estudiantes.length === 0) {
          console.warn('⚠️ No se cargaron estudiantes, usando datos de ejemplo');
          this.estudiantes = this.obtenerEstudiantesEjemplo();
        }
      },
      error: (error: any) => {
        console.error('❌ Error cargando estudiantes:', error);
        this.estudiantes = this.obtenerEstudiantesEjemplo();
      }
    });

    // Obtener reportes - PRUEBA: Primero sin maestroId para ver todos
    console.log('🔍 PRUEBA: Intentando cargar reportes SIN filtro maestroId');
    this.api.getReportes({ resumen: 1 }).subscribe({
      next: (resp: GetReportesResp) => {
        console.log('✅ Respuesta reportes (sin filtro):', resp);
        
        if (resp.success) {
          this.reportes = resp.data || [];
          this.resumen = resp.summary || this.recuentoLocal();
          console.log(`📊 ${this.reportes.length} reportes cargados (sin filtro)`);
          
          // DEPURACIÓN: Mostrar debug info si está disponible
          if (resp.debug) {
            console.log('🐛 Debug info del backend:', resp.debug);
          }
        } else {
          console.warn('⚠️ Respuesta no exitosa:', resp.message);
          this.reportes = [];
          this.resumen = this.recuentoLocal();
        }
        
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('❌ Error cargando reportes (sin filtro):', error);
        
        // Si falla sin filtro, intentar CON filtro
        console.log('🔍 Intentando cargar reportes CON filtro maestroId:', this.maestroId);
        this.api.getReportes({ maestroId: this.maestroId, resumen: 1 }).subscribe({
          next: (respConFiltro: GetReportesResp) => {
            console.log('✅ Respuesta reportes (con filtro):', respConFiltro);
            
            if (respConFiltro.success) {
              this.reportes = respConFiltro.data || [];
              this.resumen = respConFiltro.summary || this.recuentoLocal();
              console.log(`📊 ${this.reportes.length} reportes cargados (con filtro)`);
            } else {
              console.warn('⚠️ Respuesta no exitosa (con filtro):', respConFiltro.message);
              this.reportes = [];
              this.resumen = this.recuentoLocal();
            }
            
            this.cargando = false;
          },
          error: (errorFiltro: any) => {
            console.error('❌ Error cargando reportes (con filtro):', errorFiltro);
            // Usar datos de ejemplo temporalmente para pruebas
            this.reportes = this.obtenerReportesEjemplo();
            this.resumen = this.recuentoLocal();
            this.cargando = false;
          }
        });
      }
    });
  }

  private obtenerEstudiantesEjemplo(): EstudianteOpt[] {
    return [
      { id: 16, nombre: 'Luis Pérez' },
      { id: 9, nombre: 'Carla Pérez' },
      { id: 10, nombre: 'Pedro Gómez' },
      { id: 11, nombre: 'Lucía Fernández' }
    ];
  }

  private obtenerReportesEjemplo(): ReporteDTO[] {
    return [
      {
        id: 1,
        tipo: 'academico',
        estudianteId: 16,
        motivo: 'Bajo rendimiento',
        descripcion: 'No entrega tareas regularmente',
        estado: 'pendiente',
        prioridad: 'media',
        fecha: '2025-10-30',
        accionesTomadas: undefined,
      },
      {
        id: 2,
        tipo: 'conducta',
        estudianteId: 9,
        motivo: 'Interrupciones en clase',
        descripcion: 'Constante interrupción a compañeros',
        estado: 'resuelto',
        prioridad: 'alta',
        fecha: '2025-10-29',
        accionesTomadas: 'Llamada a padres',
      },
      {
        id: 3,
        tipo: 'asistencia',
        estudianteId: 10,
        motivo: 'Faltas recurrentes',
        descripcion: '5 faltas en las últimas 2 semanas',
        estado: 'pendiente',
        prioridad: 'alta',
        fecha: '2025-10-28',
        accionesTomadas: 'Enviado citatorio',
      }
    ];
  }

  private recuentoLocal() {
    const total = this.reportes.length;
    const pendientes = this.reportes.filter(x => x.estado === 'pendiente').length;
    const resueltos = this.reportes.filter(x => x.estado === 'resuelto').length;
    const altaPrioridad = this.reportes.filter(x => x.prioridad === 'alta').length;
    
    console.log('🧮 Resumen local:', { total, pendientes, resueltos, altaPrioridad });
    
    return { total, pendientes, resueltos, altaPrioridad };
  }

  // ================== Helpers KPI ==================
  obtenerCantidadPendientes(): number {
    return this.resumen.pendientes;
  }

  obtenerCantidadResueltos(): number {
    return this.resumen.resueltos;
  }

  obtenerCantidadAltaPrioridad(): number {
    return this.resumen.altaPrioridad;
  }

  obtenerTotalReportes(): number {
    return this.resumen.total;
  }

  // ================== Crear Reporte ==================
  crearReporte(): void {
    if (!this.validarReporte()) return;
    
    this.guardando = true;
    console.log('📝 Creando nuevo reporte:', this.nuevoReporte);

    this.api.crear({
      tipo: this.nuevoReporte.tipo as TipoReporte,
      estudianteId: this.nuevoReporte.estudianteId,
      motivo: this.nuevoReporte.motivo.trim(),
      descripcion: this.nuevoReporte.descripcion.trim(),
      prioridad: this.nuevoReporte.prioridad,
      maestroId: this.maestroId,
    }).subscribe({
      next: (result: ApiResponse) => {
        console.log('✅ Respuesta crear:', result);
        
        if (result.success) {
          alert('✅ Reporte creado exitosamente');
          this.limpiarFormulario();
          this.cargarTodo();
        } else {
          alert(`❌ Error: ${result.message}`);
        }
        
        this.guardando = false;
      },
      error: (error: any) => {
        console.error('❌ Error creando reporte:', error);
        alert('❌ Error al crear el reporte');
        this.guardando = false;
      }
    });
  }

  validarReporte(): boolean {
    const n = this.nuevoReporte;
    if (!n.tipo || !n.estudianteId || !n.motivo.trim() || !n.descripcion.trim()) {
      alert('⚠️ Complete todos los campos: tipo, estudiante, motivo y descripción.');
      return false;
    }
    return true;
  }

  limpiarFormulario(): void {
    this.nuevoReporte = {
      tipo: '' as any,
      estudianteId: 0,
      motivo: '',
      descripcion: '',
      prioridad: 'media'
    };
    console.log('🧹 Formulario limpiado');
  }

  // ================== Acciones por tarjeta ==================
  cambiarEstado(r: ReporteDTO, nuevo: EstadoReporte) {
    console.log(`🔄 Cambiando estado ${r.id} → ${nuevo}`);
    
    this.api.cambiarEstado({
      id: r.id,
      estado: nuevo,
      accionesTomadas: r.accionesTomadas || ''
    }).subscribe({
      next: (result: ApiResponse) => {
        if (result.success) {
          console.log('✅ Estado actualizado');
          this.cargarTodo();
        } else {
          alert(`❌ Error: ${result.message}`);
        }
      },
      error: (error: any) => {
        console.error('❌ Error actualizando estado:', error);
        alert('❌ Error al actualizar estado');
      }
    });
  }

  eliminarReporte(id: number) {
    if (!confirm('¿Está seguro de eliminar este reporte?')) return;
    
    console.log('🗑️ Eliminando reporte ID:', id);
    
    this.api.eliminar(id).subscribe({
      next: (result: ApiResponse) => {
        if (result.success) {
          alert('✅ Reporte eliminado');
          this.cargarTodo();
        } else {
          alert(`❌ Error: ${result.message}`);
        }
      },
      error: (error: any) => {
        console.error('❌ Error eliminando:', error);
        alert('❌ Error al eliminar reporte');
      }
    });
  }

  eliminar(r: ReporteDTO) {
    this.eliminarReporte(r.id);
  }

  // ================== Encabezado (persistencia) ==================
  cargarSettings() {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (raw) {
        this.settings = { ...this.settings, ...JSON.parse(raw) };
        console.log('⚙️ Configuración cargada:', this.settings);
      }
    } catch (e) {
      console.error('❌ Error cargando settings:', e);
    }
  }

  guardarSettings() {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    console.log('💾 Configuración guardada');
    alert('✅ Encabezado guardado');
  }

  // ================== Folio ==================
  cargarFolio() {
    const n = Number(localStorage.getItem(this.FOLIO_KEY) || '1');
    this.settings.folioActual = isNaN(n) || n < 1 ? 1 : n;
    console.log('📄 Folio cargado:', this.settings.folioActual);
  }

  private incrementarFolio() {
    this.settings.folioActual = (this.settings.folioActual || 1) + 1;
    localStorage.setItem(this.FOLIO_KEY, String(this.settings.folioActual));
    console.log('📈 Folio incrementado a:', this.settings.folioActual);
  }

  reiniciarFolio() {
    if (!confirm('¿Está seguro de reiniciar el folio a 1?')) return;
    this.settings.folioActual = 1;
    localStorage.setItem(this.FOLIO_KEY, '1');
    console.log('🔄 Folio reiniciado a 1');
    alert('✅ Folio reiniciado');
  }

  folioEtiquetaSimple() {
    return `REP-${String(this.settings.folioActual).padStart(4, '0')}`;
  }

  // ================== Logo (upload) ==================
  async onLogoSelected(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('⚠️ El logo no puede ser mayor a 5MB');
      return;
    }
    
    console.log('🖼️ Subiendo logo:', file.name);
    this.logoSubiendo = true;
    
    this.api.subirLogo(file).subscribe({
      next: (result: ApiResponse<{ url: string }>) => {
        if (result.success && result.data?.url) {
          this.settings.logoUrl = result.data.url;
          this.guardarSettings();
          console.log('✅ Logo subido:', result.data.url);
          alert('✅ Logo subido exitosamente');
        } else {
          alert(`❌ Error: ${result.message}`);
        }
        this.logoSubiendo = false;
      },
      error: (error: any) => {
        console.error('❌ Error subiendo logo:', error);
        alert('❌ Error al subir logo');
        this.logoSubiendo = false;
      }
    });
  }

  // ================== Export ==================
  exportarReportes() {
    console.log('📤 Exportando reportes a CSV');
    this.api.exportarCSV({ maestroId: this.maestroId, sep: ';' });
  }

  // Exportar un reporte guardado (por ID)
  exportarWord(r: ReporteDTO) {
    console.log('📄 Exportando reporte a Word:', r.id);
    this.guardarSettings();
    
    const estudianteNombre = this.nombreEstudiante(r.estudianteId);
    
    const params = {
      id: String(r.id),
      escuela: this.settings.escuela,
      direccion: this.settings.direccion,
      telefono: this.settings.telefono,
      maestro: this.settings.maestro,
      grupo: this.settings.grupo,
      cita: this.compCitaISO(),
      folioN: String(this.settings.folioActual),
      logo: this.settings.logoUrl || '',
      tipo: r.tipo,
      estudiante: estudianteNombre,
      prioridad: r.prioridad,
      motivo: r.motivo,
      descripcion: r.descripcion,
      estado: r.estado,
      fecha: r.fecha,
      accionesTomadas: r.accionesTomadas || ''
    };
    
    this.api.exportarWord(params);
    this.incrementarFolio();
  }

  // Exportar desde el formulario (sin guardar en BD)
  exportarWordDesdeFormulario() {
    if (!this.validarReporte()) {
      alert('⚠️ Complete todos los campos antes de exportar');
      return;
    }
    
    console.log('📄 Exportando formulario a Word');
    this.guardarSettings();
    
    const estudianteNombre = this.nombreEstudiante(this.nuevoReporte.estudianteId);
    
    const params = {
      tipo: this.nuevoReporte.tipo || '',
      estudiante: estudianteNombre,
      prioridad: this.nuevoReporte.prioridad || 'media',
      motivo: this.nuevoReporte.motivo || '',
      descripcion: this.nuevoReporte.descripcion || '',
      escuela: this.settings.escuela,
      direccion: this.settings.direccion,
      telefono: this.settings.telefono,
      maestro: this.settings.maestro,
      grupo: this.settings.grupo,
      cita: this.compCitaISO(),
      folioN: String(this.settings.folioActual),
      logo: this.settings.logoUrl || '',
      estado: 'pendiente', // Por defecto para formulario nuevo
      fecha: new Date().toISOString().split('T')[0], // Fecha actual
      accionesTomadas: ''
    };

    this.api.exportarWord(params);
    this.incrementarFolio();
  }

  private compCitaISO() {
    const f = (this.settings.citaFecha || '').trim();
    const h = (this.settings.citaHora || '').trim();
    if (!f && !h) return '';
    return `${f}${h ? 'T' + h : ''}`;
  }

  // ================== Filtros ==================
  get reportesFiltrados(): ReporteDTO[] {
    let f = this.reportes.slice();
    
    if (this.filtroTipo !== 'todos') f = f.filter(r => r.tipo === this.filtroTipo);
    if (this.filtroEstado !== 'todos') f = f.filter(r => r.estado === this.filtroEstado);
    if (this.filtroPrioridad !== 'todos') f = f.filter(r => r.prioridad === this.filtroPrioridad);
    if (this.filtroEstudiante > 0) f = f.filter(r => r.estudianteId === this.filtroEstudiante);
    
    const sorted = f.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    console.log(`🔍 ${f.length} de ${this.reportes.length} reportes filtrados`);
    
    return sorted;
  }

  filtrados() {
    return this.reportesFiltrados;
  }

  // ================== Helpers UI ==================
  nombreEstudiante(id: number): string {
    const estudiante = this.estudiantes.find(e => e.id === id);
    return estudiante?.nombre ?? '—';
  }

  obtenerNombreTipo(tipo: TipoReporte) {
    return this.tiposReporte.find(t => t.valor === tipo)?.nombre ?? '—';
  }

  iconoTipo(tipo: TipoReporte) {
    return this.tiposReporte.find(t => t.valor === tipo)?.icono ?? '📄';
  }

  fechaBonita(f: string) {
    try {
      return new Date(f).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return f;
    }
  }

  obtenerColorPrioridad(p: Prioridad) {
    return this.nivelesPrioridad.find(x => x.valor === p)?.color ?? '#95a5a6';
  }

  obtenerColorEstado(e: EstadoReporte) {
    return this.estadosReporte.find(x => x.valor === e)?.color ?? '#95a5a6';
  }

  generarReporteRapido(tipo: TipoReporte, estudianteId: number, motivo: string) {
    console.log('🚀 Generando reporte rápido:', { tipo, estudianteId, motivo });
    
    this.nuevoReporte.tipo = tipo;
    this.nuevoReporte.estudianteId = estudianteId || 0;
    this.nuevoReporte.motivo = motivo;
    const nombre = this.nombreEstudiante(estudianteId) || 'el estudiante';
    this.nuevoReporte.descripcion = `Reporte rápido para ${nombre}. ${motivo}`;
    this.nuevoReporte.prioridad = 'media';
    
    console.log('📝 Formulario prellenado:', this.nuevoReporte);
  }

  // ================== Debug ==================
  debugInfo() {
    console.log('🐛 DEBUG INFO:');
    console.log('📊 Reportes:', this.reportes);
    console.log('👥 Estudiantes:', this.estudiantes);
    console.log('📈 Resumen:', this.resumen);
    console.log('⚙️ Settings:', this.settings);
    console.log('🎯 Filtros:', {
      tipo: this.filtroTipo,
      estado: this.filtroEstado,
      prioridad: this.filtroPrioridad,
      estudiante: this.filtroEstudiante
    });
    
    // Probar conexión directa con el backend
    this.testConnection();
  }
  
  testConnection() {
    console.log('🧪 Probando conexión con backend...');
    this.api.testConnection().subscribe({
      next: (resp) => {
        console.log('✅ Test conexión exitoso:', resp);
      },
      error: (error) => {
        console.error('❌ Test conexión falló:', error);
      }
    });
  }

  // ================== Modal ==================
  abrirModal(reporte: ReporteDTO) {
    this.reporteSeleccionado = reporte;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.reporteSeleccionado = null;
  }

  // ================== Utilidades ==================
  recargarDatos() {
    console.log('🔄 Recargando datos...');
    this.cargarTodo();
  }

  limpiarFiltros() {
    this.filtroTipo = 'todos';
    this.filtroEstado = 'todos';
    this.filtroPrioridad = 'todos';
    this.filtroEstudiante = 0;
    console.log('🧹 Filtros limpiados');
  }

  // ================== Logo URL ==================
  getLogoUrl(): string {
    if (!this.settings.logoUrl) return '';
    return `http://localhost:3000/${this.settings.logoUrl}`;
  }

  // ================== Fecha y hora bonita ==================
  fechaHoraBonita(fecha: string): string {
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-MX') + ' ' + fechaObj.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }
}