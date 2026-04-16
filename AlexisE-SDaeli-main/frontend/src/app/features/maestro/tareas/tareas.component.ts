import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';
import { LoggingService } from '../../../services/logging.service';

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
  archivo_entregado?: string | null;
  fecha_entrega?: string | null;
  calificacion?: number | null;
  comentario_alumno?: string | null;
  comentario_docente?: string | null;
  estado: 'PENDIENTE' | 'ENTREGADO' | 'REVISADO' | 'ENTREGADO_TARDE';
  es_tardia?: number;
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

// Interface para estudiante en vista diapositiva
interface EstudianteTareas {
  estudiante_id: number;
  nombre: string;
  total_entregas?: number;
  entregas: EntregaEstudiante[];
}

interface EntregaEstudiante {
  id_entrega: number;
  id_tarea: number;
  titulo_tarea: string;
  instrucciones?: string;
  nombre_materia?: string;
  fecha_limite: string;
  fecha_entrega?: string | null;
  calificacion?: number | null;
  comentario_docente?: string | null;
  es_tardia?: number;
  materia_color?: string;
  estado?: string;
}

// Interfaz ApiResponse corregida - incluye success y estudiantes
interface ApiResponse<T = any> {
  ok: boolean;
  success?: boolean;
  data?: T;
  tareas?: Tarea[];
  materias?: Materia[];
  entregas?: Entrega[];
  estudiantes?: EstudianteTareas[];
  maestro?: string;
  error?: string;
  message?: string;
  mensaje?: string;
  id_tarea?: number;
  id_materia?: number;
  total?: number;
}

