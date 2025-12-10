import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';

// =====================================================
// 🎯 INTERFACES TIPADAS
// =====================================================
interface Materia {
  id_materia: number;
  nombre: string;
  descripcion?: string;
  color: string;
  icono: string;
  created_at?: string;
}

interface Entrega {
  id_entrega: number;
  id_tarea: number;
  estudiante_id: number;
  nombre_alumno: string;
  nombre_tutor?: string;
  email_tutor?: string;
  telefono_tutor?: string;
  archivo_entrega?: string | null;
  fecha_entrega?: string | null;
  calificacion?: number | null;
  comentario_alumno?: string | null;
  comentario_docente?: string | null;
  estado: 'PENDIENTE' | 'ENTREGADO' | 'REVISADO';
}

interface Tarea {
  id_tarea: number;
  id_materia: number | null;
  nombre_materia?: string;
  titulo: string;
  instrucciones: string;
  fecha_cierre: string;
  permitir_entrega_tarde: number | boolean;
  activa: number | boolean;
  archivo_adjunto?: string | null;
  rubrica?: string | null;
  created_by: number;
  trimestre: string | number;
  total_entregas?: number;
  entregas_revisadas?: number;
  entregas_pendientes?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  tareas?: Tarea[];
  materias?: Materia[];
  entregas?: Entrega[];
  maestro?: string;
  error?: string;
  message?: string;
}