// =====================================================
// 🎨 COMPONENTE TAREAS - PROFESIONAL CON VISTA ESTUDIANTE
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
  // 🎯 VISTA POR ESTUDIANTE (DIAPOSITIVA)
  // =====================================================
  vistaActual: 'lista' | 'estudiante' = 'lista';
  
  // Datos de estudiantes
  estudiantes: EstudianteTareas[] = [];
  estudiantesFiltrados: EstudianteTareas[] = [];
  cargandoEstudiantes: boolean = false;
  
  // Estudiante actual
  estudianteActual: EstudianteTareas | null = null;
  indiceEstudianteActual: number = 0;
  
  // Filtros de estudiante
  busquedaEstudiante: string = '';
  filtroEstadoEntrega: 'todos' | 'pendientes' | 'entregadas' | 'calificadas' = 'todos';
  
  // Entregas del estudiante actual
  entregasEstudiante: EntregaEstudiante[] = [];
  entregasEstudianteFiltradas: EntregaEstudiante[] = [];

  // =====================================================
  // ⏱️ ESTADOS DE CARGA
  // =====================================================
  loadingTareas: boolean = false;
  loadingEntregas: boolean = false;
  guardandoTarea: boolean = false;
  cargandoMaterias: boolean = false;
  
  // =====================================================
  // ⚠️ MANEJO DE ERRORES
  // =====================================================
  errorTareas: string | null = null;
  errorEntregas: string | null = null;
  errorModalTarea: string | null = null;
  errorMateriaModal: string | null = null;

  // =====================================================
  // 🎯 FILTROS
  // =====================================================
  trimestreSeleccionado: 'all' | '1' | '2' | '3' = 'all';
  filtroCalificadas: boolean = false;

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
    private cdRef: ChangeDetectorRef,
    private logger: LoggingService
  ) {}

  // =====================================================
  // 🎬 LIFECYCLE HOOKS
  // =====================================================
  ngOnInit(): void {
    this.logger.log('🔵 TareasComponent inicializando...');
    this.establecerFechaMinima();
    this.inicializarAutenticacion();
    this.cargarDatosIniciales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =====================================================
  // 🔐 INICIALIZACIÓN DE AUTENTICACIÓN
  // =====================================================
  private inicializarAutenticacion(): void {
    const authToken = localStorage.getItem('authToken');
    const token = localStorage.getItem('token');
    
    this.logger.log('🔐 Tokens disponibles:', { 
      authToken: authToken ? '✓ Presente' : '✗ Ausente',
      token: token ? '✓ Presente' : '✗ Ausente'
    });
    
    if (!authToken && !token) {
      this.logger.warn('⚠️ No hay token de autenticación, creando uno SIMPLE para desarrollo...');
      this.configurarAutenticacionSimulada();
    } else {
      this.logger.log('✅ Tokens existentes encontrados');
    }
  }

  private configurarAutenticacionSimulada(): void {
    const simpleToken = 'token-desarrollo-12345';
    
    localStorage.setItem('authToken', simpleToken);
    localStorage.setItem('token', simpleToken);
    localStorage.setItem('userId', '1');
    localStorage.setItem('userRol', 'maestro');
    localStorage.setItem('userNombre', 'Maestro Demo');
    
    this.logger.log('🔐 Autenticación SIMPLE configurada para desarrollo');
  }

  // =====================================================
  // 🚀 CARGA INICIAL DE DATOS
  // =====================================================
  private cargarDatosIniciales(): void {
    this.logger.log('🚀 Iniciando carga de datos iniciales...');
    this.cargarMaterias(() => {
      this.cargarTareas();
    });
  }

  // =====================================================
  // 🔑 MANEJO DE HEADERS
  // =====================================================
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('token') || 
                  'token-desarrollo-12345';
    
    const userId = localStorage.getItem('userId') || '1';
    const userRol = localStorage.getItem('userRol') || 'maestro';

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-User-Id': userId,
      'X-User-Rol': userRol
    });
  }

  private getAuthHeadersFormData(): HttpHeaders {
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('token') || 
                  'token-desarrollo-12345';
    
    const userId = localStorage.getItem('userId') || '1';
    const userRol = localStorage.getItem('userRol') || 'maestro';

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'X-User-Id': userId,
      'X-User-Rol': userRol
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
        this.logger.error('Error ejecutando confirmación:', error);
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
      this.logger.error('Error actualizando fecha:', error);
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
      
      const year = fechaObj.getFullYear();
      const month = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
      const day = fechaObj.getDate().toString().padStart(2, '0');
      const hours = fechaObj.getHours().toString().padStart(2, '0');
      const minutes = fechaObj.getMinutes().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      this.logger.warn('Error formateando fecha para input:', error);
      return '';
    }
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
      this.logger.warn('Error formateando fecha:', error);
      return fecha || '';
    }
  }

  // =====================================================
  // 📚 CARGA DE MATERIAS
  // =====================================================
  cargarMaterias(callback?: () => void): void {
    this.logger.log('🔄 Iniciando carga de materias...');
    this.cargandoMaterias = true;
    this.cdRef.markForCheck();

    try {
      const headers = this.getAuthHeaders();
      const url = `${this.API_URL}/materias/listar`;
      
      this.logger.log('🌐 Solicitando materias desde:', url);
      
      this.http.get<ApiResponse>(url, { headers })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.cargandoMaterias = false;
            this.cdRef.markForCheck();
            this.logger.log('✅ Finalizada carga de materias');
          })
        )
        .subscribe({
          next: (res: ApiResponse) => {
            this.logger.log('📥 Respuesta de materias:', res);
            
            if (res?.ok && res.materias) {
              this.materias = res.materias;
              this.logger.log(`📚 ${this.materias.length} materias cargadas:`);
              this.materias.forEach((materia, i) => {
                this.logger.log(`   ${i+1}. ${materia.nombre} (ID: ${materia.id_materia});`);
              });
              
              if (callback) {
                callback();
              }
            } else {
              this.logger.warn('⚠️ Respuesta inesperada de materias:', res);
              this.mostrarAlerta(
                'Advertencia', 
                'No se pudieron cargar las materias. Puedes continuar creando tareas.',
                'warning'
              );
              
              if (callback) {
                callback();
              }
            }
            
            this.cdRef.markForCheck();
          },
          error: (err: HttpErrorResponse) => {
            this.logger.error('❌ Error cargando materias:', {
              status: err.status,
              statusText: err.statusText,
              error: err.error,
              url: err.url
            });
            
            let mensajeError = 'Error al cargar las materias';
            
            if (err.status === 401) {
              mensajeError = 'Acceso no autorizado. El servidor rechazó la autenticación.';
              this.logger.warn('⚠️ Error 401, pero NO limpiando tokens (modo desarrollo);');
              
              if (!localStorage.getItem('authToken')) {
                localStorage.setItem('authToken', 'token-desarrollo-12345');
                this.logger.log('🔄 Configurando token de desarrollo automáticamente');
              }
            } else if (err.status === 404) {
              mensajeError = 'Servicio de materias no disponible';
            } else if (err.status === 500) {
              mensajeError = 'Error interno del servidor';
            }
            
            this.logger.warn('⚠️', mensajeError);
            this.mostrarAlerta('Advertencia', mensajeError, 'warning');
            
            if (callback) {
              callback();
            }
            
            this.cdRef.markForCheck();
          }
        });
    } catch (error: any) {
      this.logger.error('🚨 Error crítico cargando materias:', error);
      this.cargandoMaterias = false;
      
      if (callback) {
        callback();
      }
      
      this.cdRef.markForCheck();
    }
  }

  // =====================================================
  // 📥 CARGA DE TAREAS
  // =====================================================
  cargarTareas(): void {
    this.logger.log('🔄 Iniciando carga de tareas...');
    this.loadingTareas = true;
    this.errorTareas = null;
    this.cdRef.markForCheck();

    try {
      const headers = this.getAuthHeaders();
      const url = `${this.TAREAS_ENDPOINT}/listar`;
      
      this.logger.log('🌐 Solicitando tareas desde:', url);
      
      this.http.get<ApiResponse>(url, { headers })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loadingTareas = false;
            this.cdRef.markForCheck();
            this.logger.log('✅ Finalizada carga de tareas');
          })
        )
        .subscribe({
          next: (res: ApiResponse) => {
            this.logger.log('📥 Respuesta de tareas:', res);
            
            if (res?.ok && res.tareas) {
              this.tareas = res.tareas;
              this.nombreMaestro = res.maestro || 'Maestro';
              
              this.logger.log(`📚 ${this.tareas.length} tareas cargadas:`);
              this.tareas.forEach((tarea, i) => {
                this.logger.log(`   ${i+1}. ${tarea.titulo} (ID: ${tarea.id_tarea}); - Materia ID: ${tarea.id_materia} - Revisadas: ${tarea.entregas_revisadas || 0}/${tarea.total_entregas || 0}`);
              });
              
              if (this.tareas.length > 0 && !this.tareaSeleccionada) {
                this.logger.log('🎯 Seleccionando primera tarea automáticamente');
                this.seleccionarTarea(this.tareas[0]);
              }
            } else {
              this.logger.warn('⚠️ Respuesta inesperada de tareas:', res);
              this.errorTareas = res?.error || 'No se encontraron tareas disponibles';
              
              if (res?.ok === false) {
                this.mostrarAlerta('Información', 'No hay tareas registradas en el sistema', 'info');
              }
            }
            
            this.cdRef.markForCheck();
          },
          error: (err: HttpErrorResponse) => {
            this.logger.error('❌ Error cargando tareas:', {
              status: err.status,
              statusText: err.statusText,
              error: err.error,
              url: err.url
            });
            
            let mensajeError = 'Error al cargar las tareas';
            
            if (err.status === 0) {
              mensajeError = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
              this.logger.error('🔌 Error de conexión - ¿Servidor ejecutándose?');
            } else if (err.status === 401) {
              mensajeError = err.error?.error || 'Acceso no autorizado al sistema de tareas.';
              this.logger.error('🔐 Error 401 - Token inválido o expirado');
              if (!localStorage.getItem('authToken')) {
                localStorage.setItem('authToken', 'token-desarrollo-12345');
                this.logger.log('🔄 Configurando token de desarrollo para tareas');
              }
            } else if (err.status === 403) {
              mensajeError = err.error?.error || 'No tienes permiso para ver estas tareas.';
              this.logger.error('🚫 Error 403 - Acceso denegado');
            } else if (err.status === 404) {
              mensajeError = err.error?.error || 'El servicio de tareas no está disponible.';
              this.logger.error('🔍 Error 404 - Endpoint no encontrado');
            } else if (err.status === 500) {
              mensajeError = err.error?.error || 'Error interno del servidor. Intenta más tarde.';
              this.logger.error('💥 Error 500 - Error del servidor');
            }
            
            this.errorTareas = mensajeError;
            this.mostrarAlerta('Error de carga', mensajeError, 'error');
            this.cdRef.markForCheck();
          }
        });
    } catch (error: any) {
      this.logger.error('🚨 Excepción en cargarTareas:', error);
      this.loadingTareas = false;
      this.errorTareas = 'Error inesperado al cargar tareas';
      this.cdRef.markForCheck();
    }
  }

  // =====================================================
  // 🎯 FUNCIONES PRINCIPALES
  // =====================================================
  seleccionarTarea(tarea: Tarea): void {
    this.logger.log('🎯 Seleccionando tarea:', tarea.titulo, `(ID: ${tarea.id_tarea});`);
    this.tareaSeleccionada = tarea;
    this.cargarEntregas(tarea.id_tarea);
    this.cdRef.markForCheck();
  }

  cargarEntregas(idTarea: number): void {
    this.logger.log('🔄 Cargando entregas para tarea ID:', idTarea);
    this.loadingEntregas = true;
    this.errorEntregas = null;
    this.cdRef.markForCheck();

    try {
      const headers = this.getAuthHeaders();
      const url = `${this.TAREAS_ENDPOINT}/entregas`;
      
      this.logger.log('🌐 Solicitando entregas desde:', url, 'para tarea:', idTarea);
      
      this.http.get<ApiResponse>(url, {
        params: { id_tarea: idTarea.toString() },
        headers
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingEntregas = false;
          this.cdRef.markForCheck();
          this.logger.log('✅ Finalizada carga de entregas');
        })
      )
      .subscribe({
        next: (res: ApiResponse) => {
          this.logger.log('📥 Respuesta de entregas:', res);
          
          if (res?.ok && res.entregas) {
            this.entregas = res.entregas;
            this.logger.log(`📄 ${this.entregas.length} entregas cargadas`);
          } else {
            this.logger.warn('⚠️ No se encontraron entregas:', res?.error || 'Error desconocido');
            this.entregas = [];
          }
          
          this.cdRef.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          this.logger.error('❌ Error cargando entregas:', err);
          this.errorEntregas = `Error al cargar entregas: ${err.status}`;
          this.entregas = [];
          this.cdRef.markForCheck();
        }
      });
    } catch (error: any) {
      this.logger.error('🚨 Error crítico cargando entregas:', error);
      this.loadingEntregas = false;
      this.errorEntregas = 'Error inesperado';
      this.entregas = [];
      this.cdRef.markForCheck();
    }
  }

  // =====================================================
  // 🔍 FILTRADO DE TAREAS
  // =====================================================
  get tareasFiltradas(): Tarea[] {
    let tareasFiltradas = this.tareas;
    
    if (this.trimestreSeleccionado !== 'all') {
      tareasFiltradas = tareasFiltradas.filter(tarea => 
        tarea.trimestre.toString() === this.trimestreSeleccionado
      );
    }
    
    if (this.filtroCalificadas) {
      tareasFiltradas = tareasFiltradas.filter(tarea => 
        (tarea.entregas_revisadas || 0) > 0
      );
    }
    
    return tareasFiltradas;
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

  toggleFiltroCalificadas(): void {
    this.filtroCalificadas = !this.filtroCalificadas;
    this.cdRef.markForCheck();
    
    this.mostrarAlerta(
      'Filtro aplicado',
      this.filtroCalificadas ? 'Mostrando solo tareas con calificaciones' : 'Mostrando todas las tareas',
      'info'
    );
  }

  // =====================================================
  // 🎯 VISTA POR ESTUDIANTE (DIAPOSITIVA) - CORREGIDA
  // =====================================================

  cambiarVista(vista: 'lista' | 'estudiante'): void {
    this.vistaActual = vista;
    
    if (vista === 'estudiante') {
      this.cargarEstudiantesConEntregas();
    }
    
    this.cdRef.markForCheck();
  }

  cargarEstudiantesConEntregas(): void {
    this.logger.log('🔄 Cargando estudiantes con entregas...');
    this.cargandoEstudiantes = true;
    this.cdRef.markForCheck();
    
    try {
      const headers = this.getAuthHeaders();
      const url = `${this.API_URL}/maestro/tareas/estudiantes-con-entregas`;
      
      this.logger.log('🌐 URL:', url);
      
      this.http.get<ApiResponse>(url, { headers })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: ApiResponse) => {
            this.logger.log('📥 Respuesta completa del servidor:', res);
            
            if (res?.estudiantes && Array.isArray(res.estudiantes) && res.estudiantes.length > 0) {
              this.estudiantes = res.estudiantes;
              this.logger.log(`✅ ${this.estudiantes.length} estudiantes encontrados:`);
              this.estudiantes.forEach((est, i) => {
                this.logger.log(`   ${i+1}. ${est.nombre} (ID: ${est.estudiante_id}); - ${est.total_entregas || est.entregas?.length || 0} entregas`);
              });
              
              this.filtrarEstudiantes();
              
              if (this.estudiantesFiltrados.length > 0) {
                this.indiceEstudianteActual = 0;
                this.seleccionarEstudiante(this.estudiantesFiltrados[0]);
              } else {
                this.logger.warn('⚠️ No hay estudiantes después de filtrar');
                this.estudianteActual = null;
                this.entregasEstudiante = [];
                this.entregasEstudianteFiltradas = [];
              }
            } else {
              this.logger.warn('⚠️ No se encontraron estudiantes en la respuesta:', res);
              this.estudiantes = [];
              this.estudiantesFiltrados = [];
              this.estudianteActual = null;
              this.entregasEstudiante = [];
              this.entregasEstudianteFiltradas = [];
              
              if (res?.message) {
                this.mostrarAlerta('Información', res.message, 'info');
              } else {
                this.mostrarAlerta('Información', 'No hay estudiantes con entregas', 'info');
              }
            }
            
            this.cargandoEstudiantes = false;
            this.cdRef.markForCheck();
          },
          error: (err: HttpErrorResponse) => {
            this.logger.error('❌ Error cargando estudiantes:', err);
            this.cargandoEstudiantes = false;
            this.mostrarAlerta('Error', 'No se pudieron cargar los estudiantes', 'error');
            this.cdRef.markForCheck();
          }
        });
    } catch (error) {
      this.logger.error('🚨 Error:', error);
      this.cargandoEstudiantes = false;
      this.cdRef.markForCheck();
    }
  }

  filtrarEstudiantes(): void {
    if (!this.busquedaEstudiante.trim()) {
      this.estudiantesFiltrados = [...this.estudiantes];
    } else {
      const busqueda = this.busquedaEstudiante.toLowerCase();
      this.estudiantesFiltrados = this.estudiantes.filter(est => 
        est.nombre?.toLowerCase().includes(busqueda) ||
        est.estudiante_id?.toString().includes(busqueda)
      );
    }
    
    if (this.indiceEstudianteActual >= this.estudiantesFiltrados.length) {
      this.indiceEstudianteActual = Math.max(0, this.estudiantesFiltrados.length - 1);
    }
    
    if (this.estudiantesFiltrados.length > 0) {
      this.seleccionarEstudiante(this.estudiantesFiltrados[this.indiceEstudianteActual]);
    } else {
      this.estudianteActual = null;
      this.entregasEstudiante = [];
      this.entregasEstudianteFiltradas = [];
    }
    
    this.cdRef.markForCheck();
  }

  setFiltroEstado(filtro: 'todos' | 'pendientes' | 'entregadas' | 'calificadas'): void {
    this.filtroEstadoEntrega = filtro;
    this.aplicarFiltroEntregas();
  }

  aplicarFiltroEntregas(): void {
    if (!this.entregasEstudiante) {
      this.entregasEstudianteFiltradas = [];
      return;
    }
    
    switch (this.filtroEstadoEntrega) {
      case 'pendientes':
        this.entregasEstudianteFiltradas = this.entregasEstudiante.filter(e => !e.fecha_entrega);
        break;
      case 'entregadas':
        this.entregasEstudianteFiltradas = this.entregasEstudiante.filter(e => e.fecha_entrega && e.calificacion === null);
        break;
      case 'calificadas':
        this.entregasEstudianteFiltradas = this.entregasEstudiante.filter(e => e.calificacion !== null);
        break;
      default:
        this.entregasEstudianteFiltradas = [...this.entregasEstudiante];
    }
    
    this.logger.log(`📋 Filtro aplicado: ${this.filtroEstadoEntrega} - ${this.entregasEstudianteFiltradas.length} entregas`);
    this.cdRef.markForCheck();
  }

  seleccionarEstudiante(estudiante: EstudianteTareas): void {
    this.logger.log('🎯 Seleccionando estudiante:', estudiante);
    this.estudianteActual = estudiante;
    this.entregasEstudiante = estudiante.entregas || [];
    this.logger.log(`📋 ${this.entregasEstudiante.length} entregas para ${estudiante.nombre}`);
    this.aplicarFiltroEntregas();
    this.cdRef.markForCheck();
  }

  estudianteAnterior(): void {
    if (this.indiceEstudianteActual > 0) {
      this.indiceEstudianteActual--;
      this.seleccionarEstudiante(this.estudiantesFiltrados[this.indiceEstudianteActual]);
    } else {
      this.mostrarAlerta('Navegación', 'Este es el primer estudiante', 'info');
    }
  }

  estudianteSiguiente(): void {
    if (this.indiceEstudianteActual < this.estudiantesFiltrados.length - 1) {
      this.indiceEstudianteActual++;
      this.seleccionarEstudiante(this.estudiantesFiltrados[this.indiceEstudianteActual]);
    } else {
      this.mostrarAlerta('Navegación', 'Este es el último estudiante', 'info');
    }
  }

  irAEstudiante(indice: number): void {
    if (indice >= 0 && indice < this.estudiantesFiltrados.length) {
      this.indiceEstudianteActual = indice;
      this.seleccionarEstudiante(this.estudiantesFiltrados[indice]);
    }
  }

  // =====================================================
  // 📊 PROPIEDADES COMPUTADAS PARA ESTUDIANTE
  // =====================================================

  get totalTareasEstudiante(): number {
    return this.entregasEstudiante?.length || 0;
  }

  get promedioEstudiante(): number {
    const calificaciones = this.entregasEstudiante?.filter(e => e.calificacion !== null).map(e => e.calificacion as number) || [];
    if (calificaciones.length === 0) return 0;
    return calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length;
  }

  get entregadasEstudiante(): number {
    return this.entregasEstudiante?.filter(e => e.fecha_entrega).length || 0;
  }

  get pendientesEstudiante(): number {
    return this.entregasEstudiante?.filter(e => !e.fecha_entrega).length || 0;
  }

  // =====================================================
  // 🎨 UTILIDADES PARA VISTA ESTUDIANTE
  // =====================================================

  obtenerIniciales(nombre: string): string {
    if (!nombre) return '?';
    const partes = nombre.split(' ');
    if (partes.length >= 2) {
      return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
    }
    return nombre.charAt(0).toUpperCase();
  }

  formatoNumero(valor: number): string {
    return valor.toFixed(2);
  }

  getEstadoTexto(entrega: EntregaEstudiante): string {
    if (!entrega.fecha_entrega) return 'Pendiente';
    if (entrega.calificacion !== null) return 'Calificada';
    return 'Entregada';
  }

  abrirModalCalificarDesdeEstudiante(entrega: EntregaEstudiante): void {
    if (!entrega.fecha_entrega) {
      this.mostrarAlerta('No disponible', 'Esta tarea no ha sido entregada', 'warning');
      return;
    }
    
    this.entregaEditando = {
      id_entrega: entrega.id_entrega,
      id_tarea: entrega.id_tarea,
      estudiante_id: this.estudianteActual?.estudiante_id || 0,
      nombre_alumno: this.estudianteActual?.nombre || '',
      estado: entrega.calificacion ? 'REVISADO' : 'ENTREGADO',
      calificacion: entrega.calificacion,
      comentario_docente: entrega.comentario_docente,
      archivo_entregado: null,
      fecha_entrega: entrega.fecha_entrega,
      comentario_alumno: null,
      es_tardia: entrega.es_tardia
    };
    
    this.notaTemp = entrega.calificacion?.toString() || '';
    this.comentarioTemp = entrega.comentario_docente || '';
    this.modalCalificarAbierto = true;
    this.cdRef.markForCheck();
  }

  // =====================================================
  // 🛠️ UTILIDADES GENERALES
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
    if (e === 'ENTREGADO' || e === 'ENTREGADO_TARDE') return 'estado-chip entregado';
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

  getNombreArchivo(ruta: string | null | undefined): string {
    if (!ruta) return 'Archivo no disponible';
    return ruta.split('/').pop() || 'Archivo sin nombre';
  }

  fileUrl(ruta: string | null | undefined): string | null {
    if (!ruta || ruta === 'null' || ruta === 'undefined') return null;
    
    const cleanPath = ruta.startsWith('/') ? ruta.substring(1) : ruta;
    return `${this.ARCHIVOS_BASE}/${cleanPath}`;
  }

  verificarArchivo(entrega: Entrega): void {
    if (!entrega.archivo_entregado) {
      this.mostrarAlerta('Sin archivo', 'Esta entrega no tiene archivo adjunto', 'warning');
      return;
    }
    
    const url = this.fileUrl(entrega.archivo_entregado);
    const nombreArchivo = entrega.archivo_entregado.split('/').pop();
    
    this.mostrarAlerta(
      'Información del archivo',
      `📁 Nombre: ${nombreArchivo}<br>🔗 URL: ${url}<br>📍 Ruta en servidor: ${entrega.archivo_entregado}`,
      'info'
    );
  }

  // =====================================================
  // 🪟 MODALES DE TAREAS
  // =====================================================
  abrirModalNuevaTarea(): void {
    this.logger.log('➕ Abriendo modal para nueva tarea');
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
    this.logger.log('🔄 Intentando abrir modal para editar tarea...');
    
    if (!this.tareaSeleccionada) {
      this.logger.error('❌ No hay tarea seleccionada');
      this.mostrarAlerta('Selección requerida', 'Selecciona una tarea primero para editarla', 'info');
      return;
    }
    
    this.logger.log('✅ Tarea seleccionada:', this.tareaSeleccionada);
    
    this.editandoTarea = true;
    
    const idMateria = this.tareaSeleccionada.id_materia;
    this.logger.log('📚 ID Materia de la tarea:', idMateria);
    
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
    
    this.logger.log('📝 Formulario preparado:', this.formTarea);
    
    this.rutaArchivoAdjunto = this.tareaSeleccionada.archivo_adjunto || '';
    this.fechaTemporal = this.formatearFechaParaInput(this.formTarea.fecha_cierre);
    this.archivoSeleccionado = null;
    this.modalTareaAbierto = true;
    this.errorModalTarea = null;
    
    this.logger.log('✅ Modal de edición listo');
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
          this.logger.log('✅ Respuesta al eliminar tarea:', res);
          
          if (res?.ok) {
            this.mostrarAlerta(
              'Tarea eliminada',
              'La tarea ha sido eliminada correctamente',
              'success'
            );
            
            this.tareaSeleccionada = null;
            this.entregas = [];
            this.cargarTareas();
          } else {
            this.mostrarAlerta(
              'Error al eliminar',
              res?.error || 'No se pudo eliminar la tarea',
              'error'
            );
          }
          this.cdRef.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          this.logger.error('❌ Error eliminando tarea:', err);
          
          let mensaje = 'Error al eliminar la tarea';
          
          if (err.error?.error) {
            mensaje = err.error.error;
          } else if (err.status === 401) {
            mensaje = 'Acceso no autorizado para eliminar esta tarea';
          } else if (err.status === 403) {
            mensaje = 'No tienes permiso para eliminar esta tarea';
          } else if (err.status === 404) {
            mensaje = 'La tarea no existe o ya fue eliminada';
          }
          
          this.mostrarAlerta('Error', mensaje, 'error');
          this.cdRef.markForCheck();
        }
      });
    } catch (error: any) {
      this.logger.error('🚨 Error crítico eliminando tarea:', error);
      this.mostrarAlerta('Error', 'Error inesperado al eliminar la tarea', 'error');
    }
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

    const materiaData: any = {
      nombre: this.materiaForm.nombre.trim(),
      descripcion: this.materiaForm.descripcion || '',
      color: this.materiaForm.color || this.generarColorAleatorio(),
      icono: this.materiaForm.icono || '📚',
      created_by: 1
    };

    if (this.editandoMateria && this.materiaForm.id_materia) {
      materiaData.id_materia = this.materiaForm.id_materia;
    }

    this.logger.log('💾 Guardando materia:', materiaData);

    try {
      const headers = this.getAuthHeaders();
      
      const endpoint = this.editandoMateria 
        ? `${this.API_URL}/materias/actualizar`
        : `${this.API_URL}/materias/crear`;
      
      this.logger.log('🌐 Endpoint:', endpoint);
      
      this.http.post<ApiResponse>(endpoint, materiaData, { headers })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: ApiResponse) => {
            this.logger.log('✅ Respuesta al guardar materia:', res);
            
            if (res?.ok) {
              this.mostrarAlerta(
                this.editandoMateria ? 'Materia actualizada' : 'Materia creada',
                this.editandoMateria 
                  ? 'La materia ha sido actualizada correctamente'
                  : 'La materia ha sido creada correctamente',
                'success'
              );
              
              this.cargarMaterias();
              this.cargarTareas();
              this.cerrarModalMaterias();
            } else {
              this.errorMateriaModal = res?.error || 'Error al guardar la materia';
              this.cdRef.markForCheck();
            }
          },
          error: (err: HttpErrorResponse) => {
            this.logger.error('❌ Error guardando materia:', err);
            
            let mensajeError = 'Error de conexión';
            
            if (err.error?.error) {
              mensajeError = err.error.error;
            } else if (err.status === 401) {
              mensajeError = 'Acceso no autorizado para modificar materias';
            } else if (err.status === 400) {
              mensajeError = 'Datos inválidos';
            } else if (err.status === 404) {
              mensajeError = 'Servicio no disponible';
            }
            
            this.errorMateriaModal = mensajeError;
            this.cdRef.markForCheck();
          }
        });
    } catch (error: any) {
      this.logger.error('🚨 Error crítico guardando materia:', error);
      this.errorMateriaModal = 'Error inesperado';
      this.cdRef.markForCheck();
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
      
      this.http.post<ApiResponse>(`${this.API_URL}/materias/eliminar`, {
        id_materia: materia.id_materia
      }, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: ApiResponse) => {
          this.logger.log('✅ Respuesta al eliminar materia:', res);
          
          if (res?.ok) {
            this.mostrarAlerta(
              'Materia eliminada',
              'La materia ha sido eliminada correctamente',
              'success'
            );
            
            this.cargarMaterias();
            this.cargarTareas();
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
          this.logger.error('❌ Error eliminando materia:', err);
          
          let mensaje = 'Error al eliminar la materia';
          
          if (err.error?.error) {
            mensaje = err.error.error;
          } else if (err.status === 401) {
            mensaje = 'Acceso no autorizado para eliminar materias';
          }
          
          this.mostrarAlerta('Error', mensaje, 'error');
          this.cdRef.markForCheck();
        }
      });
    } catch (error: any) {
      this.logger.error('🚨 Error crítico eliminando materia:', error);
      this.mostrarAlerta('Error', 'Error inesperado al eliminar la materia', 'error');
    }
  }

  // =====================================================
  // 📊 CALIFICACIÓN DE ENTREGAS
  // =====================================================
  abrirModalCalificar(entrega: Entrega): void {
    this.logger.log('✍️ Abriendo modal para calificar entrega:', entrega);
    
    this.entregaEditando = entrega;
    this.notaTemp = entrega.calificacion?.toString() || '';
    this.comentarioTemp = entrega.comentario_docente || '';
    this.modalCalificarAbierto = true;
    
    this.logger.log('📝 Datos inicializados:', {
      notaTemp: this.notaTemp,
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
      this.logger.error('❌ No hay entrega seleccionada para calificar');
      this.mostrarAlerta('Error', 'No hay entrega seleccionada', 'error');
      return;
    }
    
    this.logger.log('💾 Guardando calificación para entrega ID:', this.entregaEditando.id_entrega);
    
    let calificacion: number | null = null;
    const notaString = this.notaTemp?.toString()?.trim() || '';
    
    if (notaString) {
      const nota = parseFloat(notaString);
      
      if (isNaN(nota)) {
        this.mostrarAlerta('Error', 'La calificación debe ser un número válido', 'error');
        return;
      }
      
      if (nota < 0 || nota > 10) {
        this.mostrarAlerta('Error', 'La calificación debe estar entre 0 y 10', 'error');
        return;
      }
      
      calificacion = Math.round(nota * 10) / 10;
      this.logger.log('✅ Calificación final:', calificacion);
    }
    
    const body = {
      id_entrega: this.entregaEditando.id_entrega,
      calificacion: calificacion,
      comentario_docente: this.comentarioTemp?.trim() || null
    };
    
    this.logger.log('📦 Body para enviar:', body);
    
    try {
      const headers = this.getAuthHeaders();
      const url = `${this.TAREAS_ENDPOINT}/calificar`;
      
      this.logger.log('🌐 Enviando calificación a:', url);
      
      this.http.post<ApiResponse>(url, body, { headers })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: ApiResponse) => {
            this.logger.log('📥 Respuesta del servidor:', res);
            
            if (res?.ok) {
              this.mostrarAlerta(
                'Calificación guardada',
                'La calificación ha sido actualizada correctamente',
                'success'
              );
              
              if (this.tareaSeleccionada) {
                this.cargarEntregas(this.tareaSeleccionada.id_tarea);
              }
              
              this.cargarTareas();
              this.cerrarModalCalificar();
            } else {
              this.mostrarAlerta(
                'Error', 
                res?.error || 'Error al guardar calificación', 
                'error'
              );
            }
            this.cdRef.markForCheck();
          },
          error: (err: HttpErrorResponse) => {
            this.logger.error('❌ Error HTTP completo:', {
              status: err.status,
              statusText: err.statusText,
              error: err.error,
              url: err.url
            });
            
            let mensaje = 'Error al guardar la calificación';
            
            if (err.error?.error) {
              mensaje = err.error.error;
            } else if (err.status === 400) {
              mensaje = 'Datos inválidos';
            } else if (err.status === 401) {
              mensaje = 'Acceso no autorizado para calificar';
            } else if (err.status === 500) {
              mensaje = 'Error interno del servidor';
            }
            
            this.mostrarAlerta('Error', mensaje, 'error');
            this.cdRef.markForCheck();
          }
        });
    } catch (error: any) {
      this.logger.error('🚨 Error crítico:', error);
      this.mostrarAlerta('Error', 'Error inesperado al guardar calificación', 'error');
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
    
    this.logger.log('📎 Archivo seleccionado:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    this.archivoSeleccionado = file;
    this.cdRef.markForCheck();
  }

  eliminarArchivoAdjunto(): void {
    this.rutaArchivoAdjunto = '';
    this.archivoSeleccionado = null;
    this.cdRef.markForCheck();
  }

  // =====================================================
  // 💾 GUARDAR TAREA
  // =====================================================
  guardarTarea(): void {
    this.logger.log('💾 Iniciando proceso de guardado de tarea...');
    
    const errores: string[] = [];
    
    if (!this.formTarea.id_materia || this.formTarea.id_materia === '') {
      errores.push('Selecciona una materia');
    }
    
    if (!this.formTarea.titulo.trim()) {
      errores.push('El título es obligatorio');
    } else if (this.formTarea.titulo.length > 200) {
      errores.push('El título no puede exceder los 200 caracteres');
    }
    
    if (!this.formTarea.fecha_cierre) {
      errores.push('La fecha límite es obligatoria');
    } else {
      try {
        const fecha = new Date(this.formTarea.fecha_cierre);
        if (isNaN(fecha.getTime())) {
          errores.push('Fecha límite inválida');
        }
      } catch {
        errores.push('Fecha límite inválida');
      }
    }
    
    if (errores.length > 0) {
      this.logger.error('❌ Errores de validación:', errores);
      this.mostrarAlerta('Validación requerida', errores.join('<br>'), 'error');
      return;
    }
    
    this.logger.log('✅ Todas las validaciones pasadas');
    this.guardandoTarea = true;
    this.cdRef.markForCheck();
    
    if (this.archivoSeleccionado) {
      this.guardarTareaConArchivo();
    } else {
      this.guardarTareaSinArchivo();
    }
  }

  private formatearFechaMySQL(fechaString: string): string {
    if (!fechaString) return '';
    
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) {
        throw new Error('Fecha inválida');
      }
      
      const year = fecha.getFullYear();
      const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const day = fecha.getDate().toString().padStart(2, '0');
      const hours = fecha.getHours().toString().padStart(2, '0');
      const minutes = fecha.getMinutes().toString().padStart(2, '0');
      const seconds = fecha.getSeconds().toString().padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      this.logger.error('❌ Error formateando fecha para MySQL:', error);
      return fechaString;
    }
  }

  private guardarTareaConArchivo(): void {
    this.logger.log('💾 Guardando tarea CON archivo...');
    
    const formData = new FormData();
    const fechaFormateada = this.formatearFechaMySQL(this.formTarea.fecha_cierre);
    
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
    
    Object.entries(tareaData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });
    
    if (this.archivoSeleccionado) {
      formData.append('archivo_adjunto', this.archivoSeleccionado, this.archivoSeleccionado.name);
    }
    
    const endpoint = this.editandoTarea
      ? `${this.TAREAS_ENDPOINT}/actualizar`
      : `${this.TAREAS_ENDPOINT}/crear`;
    
    const headers = this.getAuthHeadersFormData();
    
    this.http.post<ApiResponse>(endpoint, formData, { headers })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.guardandoTarea = false;
          this.cdRef.markForCheck();
        })
      )
      .subscribe({
        next: (res: ApiResponse) => {
          this.logger.log('📥 Respuesta del servidor:', res);
          
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
              res?.error || 'Error al guardar la tarea', 
              'error'
            );
          }
          this.cdRef.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          this.logger.error('❌ Error completo:', err);
          
          let mensajeError = 'Error al guardar la tarea';
          
          if (err.error?.error) {
            mensajeError = err.error.error;
          } else if (err.error && err.error.errors) {
            const errores = [];
            if (err.error.errors.id_tarea) errores.push(`ID Tarea: ${err.error.errors.id_tarea.join(', ')}`);
            if (err.error.errors.id_materia) errores.push(`Materia: ${err.error.errors.id_materia.join(', ')}`);
            if (err.error.errors.titulo) errores.push(`Título: ${err.error.errors.titulo.join(', ')}`);
            if (err.error.errors.fecha_cierre) errores.push(`Fecha: ${err.error.errors.fecha_cierre.join(', ')}`);
            
            if (errores.length > 0) {
              mensajeError = errores.join('<br>');
            }
          }
          
          this.mostrarAlerta('Error', mensajeError, 'error');
          this.cdRef.markForCheck();
        }
      });
  }

  private guardarTareaSinArchivo(): void {
    this.logger.log('💾 Guardando tarea sin archivo...');
    
    const fechaFormateada = this.formatearFechaMySQL(this.formTarea.fecha_cierre);
    
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

    Object.keys(body).forEach(key => {
      if (body[key] === undefined || body[key] === null) {
        delete body[key];
      }
    });

    const endpoint = this.editandoTarea
      ? `${this.TAREAS_ENDPOINT}/actualizar`
      : `${this.TAREAS_ENDPOINT}/crear`;
    
    this.http.post<ApiResponse>(endpoint, body, {
      headers: this.getAuthHeaders()
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.guardandoTarea = false;
        this.cdRef.markForCheck();
      })
    )
    .subscribe({
      next: (res: ApiResponse) => {
        this.logger.log('📥 Respuesta del servidor:', res);
        
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
            'Error al guardar', 
            res?.error || 'Error desconocido al guardar la tarea', 
            'error'
          );
        }
        this.cdRef.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.logger.error('❌ Error HTTP completo:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          url: err.url
        });
        
        let mensajeError = 'Error al guardar la tarea';
        
        if (err.error?.error) {
          mensajeError = err.error.error;
        } else if (err.status === 400) {
          mensajeError = 'Datos inválidos. Verifica la información ingresada.';
        } else if (err.status === 401) {
          mensajeError = 'Acceso no autorizado para guardar tareas';
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
      entregadas: this.entregas.filter(e => e.estado === 'ENTREGADO' || e.estado === 'ENTREGADO_TARDE').length,
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
  // 🔧 DIAGNÓSTICO Y DEBUG - CORREGIDO
  // =====================================================
  verificarEstado(): void {
    this.logger.log('=== VERIFICACIÓN DE ESTADO ===');
    this.logger.log('🔐 Tokens:', {
      authToken: localStorage.getItem('authToken'),  // ✅ CORREGIDO: coma, no punto y coma
      token: localStorage.getItem('token'),
      userId: localStorage.getItem('userId'),
      userRol: localStorage.getItem('userRol')
    });
    this.logger.log('📊 Estado del componente:', {
      tareasCount: this.tareas.length,
      materiasCount: this.materias.length,
      tareaSeleccionada: this.tareaSeleccionada?.titulo || 'Ninguna',
      loadingTareas: this.loadingTareas,
      loadingEntregas: this.loadingEntregas,
      cargandoMaterias: this.cargandoMaterias,
      filtroCalificadas: this.filtroCalificadas,
      vistaActual: this.vistaActual,
      estudiantesCount: this.estudiantes.length
    });
    this.logger.log('=== FIN VERIFICACIÓN ===');
    
    if (this.tareas.length === 0 && !this.loadingTareas) {
      this.logger.log('🔄 Forzando recarga de tareas...');
      this.cargarTareas();
    }
  }

  forzarCarga(): void {
    this.logger.log('🚀 Forzando carga completa...');
    this.cargarMaterias(() => {
      this.cargarTareas();
    });
  }

  probarConexionBackend(): void {
    this.logger.log('🔧 Probando conexión con backend...');
    
    this.http.get(`${this.API_URL}/test`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.logger.log('✅ Backend conectado:', res);
          this.mostrarAlerta(
            'Conexión Exitosa',
            '✅ El servidor backend está funcionando correctamente',
            'success'
          );
        },
        error: (err) => {
          this.logger.error('❌ Backend no disponible:', err);
          this.mostrarAlerta(
            'Error de Conexión',
            '❌ No se pudo conectar con el servidor backend',
            'error'
          );
        }
      });
  }

  probarEndpoints(): void {
    this.logger.log('🔍 Probando todos los endpoints...');
    
    const endpoints = [
      { nombre: 'Tareas Health', url: `${this.TAREAS_ENDPOINT}/health` },
      { nombre: 'Materias Health', url: `${this.API_URL}/materias/health` },
      { nombre: 'Test General', url: `${this.API_URL}/test` }
    ];
    
    endpoints.forEach(endpoint => {
      this.logger.log(`🔗 Probando ${endpoint.nombre}: ${endpoint.url}`);
      
      this.http.get(endpoint.url, { headers: this.getAuthHeaders() })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            this.logger.log(`✅ ${endpoint.nombre}:`, res);
          },
          error: (err) => {
            this.logger.error(`❌ ${endpoint.nombre}:`, err.status, err.statusText);
          }
        });
    });
  }

  establecerTokensManualmente(): void {
    this.logger.log('🛠️ Estableciendo tokens manualmente...');
    
    const tokenSimple = 'token-desarrollo-12345';
    
    localStorage.setItem('authToken', tokenSimple);
    localStorage.setItem('token', tokenSimple);
    localStorage.setItem('userId', '1');
    localStorage.setItem('userRol', 'maestro');
    localStorage.setItem('userNombre', 'Maestro Demo');
    
    this.logger.log('✅ Tokens establecidos:', {
      authToken: tokenSimple,
      userId: '1',
      userRol: 'maestro'
    });
    
    this.mostrarAlerta('Tokens configurados', 'Tokens de desarrollo establecidos correctamente', 'success');
    
    this.cargarDatosIniciales();
  }

  verificarYLimpiarTokens(): void {
    this.logger.log('🔍 Verificando tokens...');
    
    const authToken = localStorage.getItem('authToken');
    const token = localStorage.getItem('token');
    
    if (!authToken && !token) {
      this.logger.log('⚠️ No hay tokens, configurando automáticamente...');
      this.establecerTokensManualmente();
    } else {
      this.logger.log('✅ Tokens presentes:', { authToken, token });
      this.mostrarAlerta('Tokens OK', 'Los tokens están presentes en el sistema', 'info');
    }
  }
}