// =====================================================
// 🎨 COMPONENTE TAREAS - PROFESIONAL
// =====================================================
@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TareasComponent implements OnInit, OnDestroy {
  
  // =====================================================
  // ⚙️ CONFIGURACIÓN BACKEND
  // =====================================================
  private readonly API_URL = 'http://localhost:3000/api';
  private readonly TAREAS_ENDPOINT = `${this.API_URL}/maestro/tareas`;
  private readonly MATERIAS_ENDPOINT = `${this.API_URL}/materias`;
  private readonly ARCHIVOS_BASE = 'http://localhost:3000';

  // =====================================================
  // 📊 DATOS PRINCIPALES
  // =====================================================
  tareas: Tarea[] = [];
  materias: Materia[] = [];
  nombreMaestro: string = 'Maestro';
  tareaSeleccionada: Tarea | null = null;
  entregas: Entrega[] = [];

  // =====================================================
  // ⏱️ ESTADOS DE CARGA
  // =====================================================
  loadingTareas: boolean = false;
  loadingEntregas: boolean = false;
  guardandoTarea: boolean = false;
  
  // =====================================================
  // ⚠️ MANEJO DE ERRORES
  // =====================================================
  errorTareas: string | null = null;
  errorEntregas: string | null = null;
  errorModalTarea: string | null = null;
  errorMateriaModal: string | null = null;

  // =====================================================
  // 🎯 FILTRO TRIMESTRE
  // =====================================================
  trimestreSeleccionado: 'all' | '1' | '2' | '3' = 'all';

  // =====================================================
  // 🪟 ESTADOS DE MODALES
  // =====================================================
  modalCalificarAbierto = false;
  modalTareaAbierto = false;
  modalMateriasAbierto = false;
  modalAlertaAbierto = false;
  modalConfirmacionAbierto = false;

  // =====================================================
  // 📝 FORMULARIOS
  // =====================================================
  formTarea = {
    id_tarea: 0,
    id_materia: '',
    titulo: '',
    instrucciones: '',
    fecha_cierre: '',
    permitir_entrega_tarde: true,
    activa: true,
    rubrica: '',
    created_by: 1,
    trimestre: '1'
  };

  materiaForm: Omit<Materia, 'id_materia'> & { id_materia: number | '' } = {
    id_materia: '',
    nombre: '',
    descripcion: '',
    color: '',
    icono: '📚'
  };

  // =====================================================
  // 📊 CALIFICACIÓN
  // =====================================================
  entregaEditando: Entrega | null = null;
  notaTemp: string = '';
  comentarioTemp: string = '';

  // =====================================================
  // ⚡ ALERTAS Y CONFIRMACIONES
  // =====================================================
  alertaTitulo = '';
  alertaMensaje = '';
  alertaTipo: 'success' | 'error' | 'info' | 'warning' = 'info';
  
  confirmacionTitulo = '';
  confirmacionMensaje = '';
  private onConfirmCallback: (() => void) | null = null;

  // =====================================================
  // 📎 ARCHIVOS
  // =====================================================
  archivoSeleccionado: File | null = null;
  rutaArchivoAdjunto = '';
  fechaTemporal = '';
  fechaMinima = '';

  // =====================================================
  // 🔄 FLAGS DE EDICIÓN
  // =====================================================
  editandoTarea = false;
  editandoMateria = false;

  // =====================================================
  // 🎲 COLORES POR DEFECTO PARA MATERIAS
  // =====================================================
  private readonly COLORES_MATERIAS: Record<string, string> = {
    'Matemáticas': '#667eea',
    'Ciencias': '#48bb78',
    'Español': '#ed8936',
    'Historia': '#f56565',
    'Valores': '#9f7aea',
    'Inglés': '#4299e1',
    'Educación Física': '#e53e3e',
    'Arte': '#d53f8c',
    'Música': '#38a169',
    'Tecnología': '#3182ce',
    'Filosofía': '#805ad5',
    'Geografía': '#dd6b20',
    'Química': '#0ea5e9',
    'Física': '#8b5cf6',
    'Biología': '#10b981'
  };

  // =====================================================
  // 🚫 RXJS UNSUBSCRIBE
  // =====================================================
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private cdRef: ChangeDetectorRef
  ) {}

  // =====================================================
  // 🎬 LIFECYCLE HOOKS
  // =====================================================
  ngOnInit(): void {
    console.log('🔵 TareasComponent inicializando...');
    this.verificarAutenticacion();
    this.cargarTareas();
    this.cargarMaterias();
    this.establecerFechaMinima();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =====================================================
  // 🔐 AUTENTICACIÓN - MEJORADO
  // =====================================================
  private verificarAutenticacion(): void {
    const authToken = localStorage.getItem('authToken');
    const token = localStorage.getItem('token');
    
    console.log('🔐 Tokens disponibles:', { authToken, token });
    
    if (!authToken && !token) {
      console.error('🚫 No hay token de autenticación disponible');
      this.mostrarAlerta(
        'Sesión Expirada',
        'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        'error'
      );
    } else {
      console.log('✅ Autenticación verificada');
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    const userId = localStorage.getItem('userId') || '1';

    console.log('🔑 Creando headers con token:', token ? '✓ Token presente' : '✗ Token ausente');
    console.log('👤 User ID:', userId);

    if (!token) {
      throw new Error('Token de autenticación no disponible');
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-User-Id': userId
    });
  }

  private getAuthHeadersFormData(): HttpHeaders {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    const userId = localStorage.getItem('userId') || '1';

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'X-User-Id': userId
    });
  }

  // =====================================================
  // 💬 SISTEMA DE ALERTAS
  // =====================================================
  mostrarAlerta(
    titulo: string, 
    mensaje: string, 
    tipo: 'success' | 'error' | 'info' | 'warning' = 'info'
  ): void {
    this.alertaTitulo = titulo;
    this.alertaMensaje = mensaje;
    this.alertaTipo = tipo;
    this.modalAlertaAbierto = true;
    this.cdRef.markForCheck();
  }

  cerrarAlerta(): void {
    this.modalAlertaAbierto = false;
    this.cdRef.markForCheck();
  }

  // =====================================================
  // ⚠️ SISTEMA DE CONFIRMACIONES
  // =====================================================
  mostrarConfirmacion(
    titulo: string, 
    mensaje: string, 
    onConfirm: () => void
  ): void {
    this.confirmacionTitulo = titulo;
    this.confirmacionMensaje = mensaje;
    this.onConfirmCallback = onConfirm;
    this.modalConfirmacionAbierto = true;
    this.cdRef.markForCheck();
  }

  aceptarConfirmacion(): void {
    if (this.onConfirmCallback) {
      try {
        this.onConfirmCallback();
      } catch (error) {
        console.error('Error ejecutando confirmación:', error);
        this.mostrarAlerta('Error', 'Ocurrió un error al procesar la acción', 'error');
      }
    }
    this.cerrarConfirmacion();
  }

  cerrarConfirmacion(): void {
    this.modalConfirmacionAbierto = false;
    this.onConfirmCallback = null;
    this.cdRef.markForCheck();
  }

  // =====================================================
  // 📅 MANEJO DE FECHAS
  // =====================================================
  private establecerFechaMinima(): void {
    const now = new Date();
    this.fechaMinima = now.toISOString().slice(0, 16);
  }

  actualizarFechaDesdeInput(): void {
    if (!this.fechaTemporal) return;
    
    try {
      const fecha = new Date(this.fechaTemporal);
      if (isNaN(fecha.getTime())) {
        throw new Error('Fecha inválida');
      }
      this.formTarea.fecha_cierre = fecha.toISOString().slice(0, 19).replace('T', ' ');
      this.cdRef.markForCheck();
    } catch (error) {
      console.error('Error actualizando fecha:', error);
      this.mostrarAlerta('Error', 'La fecha ingresada no es válida', 'error');
    }
  }

  formatearFechaParaInput(fecha: string): string {
    if (!fecha) return '';
    
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        return '';
      }
      
      // Formatear como YYYY-MM-DDTHH:mm
      const year = fechaObj.getFullYear();
      const month = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
      const day = fechaObj.getDate().toString().padStart(2, '0');
      const hours = fechaObj.getHours().toString().padStart(2, '0');
      const minutes = fechaObj.getMinutes().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.warn('Error formateando fecha para input:', error);
      return '';
    }
  }

  // =====================================================
  // 📥 CARGAR DATOS - MEJORADO CON LOGS
  // =====================================================
  cargarTareas(): void {
    console.log('🔄 Iniciando carga de tareas...');
    this.loadingTareas = true;
    this.errorTareas = null;
    this.cdRef.markForCheck();

    try {
      const headers = this.getAuthHeaders();
      const url = `${this.TAREAS_ENDPOINT}/listar`;
      
      console.log('🌐 Solicitando tareas desde:', url);
      
      this.http.get<ApiResponse>(url, { headers })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loadingTareas = false;
            this.cdRef.markForCheck();
            console.log('✅ Finalizada carga de tareas');
          })
        )
        .subscribe({
          next: (res: ApiResponse) => {
            console.log('📥 Respuesta recibida:', res);
            
            if (res?.ok && res.tareas) {
              this.tareas = res.tareas;
              this.nombreMaestro = res.maestro || 'Maestro';
              
              console.log(`📚 ${this.tareas.length} tareas cargadas:`);
              this.tareas.forEach((tarea, i) => {
                console.log(`   ${i+1}. ${tarea.titulo} (ID: ${tarea.id_tarea}) - Materia ID: ${tarea.id_materia}`);
              });
              
              if (this.tareas.length > 0 && !this.tareaSeleccionada) {
                console.log('🎯 Seleccionando primera tarea automáticamente');
                this.seleccionarTarea(this.tareas[0]);
              } else {
                console.log('ℹ️ No hay tareas para seleccionar');
              }
            } else {
              console.warn('⚠️ Respuesta inesperada:', res);
              this.errorTareas = 'No se encontraron tareas disponibles';
              this.mostrarAlerta('Información', 'No hay tareas registradas en el sistema', 'info');
            }
            
            this.cdRef.markForCheck();
          },
          error: (err: HttpErrorResponse) => {
            console.error('❌ Error en cargarTareas:', err);
            this.manejarErrorCargaTareas(err);
            this.cdRef.markForCheck();
          }
        });
    } catch (error: any) {
      console.error('🚨 Excepción en cargarTareas:', error);
      this.manejarErrorCritico(error, 'cargarTareas');
      this.cdRef.markForCheck();
    }
  }

  private manejarErrorCargaTareas(err: HttpErrorResponse): void {
    console.error('❌ Error cargando tareas:', {
      status: err.status,
      statusText: err.statusText,
      error: err.error,
      url: err.url
    });
    
    let mensajeError = 'Error al cargar las tareas';
    
    switch (err.status) {
      case 0:
        mensajeError = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
        console.error('🔌 Error de conexión - ¿Servidor ejecutándose?');
        break;
      case 401:
        mensajeError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        console.error('🔐 Error 401 - Token inválido o expirado');
        break;
      case 403:
        mensajeError = 'No tienes permiso para ver estas tareas.';
        console.error('🚫 Error 403 - Acceso denegado');
        break;
      case 404:
        mensajeError = 'El servicio de tareas no está disponible.';
        console.error('🔍 Error 404 - Endpoint no encontrado');
        break;
      case 500:
        mensajeError = 'Error interno del servidor. Intenta más tarde.';
        console.error('💥 Error 500 - Error del servidor');
        break;
      default:
        mensajeError = `Error ${err.status}: ${err.statusText || 'Error de conexión'}`;
    }
    
    this.errorTareas = mensajeError;
    this.mostrarAlerta('Error de carga', mensajeError, 'error');
  }

  cargarMaterias(): void {
    console.log('🔄 Iniciando carga de materias...');
    
    try {
      const headers = this.getAuthHeaders();
      const url = `${this.MATERIAS_ENDPOINT}/lista`;
      
      console.log('🌐 Solicitando materias desde:', url);
      
      this.http.get<ApiResponse>(url, { headers })
        .pipe(
          takeUntil(this.destroy$),
          catchError(err => {
            console.error('❌ Error cargando materias:', err);
            return [];
          })
        )
        .subscribe({
          next: (res: ApiResponse) => {
            console.log('📥 Respuesta de materias:', res);
            
            if (res?.ok && res.materias) {
              this.materias = res.materias;
              console.log(`📚 ${this.materias.length} materias cargadas`);
            } else {
              console.warn('⚠️ No se pudieron cargar materias:', res);
            }
            
            this.cdRef.markForCheck();
          }
        });
    } catch (error: any) {
      console.error('🚨 Error crítico cargando materias:', error);
    }
  }

  // =====================================================
  // 🎯 FUNCIONES PRINCIPALES
  // =====================================================
  seleccionarTarea(tarea: Tarea): void {
    console.log('🎯 Seleccionando tarea:', tarea.titulo, `(ID: ${tarea.id_tarea})`, `Materia ID: ${tarea.id_materia}`);
    this.tareaSeleccionada = tarea;
    this.cargarEntregas(tarea.id_tarea);
    this.cdRef.markForCheck();
  }

  cargarEntregas(idTarea: number): void {
    console.log('🔄 Cargando entregas para tarea ID:', idTarea);
    this.loadingEntregas = true;
    this.errorEntregas = null;
    this.cdRef.markForCheck();

    try {
      const headers = this.getAuthHeaders();
      const url = `${this.TAREAS_ENDPOINT}/entregas`;
      
      console.log('🌐 Solicitando entregas desde:', url, 'para tarea:', idTarea);
      
      this.http.get<ApiResponse>(url, {
        params: { id_tarea: idTarea.toString() },
        headers
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingEntregas = false;
          this.cdRef.markForCheck();
          console.log('✅ Finalizada carga de entregas');
        })
      )
      .subscribe({
        next: (res: ApiResponse) => {
          console.log('📥 Respuesta de entregas:', res);
          
          if (res?.ok && res.entregas) {
            this.entregas = res.entregas;
            console.log(`📄 ${this.entregas.length} entregas cargadas`);
          } else {
            console.warn('⚠️ No se encontraron entregas:', res);
          }
          
          this.cdRef.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          console.error('❌ Error cargando entregas:', err);
          this.errorEntregas = `Error al cargar entregas: ${err.status}`;
          this.cdRef.markForCheck();
        }
      });
    } catch (error: any) {
      console.error('🚨 Error crítico cargando entregas:', error);
      this.manejarErrorCritico(error, 'cargarEntregas');
      this.cdRef.markForCheck();
    }
  }

  // =====================================================
  // 🔍 FILTRADO
  // =====================================================
  get tareasFiltradas(): Tarea[] {
    if (this.trimestreSeleccionado === 'all') {
      return this.tareas;
    }
    
    return this.tareas.filter(tarea => 
      tarea.trimestre.toString() === this.trimestreSeleccionado
    );
  }

  setTrimestre(trimestre: 'all' | '1' | '2' | '3'): void {
    this.trimestreSeleccionado = trimestre;
    
    if (this.tareasFiltradas.length > 0) {
      this.seleccionarTarea(this.tareasFiltradas[0]);
    } else {
      this.tareaSeleccionada = null;
      this.entregas = [];
    }
    this.cdRef.markForCheck();
  }

  // =====================================================
  // 🛠️ UTILIDADES
  // =====================================================
  permiteTarde(tarea: Tarea | null): boolean {
    return tarea ? Boolean(tarea.permitir_entrega_tarde) : false;
  }

  permitidoTardeText(tarea: Tarea | null): string {
    if (!tarea) return '—';
    return this.permiteTarde(tarea) ? 'Sí (acepta tarde)' : 'No';
  }

  estaActiva(tarea: Tarea | null): boolean {
    return tarea ? Boolean(tarea.activa) : false;
  }

  activaText(tarea: Tarea | null): string {
    if (!tarea) return '—';
    return this.estaActiva(tarea) ? 'Activa' : 'Inactiva';
  }

  estadoClass(estado: string): string {
    if (!estado) return 'estado-chip pendiente';
    
    const e = estado.toUpperCase();
    if (e === 'REVISADO') return 'estado-chip revisado';
    if (e === 'ENTREGADO') return 'estado-chip entregado';
    return 'estado-chip pendiente';
  }

  materiaColor(nombre: string | undefined): string {
    if (!nombre) return '#718096';
    const materia = this.materias.find(m => m.nombre === nombre);
    return materia?.color || this.COLORES_MATERIAS[nombre] || '#718096';
  }

  getMateriaNombre(idMateria: string | number): string {
    if (!idMateria) return 'Sin materia';
    const materia = this.materias.find(m => m.id_materia == idMateria);
    return materia ? materia.nombre : 'Materia no encontrada';
  }

  getMateriaColor(idMateria: string | number): string {
    if (!idMateria) return '#718096';
    const materia = this.materias.find(m => m.id_materia == idMateria);
    return materia ? materia.color : '#718096';
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '';
    
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        return fecha;
      }
      
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.warn('Error formateando fecha:', error);
      return fecha;
    }
  }

  // ✅ MÉTODO CORREGIDO - ACEPTA undefined/null
  obtenerIconoArchivo(nombre: string | null | undefined): string {
    if (!nombre) return '📎';
    
    const ext = nombre.split('.').pop()?.toLowerCase() || '';
    const iconos: Record<string, string> = {
      'pdf': '📕',
      'doc': '📄',
      'docx': '📄',
      'txt': '📝',
      'xls': '📊',
      'xlsx': '📊',
      'ppt': '📽️',
      'pptx': '📽️',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'zip': '📦',
      'rar': '📦'
    };
    
    return iconos[ext] || '📎';
  }

  // ✅ MÉTODO CORREGIDO - ACEPTA undefined/null
  getNombreArchivo(ruta: string | null | undefined): string {
    if (!ruta) return 'Archivo no disponible';
    return ruta.split('/').pop() || 'Archivo sin nombre';
  }

  // ✅ MÉTODO CORREGIDO - ACEPTA undefined/null
  fileUrl(ruta: string | null | undefined): string | null {
    if (!ruta || ruta === 'null' || ruta === 'undefined') return null;
    
    const cleanPath = ruta.startsWith('/') ? ruta.substring(1) : ruta;
    return `${this.ARCHIVOS_BASE}/${cleanPath}`;
  }

  // =====================================================
  // 🪟 MODALES DE TAREAS - CORREGIDO
  // =====================================================
  abrirModalNuevaTarea(): void {
    console.log('➕ Abriendo modal para nueva tarea');
    this.editandoTarea = false;
    
    const fechaDefault = new Date();
    fechaDefault.setDate(fechaDefault.getDate() + 1);
    fechaDefault.setHours(23, 59, 0, 0);
    
    this.formTarea = {
      id_tarea: 0,
      id_materia: '',
      titulo: '',
      instrucciones: '',
      fecha_cierre: fechaDefault.toISOString().slice(0, 19).replace('T', ' '),
      permitir_entrega_tarde: true,
      activa: true,
      rubrica: '',
      created_by: 1,
      trimestre: '1'
    };
    
    this.fechaTemporal = this.formatearFechaParaInput(this.formTarea.fecha_cierre);
    this.archivoSeleccionado = null;
    this.rutaArchivoAdjunto = '';
    this.modalTareaAbierto = true;
    this.errorModalTarea = null;
    this.cdRef.markForCheck();
  }

  abrirModalEditarTarea(): void {
    console.log('🔄 Intentando abrir modal para editar tarea...');
    
    if (!this.tareaSeleccionada) {
      console.error('❌ No hay tarea seleccionada');
      this.mostrarAlerta('Selección requerida', 'Selecciona una tarea primero para editarla', 'info');
      return;
    }
    
    console.log('✅ Tarea seleccionada:', this.tareaSeleccionada);
    
    this.editandoTarea = true;
    
    // Asegúrate de que id_materia no sea null/undefined
    const idMateria = this.tareaSeleccionada.id_materia;
    console.log('📚 ID Materia de la tarea:', idMateria);
    
    this.formTarea = {
      id_tarea: this.tareaSeleccionada.id_tarea,
      id_materia: idMateria ? idMateria.toString() : '',
      titulo: this.tareaSeleccionada.titulo || '',
      instrucciones: this.tareaSeleccionada.instrucciones || '',
      fecha_cierre: this.tareaSeleccionada.fecha_cierre || '',
      permitir_entrega_tarde: Boolean(this.tareaSeleccionada.permitir_entrega_tarde),
      activa: Boolean(this.tareaSeleccionada.activa),
      rubrica: this.tareaSeleccionada.rubrica || '',
      created_by: this.tareaSeleccionada.created_by,
      trimestre: this.tareaSeleccionada.trimestre ? this.tareaSeleccionada.trimestre.toString() : '1'
    };
    
    console.log('📝 Formulario preparado:', this.formTarea);
    
    this.rutaArchivoAdjunto = this.tareaSeleccionada.archivo_adjunto || '';
    this.fechaTemporal = this.formatearFechaParaInput(this.formTarea.fecha_cierre);
    this.archivoSeleccionado = null;
    this.modalTareaAbierto = true;
    this.errorModalTarea = null;
    
    console.log('✅ Modal de edición listo');
    this.cdRef.markForCheck();
  }

  cerrarModalTarea(): void {
    this.modalTareaAbierto = false;
    this.errorModalTarea = null;
    this.cdRef.markForCheck();
  }

  // =====================================================
  // 🗑️ ELIMINAR TAREA
  // =====================================================
  eliminarTareaActual(): void {
    if (!this.tareaSeleccionada) {
      this.mostrarAlerta('Selección requerida', 'Selecciona una tarea primero para eliminarla', 'info');
      return;
    }
    
    this.mostrarConfirmacion(
      'Eliminar Tarea',
      `¿Estás seguro de eliminar la tarea <strong>"${this.tareaSeleccionada.titulo}"</strong>?<br>
       <small>Esta acción no se puede deshacer.</small>`,
      () => this.ejecutarEliminacionTarea()
    );
  }

  private ejecutarEliminacionTarea(): void {
    try {
      const headers = this.getAuthHeaders();
      
      this.http.post<ApiResponse>(`${this.TAREAS_ENDPOINT}/eliminar`, {
        id_tarea: this.tareaSeleccionada?.id_tarea
      }, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: ApiResponse) => {
          console.log('✅ Respuesta al eliminar tarea:', res);
          
          if (res?.ok) {
            this.mostrarAlerta(
              'Tarea eliminada',
              'La tarea ha sido eliminada correctamente',
              'success'
            );
            
            this.tareaSeleccionada = null;
            this.entregas = [];
            this.cargarTareas(); // Recarga automática
          } else {
            this.mostrarAlerta(
              'Error al eliminar',
              res?.error || 'No se pudo eliminar la tarea',
              'error'
            );
          }
          this.cdRef.markForCheck();
        },
        error: (err: HttpErrorResponse) => this.manejarErrorEliminacion(err)
      });
    } catch (error: any) {
      this.manejarErrorCritico(error, 'eliminarTarea');
    }
  }

  private manejarErrorEliminacion(err: HttpErrorResponse): void {
    console.error('❌ Error eliminando tarea:', err);
    
    let mensaje = 'Error al eliminar la tarea';
    
    switch (err.status) {
      case 401: mensaje = 'Tu sesión ha expirado'; break;
      case 403: mensaje = 'No tienes permiso para eliminar esta tarea'; break;
      case 404: mensaje = 'La tarea no existe o ya fue eliminada'; break;
      default: mensaje = `Error ${err.status}: ${err.error?.error || err.message}`;
    }
    
    this.mostrarAlerta('Error', mensaje, 'error');
  }

  // =====================================================
  // 📚 MATERIAS
  // =====================================================
  abrirModalMaterias(): void {
    this.modalMateriasAbierto = true;
    this.editandoMateria = false;
    this.errorMateriaModal = null;
    
    this.materiaForm = {
      id_materia: '',
      nombre: '',
      descripcion: '',
      color: this.generarColorAleatorio(),
      icono: '📚'
    };
    this.cdRef.markForCheck();
  }

  cerrarModalMaterias(): void {
    this.modalMateriasAbierto = false;
    this.cdRef.markForCheck();
  }

  editarMateria(materia: Materia): void {
    this.editandoMateria = true;
    this.errorMateriaModal = null;
    
    this.materiaForm = {
      id_materia: materia.id_materia,
      nombre: materia.nombre,
      descripcion: materia.descripcion || '',
      color: materia.color || this.generarColorAleatorio(),
      icono: materia.icono || '📚'
    };
    
    this.modalMateriasAbierto = true;
    this.cdRef.markForCheck();
  }

  guardarMateria(): void {
    if (!this.materiaForm.nombre.trim()) {
      this.errorMateriaModal = 'El nombre de la materia es obligatorio';
      this.cdRef.markForCheck();
      return;
    }

    if (this.materiaForm.nombre.length > 100) {
      this.errorMateriaModal = 'El nombre no puede exceder los 100 caracteres';
      this.cdRef.markForCheck();
      return;
    }

    const materiaData = {
      ...this.materiaForm,
      color: this.materiaForm.color || this.generarColorAleatorio()
    };

    try {
      const headers = this.getAuthHeaders();
      const endpoint = this.editandoMateria 
        ? `${this.MATERIAS_ENDPOINT}/actualizar`
        : `${this.MATERIAS_ENDPOINT}/crear`;
      
      console.log('💾 Guardando materia en:', endpoint, materiaData);
      
      this.http.post<ApiResponse>(endpoint, materiaData, { headers })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: ApiResponse) => {
            console.log('✅ Respuesta al guardar materia:', res);
            
            if (res?.ok) {
              this.mostrarAlerta(
                this.editandoMateria ? 'Materia actualizada' : 'Materia creada',
                this.editandoMateria 
                  ? 'La materia ha sido actualizada correctamente'
                  : 'La materia ha sido creada correctamente',
                'success'
              );
              
              this.cargarMaterias(); // Recarga automática
              this.cargarTareas(); // Recarga automática
              this.cerrarModalMaterias();
            } else {
              this.errorMateriaModal = res?.error || 'Error al guardar la materia';
              this.cdRef.markForCheck();
            }
          },
          error: (err: HttpErrorResponse) => {
            console.error('❌ Error guardando materia:', err);
            this.errorMateriaModal = err.error?.error || 'Error de conexión';
            this.cdRef.markForCheck();
          }
        });
    } catch (error: any) {
      this.manejarErrorCritico(error, 'guardarMateria');
    }
  }

  eliminarMateria(materia: Materia): void {
    this.mostrarConfirmacion(
      'Eliminar Materia',
      `¿Estás seguro de eliminar la materia <strong>"${materia.nombre}"</strong>?`,
      () => this.ejecutarEliminacionMateria(materia)
    );
  }

  private ejecutarEliminacionMateria(materia: Materia): void {
    try {
      const headers = this.getAuthHeaders();
      
      this.http.post<ApiResponse>(`${this.MATERIAS_ENDPOINT}/eliminar`, {
        id_materia: materia.id_materia
      }, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: ApiResponse) => {
          console.log('✅ Respuesta al eliminar materia:', res);
          
          if (res?.ok) {
            this.mostrarAlerta(
              'Materia eliminada',
              'La materia ha sido eliminada correctamente',
              'success'
            );
            
            this.cargarMaterias(); // Recarga automática
            this.cargarTareas(); // Recarga automática
          } else {
            this.mostrarAlerta(
              'Error',
              res?.error || 'No se puede eliminar la materia porque tiene tareas asignadas',
              'error'
            );
          }
          this.cdRef.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          console.error('❌ Error eliminando materia:', err);
          this.mostrarAlerta('Error', 'Error al eliminar la materia', 'error');
          this.cdRef.markForCheck();
        }
      });
    } catch (error: any) {
      this.manejarErrorCritico(error, 'eliminarMateria');
    }
  }

  // =====================================================
  // 📊 CALIFICACIÓN DE ENTREGAS - ¡CORREGIDO!
  // =====================================================
  abrirModalCalificar(entrega: Entrega): void {
    console.log('✍️ Abriendo modal para calificar entrega:', entrega);
    
    this.entregaEditando = entrega;
    
    // ✅ Asegurar que notaTemp sea string
    this.notaTemp = entrega.calificacion?.toString() || '';
    
    this.comentarioTemp = entrega.comentario_docente || '';
    this.modalCalificarAbierto = true;
    
    console.log('📝 Datos inicializados:', {
      notaTemp: this.notaTemp,
      tipoNotaTemp: typeof this.notaTemp,
      comentarioTemp: this.comentarioTemp
    });
    
    this.cdRef.markForCheck();
  }

  cerrarModalCalificar(): void {
    this.modalCalificarAbierto = false;
    this.entregaEditando = null;
    this.notaTemp = '';
    this.comentarioTemp = '';
    this.cdRef.markForCheck();
  }

  guardarCalificacion(): void {
    if (!this.entregaEditando) {
      console.error('❌ No hay entrega seleccionada para calificar');
      this.mostrarAlerta('Error', 'No hay entrega seleccionada', 'error');
      return;
    }
    
    console.log('💾 Guardando calificación para entrega ID:', this.entregaEditando.id_entrega);
    console.log('📝 Datos de calificación:', {
      notaTemp: this.notaTemp,
      tipoNotaTemp: typeof this.notaTemp,
      comentarioTemp: this.comentarioTemp
    });
    
    let calificacion: number | null = null;
    
    // ✅ SOLUCIÓN CORREGIDA: Convertir siempre a string primero
    const notaString = this.notaTemp?.toString()?.trim() || '';
    
    if (notaString) {
      const nota = parseFloat(notaString);
      
      console.log('🔢 Nota parseada:', nota, 'Es NaN?', isNaN(nota));
      
      if (isNaN(nota)) {
        this.mostrarAlerta('Error', 'La calificación debe ser un número válido', 'error');
        return;
      }
      
      if (nota < 0 || nota > 10) {
        this.mostrarAlerta('Error', 'La calificación debe estar entre 0 y 10', 'error');
        return;
      }
      
      calificacion = Math.round(nota * 10) / 10;
      console.log('✅ Calificación final:', calificacion);
    } else {
      console.log('ℹ️ No se ingresó calificación, se eliminará la existente');
    }
    
    const body = {
      id_entrega: this.entregaEditando.id_entrega,
      calificacion: calificacion,
      comentario_docente: this.comentarioTemp?.trim() || null
    };
    
    console.log('📦 Body para enviar al backend:', body);
    
    try {
      const headers = this.getAuthHeaders();
      const url = `${this.TAREAS_ENDPOINT}/calificar`;
      
      console.log('🌐 Enviando calificación a:', url);
      
      this.http.post<ApiResponse>(url, body, { headers })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: ApiResponse) => {
            console.log('📥 Respuesta del servidor:', res);
            
            if (res?.ok) {
              this.mostrarAlerta(
                'Calificación guardada',
                'La calificación ha sido actualizada correctamente',
                'success'
              );
              
              // Recargar entregas para mostrar cambios
              if (this.tareaSeleccionada) {
                this.cargarEntregas(this.tareaSeleccionada.id_tarea);
              }
              
              this.cerrarModalCalificar();
            } else {
              console.error('❌ Error del servidor:', res);
              this.mostrarAlerta(
                'Error', 
                res?.error || res?.message || 'Error al guardar calificación', 
                'error'
              );
            }
            this.cdRef.markForCheck();
          },
          error: (err: HttpErrorResponse) => {
            console.error('❌ Error HTTP completo:', {
              status: err.status,
              statusText: err.statusText,
              error: err.error,
              url: err.url
            });
            
            let mensaje = 'Error al guardar la calificación';
            
            if (err.status === 400) {
              mensaje = err.error?.error || 'Datos inválidos';
            } else if (err.status === 401) {
              mensaje = 'Sesión expirada';
            } else if (err.status === 500) {
              mensaje = 'Error interno del servidor';
            }
            
            this.mostrarAlerta('Error', mensaje, 'error');
            this.cdRef.markForCheck();
          }
        });
    } catch (error: any) {
      console.error('🚨 Error crítico:', error);
      this.manejarErrorCritico(error, 'guardarCalificacion');
    }
  }

  // =====================================================
  // 📎 MANEJO DE ARCHIVOS
  // =====================================================
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    const MAX_SIZE = 20 * 1024 * 1024;
    
    if (file.size > MAX_SIZE) {
      this.mostrarAlerta(
        'Archivo demasiado grande',
        'El tamaño máximo permitido es de 20MB',
        'error'
      );
      input.value = '';
      this.archivoSeleccionado = null;
      this.cdRef.markForCheck();
      return;
    }
    
    const extensionesPermitidas = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.zip', '.rar'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!extensionesPermitidas.includes(extension)) {
      this.mostrarAlerta(
        'Formato no permitido',
        `Formatos permitidos: ${extensionesPermitidas.join(', ')}`,
        'error'
      );
      input.value = '';
      this.archivoSeleccionado = null;
      this.cdRef.markForCheck();
      return;
    }
    
    console.log('📎 Archivo seleccionado correctamente:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    this.archivoSeleccionado = file;
    this.cdRef.markForCheck();
  }

  eliminarArchivoAdjunto(): void {
    this.rutaArchivoAdjunto = '';
    this.archivoSeleccionado = null;
    this.cdRef.markForCheck();
  }

  // =====================================================
  // 💾 GUARDAR TAREA - VERSIÓN CORREGIDA CON FORMATO MYSQL
  // =====================================================
  guardarTarea(): void {
    console.log('💾 Iniciando proceso de guardado de tarea...');
    
    const errores: string[] = [];
    
    // Validación de materia
    if (!this.formTarea.id_materia || this.formTarea.id_materia === '') {
      errores.push('Selecciona una materia');
      console.warn('❌ Materia no seleccionada');
    } else {
      console.log('✅ Materia seleccionada:', this.formTarea.id_materia);
    }
    
    // Validación de título
    if (!this.formTarea.titulo.trim()) {
      errores.push('El título es obligatorio');
      console.warn('❌ Título vacío');
    } else if (this.formTarea.titulo.length > 200) {
      errores.push('El título no puede exceder los 200 caracteres');
      console.warn('❌ Título demasiado largo');
    } else {
      console.log('✅ Título válido:', this.formTarea.titulo);
    }
    
    // Validación de fecha
    if (!this.formTarea.fecha_cierre) {
      errores.push('La fecha límite es obligatoria');
      console.warn('❌ Fecha no seleccionada');
    } else {
      try {
        const fecha = new Date(this.formTarea.fecha_cierre);
        if (isNaN(fecha.getTime())) {
          errores.push('Fecha límite inválida');
          console.warn('❌ Fecha inválida');
        } else {
          console.log('✅ Fecha válida:', this.formTarea.fecha_cierre);
        }
      } catch {
        errores.push('Fecha límite inválida');
        console.warn('❌ Error al validar fecha');
      }
    }
    
    if (errores.length > 0) {
      console.error('❌ Errores de validación:', errores);
      this.mostrarAlerta('Validación requerida', errores.join('<br>'), 'error');
      return;
    }
    
    console.log('✅ Todas las validaciones pasadas');
    this.guardandoTarea = true;
    this.cdRef.markForCheck();
    
    if (this.archivoSeleccionado) {
      console.log('📎 Intentando guardar CON archivo...');
      this.guardarTareaConArchivo();
    } else {
      console.log('📝 Guardando SIN archivo...');
      this.guardarTareaSinArchivo();
    }
  }

  // Función auxiliar para formatear fecha a MySQL
  private formatearFechaMySQL(fechaString: string): string {
    if (!fechaString) return '';
    
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) {
        throw new Error('Fecha inválida');
      }
      
      // Formatear a YYYY-MM-DD HH:MM:SS para MySQL
      const year = fecha.getFullYear();
      const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const day = fecha.getDate().toString().padStart(2, '0');
      const hours = fecha.getHours().toString().padStart(2, '0');
      const minutes = fecha.getMinutes().toString().padStart(2, '0');
      const seconds = fecha.getSeconds().toString().padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('❌ Error formateando fecha para MySQL:', error);
      return fechaString;
    }
  }

  private guardarTareaConArchivo(): void {
    console.log('💾 Iniciando guardado de tarea CON archivo...');
    
    const formData = new FormData();
    
    // Convertir la fecha al formato MySQL
    const fechaFormateada = this.formatearFechaMySQL(this.formTarea.fecha_cierre);
    console.log('📅 Fecha para MySQL:', fechaFormateada);
    
    // Convertir datos a números donde corresponda
    const tareaData = {
      id_tarea: this.editandoTarea ? Number(this.formTarea.id_tarea) : 0,
      id_materia: this.formTarea.id_materia ? Number(this.formTarea.id_materia) : null,
      titulo: this.formTarea.titulo || '',
      instrucciones: this.formTarea.instrucciones || '',
      fecha_cierre: fechaFormateada,
      permitir_entrega_tarde: this.formTarea.permitir_entrega_tarde ? 1 : 0,
      activa: this.formTarea.activa ? 1 : 0,
      rubrica: this.formTarea.rubrica || '',
      created_by: Number(this.formTarea.created_by) || 1,
      trimestre: this.formTarea.trimestre || '1'
    };
    
    console.log('📝 Datos de la tarea para FormData:', tareaData);
    
    // Agregar cada campo al FormData
    Object.entries(tareaData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Asegurar que los valores sean strings
        formData.append(key, String(value));
        console.log(`📌 Añadido al FormData: ${key}=${value} (tipo: ${typeof value})`);
      }
    });
    
    // Asegurarse de que el archivo tenga el nombre correcto
    if (this.archivoSeleccionado) {
      console.log('📎 Añadiendo archivo al FormData con nombre "archivo_adjunto"');
      formData.append('archivo_adjunto', this.archivoSeleccionado, this.archivoSeleccionado.name);
    }
    
    const endpoint = this.editandoTarea
      ? `${this.TAREAS_ENDPOINT}/actualizar`
      : `${this.TAREAS_ENDPOINT}/crear`;
    
    console.log('🌐 Endpoint:', endpoint);
    
    // Usar HttpHeaders correctamente
    const headers = this.getAuthHeadersFormData();
    
    this.http.post<ApiResponse>(endpoint, formData, { headers })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.guardandoTarea = false;
          this.cdRef.markForCheck();
          console.log('✅ Finalizado proceso de guardado con archivo');
        })
      )
      .subscribe({
        next: (res: ApiResponse) => {
          console.log('📥 Respuesta del servidor:', res);
          
          if (res?.ok) {
            this.mostrarAlerta(
              'Tarea guardada',
              this.editandoTarea 
                ? 'La tarea ha sido actualizada correctamente'
                : 'La tarea ha sido creada correctamente',
              'success'
            );
            
            this.modalTareaAbierto = false;
            this.cargarTareas();
          } else {
            this.mostrarAlerta(
              'Error', 
              res?.error || res?.message || 'Error al guardar la tarea', 
              'error'
            );
          }
          this.cdRef.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          console.error('❌ Error completo:', err);
          
          // Verificar si es un error de validación del backend
          if (err.error && err.error.errors) {
            console.error('📋 Errores de validación:', err.error.errors);
            
            // Mostrar todos los errores de validación
            const errores = [];
            if (err.error.errors.id_tarea) {
              errores.push(`ID Tarea: ${err.error.errors.id_tarea.join(', ')}`);
            }
            if (err.error.errors.id_materia) {
              errores.push(`Materia: ${err.error.errors.id_materia.join(', ')}`);
            }
            if (err.error.errors.titulo) {
              errores.push(`Título: ${err.error.errors.titulo.join(', ')}`);
            }
            if (err.error.errors.fecha_cierre) {
              errores.push(`Fecha: ${err.error.errors.fecha_cierre.join(', ')}`);
            }
            
            if (errores.length > 0) {
              this.mostrarAlerta('Error de validación', errores.join('<br>'), 'error');
            } else {
              this.mostrarAlerta('Error', err.error.message || 'Error desconocido', 'error');
            }
          } else {
            this.mostrarAlerta('Error', err.error?.error || 'Error al guardar la tarea', 'error');
          }
          
          this.cdRef.markForCheck();
        }
      });
  }

  private guardarTareaSinArchivo(): void {
    console.log('💾 Iniciando guardado de tarea sin archivo...');
    console.log('📝 Datos del formulario:', this.formTarea);
    
    // Convertir la fecha al formato MySQL
    const fechaFormateada = this.formatearFechaMySQL(this.formTarea.fecha_cierre);
    console.log('📅 Fecha para MySQL:', fechaFormateada);
    
    // Preparar el body con validación robusta
    const body: any = {
      id_tarea: this.editandoTarea ? Number(this.formTarea.id_tarea) : 0,
      id_materia: this.formTarea.id_materia ? Number(this.formTarea.id_materia) : null,
      titulo: this.formTarea.titulo || '',
      instrucciones: this.formTarea.instrucciones || '',
      fecha_cierre: fechaFormateada,
      permitir_entrega_tarde: this.formTarea.permitir_entrega_tarde ? 1 : 0,
      activa: this.formTarea.activa ? 1 : 0,
      rubrica: this.formTarea.rubrica || '',
      created_by: Number(this.formTarea.created_by) || 1,
      trimestre: this.formTarea.trimestre || '1'
    };

    // Limpiar campos undefined/null
    Object.keys(body).forEach(key => {
      if (body[key] === undefined || body[key] === null) {
        delete body[key];
      }
    });

    console.log('📦 Body final para enviar:', body);
    
    const endpoint = this.editandoTarea
      ? `${this.TAREAS_ENDPOINT}/actualizar`
      : `${this.TAREAS_ENDPOINT}/crear`;
    
    console.log('🌐 Endpoint:', endpoint);
    console.log('🔑 Headers:', this.getAuthHeaders().keys());
    
    this.http.post<ApiResponse>(endpoint, body, {
      headers: this.getAuthHeaders()
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.guardandoTarea = false;
        this.cdRef.markForCheck();
        console.log('✅ Finalizado proceso de guardado sin archivo');
      })
    )
    .subscribe({
      next: (res: ApiResponse) => {
        console.log('📥 Respuesta del servidor:', res);
        
        console.log('✅ Status:', res?.ok);
        console.log('📝 Mensaje:', res?.message);
        console.log('❌ Error:', res?.error);
        
        if (res?.ok) {
          this.mostrarAlerta(
            'Tarea guardada',
            this.editandoTarea 
              ? 'La tarea ha sido actualizada correctamente'
              : 'La tarea ha sido creada correctamente',
            'success'
          );
          
          this.modalTareaAbierto = false;
          this.cargarTareas(); // Recarga automática
        } else {
          console.error('❌ Error del servidor:', res);
          this.mostrarAlerta(
            'Error al guardar', 
            res?.error || res?.message || 'Error desconocido al guardar la tarea', 
            'error'
          );
        }
        this.cdRef.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Error HTTP completo:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          url: err.url,
          headers: err.headers
        });
        
        if (err.error) {
          console.error('📄 Detalles del error:', err.error);
        }
        
        let mensajeError = 'Error al guardar la tarea';
        
        if (err.status === 400) {
          mensajeError = 'Datos inválidos. Verifica la información ingresada.';
          console.error('📋 Error de validación:', err.error);
        } else if (err.status === 401) {
          mensajeError = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
        } else if (err.status === 500) {
          mensajeError = 'Error interno del servidor. Intenta más tarde.';
        }
        
        this.mostrarAlerta('Error', mensajeError, 'error');
        this.cdRef.markForCheck();
      }
    });
  }

  // =====================================================
  // 📈 ESTADÍSTICAS
  // =====================================================
  get estadisticasEntregas() {
    return {
      total: this.entregas.length,
      revisadas: this.entregas.filter(e => e.estado === 'REVISADO').length,
      entregadas: this.entregas.filter(e => e.estado === 'ENTREGADO').length,
      pendientes: this.entregas.filter(e => e.estado === 'PENDIENTE').length,
      porcentajeRevisadas: this.entregas.length > 0 
        ? Math.round((this.entregas.filter(e => e.estado === 'REVISADO').length / this.entregas.length) * 100)
        : 0
    };
  }

  // =====================================================
  // 🎨 UTILIDADES
  // =====================================================
  private generarColorAleatorio(): string {
    const colores = Object.values(this.COLORES_MATERIAS);
    return colores[Math.floor(Math.random() * colores.length)];
  }

  // =====================================================
  // 🚨 MANEJO DE ERRORES CRÍTICOS
  // =====================================================
  private manejarErrorCritico(error: any, contexto: string): void {
    console.error(`🚨 Error crítico en ${contexto}:`, error);
    
    this.mostrarAlerta(
      'Error del sistema',
      'Ocurrió un error inesperado. Por favor, recarga la página.',
      'error'
    );
  }

  // =====================================================
  // 🔧 MÉTODO DE DIAGNÓSTICO (para depuración)
  // =====================================================
  verificarEstado(): void {
    console.log('=== VERIFICACIÓN DE ESTADO ===');
    console.log('🔐 Tokens:', {
      authToken: localStorage.getItem('authToken'),
      token: localStorage.getItem('token'),
      userId: localStorage.getItem('userId')
    });
    console.log('📊 Estado del componente:', {
      tareasCount: this.tareas.length,
      materiasCount: this.materias.length,
      tareaSeleccionada: this.tareaSeleccionada,
      loadingTareas: this.loadingTareas,
      loadingEntregas: this.loadingEntregas,
      errorTareas: this.errorTareas
    });
    console.log('🌐 Endpoints:', {
      API_URL: this.API_URL,
      TAREAS_ENDPOINT: this.TAREAS_ENDPOINT,
      MATERIAS_ENDPOINT: this.MATERIAS_ENDPOINT
    });
    console.log('📋 Tareas actuales:', this.tareas.map(t => ({
      id: t.id_tarea,
      titulo: t.titulo,
      materia: t.id_materia,
      materia_nombre: t.nombre_materia
    })));
    console.log('📚 Materias actuales:', this.materias.map(m => ({
      id: m.id_materia,
      nombre: m.nombre
    })));
    console.log('=== FIN VERIFICACIÓN ===');
    
    // Forzar recarga si no hay tareas
    if (this.tareas.length === 0 && !this.loadingTareas) {
      console.log('🔄 Forzando recarga de tareas...');
      this.cargarTareas();
    }
  }

  // =====================================================
  // 🚀 MÉTODO PARA FORZAR CARGA (temporal)
  // =====================================================
  forzarCarga(): void {
    console.log('🚀 Forzando carga completa...');
    this.cargarTareas();
    this.cargarMaterias();
    
    if (this.tareaSeleccionada) {
      this.cargarEntregas(this.tareaSeleccionada.id_tarea);
    }
  }
}