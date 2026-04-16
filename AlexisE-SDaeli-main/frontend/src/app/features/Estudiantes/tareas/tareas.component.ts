import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { takeUntil, finalize, catchError, switchMap } from 'rxjs/operators';
import { LoggingService } from '../../../services/logging.service';

// =====================================================
// 🎯 INTERFACES TIPADAS PARA ESTUDIANTES
// =====================================================
interface Materia {
  id_materia: number;
  nombre: string;
  descripcion?: string;
  color: string;
  icono: string;
  created_at?: string;
}

interface EntregaEstudiante {
  id_entrega: number;
  id_tarea: number;
  estudiante_id: number;
  archivo_entrega?: string | null;
  fecha_entrega?: string | null;
  calificacion?: number | null;
  comentario_alumno?: string | null;
  comentario_docente?: string | null;
  estado: 'PENDIENTE' | 'ENTREGADO' | 'REVISADO' | 'ENTREGADO_TARDE';
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  
  titulo?: string;
  nombre_materia?: string;
  color_materia?: string;
  entregada_tarde?: number | boolean;
  dias_retraso?: number;
}

interface TareaEstudiante {
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
  id_entrega?: number;
  estado_entrega?: string;
  calificacion?: number | null;
  fecha_entrega?: string | null;
  estado_alumno?: 'PENDIENTE' | 'ENTREGADA' | 'VENCIDA' | 'CALIFICADA';
  dias_restantes?: number;
  fecha_creacion?: string;
  color_materia?: string;
  icono_materia?: string;
}

interface Calificacion {
  id_entrega: number;
  id_tarea: number;
  titulo: string;
  nombre_materia: string;
  color_materia: string;
  calificacion: number;
  comentario_docente?: string;
  fecha_entrega: string;
  nivel_desempeno: string;
}

interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  tareas?: TareaEstudiante[];
  materias?: Materia[];
  entregas?: EntregaEstudiante[];
  calificaciones?: Calificacion[];
  estudiante?: string;
  estadisticas?: any;
  error?: string;
  message?: string;
  mensaje?: string;
  id_tarea?: number;
  id_entrega?: number;
}

// =====================================================
// 🎨 COMPONENTE TAREAS - ESTUDIANTE
// =====================================================
@Component({
  selector: 'app-tareas-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TareasEstudianteComponent implements OnInit, OnDestroy {
  
  // =====================================================
  // ⚙️ CONFIGURACIÓN BACKEND
  // =====================================================
  private readonly API_URL = 'http://localhost:3000/api';
  private readonly TAREAS_ENDPOINT = `${this.API_URL}/estudiante/tareas`;
  private readonly ARCHIVOS_BASE = 'http://localhost:3000';

  // =====================================================
  // 📊 DATOS PRINCIPALES
  // =====================================================
  tareas: TareaEstudiante[] = [];
  materias: Materia[] = [];
  nombreEstudiante: string = 'Estudiante';
  tareaSeleccionada: TareaEstudiante | null = null;
  misEntregas: EntregaEstudiante[] = [];
  calificaciones: Calificacion[] = [];
  estadisticas: any = {};

  // =====================================================
  // ⏱️ ESTADOS DE CARGA
  // =====================================================
  loadingTareas: boolean = false;
  loadingEntregas: boolean = false;
  loadingCalificaciones: boolean = false;
  entregandoTarea: boolean = false;
  cargandoMaterias: boolean = false;
  
  // =====================================================
  // ⚠️ MANEJO DE ERRORES
  // =====================================================
  errorTareas: string | null = null;
  errorEntregas: string | null = null;
  errorModalEntrega: string | null = null;

  // =====================================================
  // 🎯 FILTROS
  // =====================================================
  filtroSeleccionado: 'todas' | 'pendientes' | 'entregadas' | 'calificadas' | 'vencidas' = 'todas';
  vistaActual: 'tareas' | 'entregas' | 'calificaciones' | 'estadisticas' = 'tareas';

  // =====================================================
  // 🪟 ESTADOS DE MODALES
  // =====================================================
  modalEntregaAbierto = false;
  modalDetalleAbierto = false;
  modalAlertaAbierto = false;
  modalConfirmacionAbierto = false;

  // =====================================================
  // 📝 FORMULARIOS
  // =====================================================
  formEntrega = {
    id_tarea: 0,
    id_entrega: 0,
    comentario_alumno: '',
    esActualizacion: false
  };

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
  nombreArchivo: string = '';

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
    this.logger.log('🔵 TareasEstudianteComponent inicializando...');
    this.inicializarAutenticacion();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =====================================================
  // 🔐 INICIALIZACIÓN DE AUTENTICACIÓN
  // =====================================================
  private inicializarAutenticacion(): void {
    const authToken = sessionStorage.getItem('authToken');
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    const userRole = sessionStorage.getItem('userRole');
    
    this.logger.log('🔐 Tokens disponibles en sessionStorage:', { 
      authToken: authToken ? '✓ Presente' : '✗ Ausente',
      token: token ? '✓ Presente' : '✗ Ausente',
      userId: userId || '✗ Ausente',
      userRole: userRole || '✗ Ausente'
    });
    
    if (!authToken && !token) {
      this.logger.error('❌ No hay sesión activa en sessionStorage');
      this.mostrarAlerta(
        'Sesión no encontrada',
        'No hay una sesión activa. Por favor, inicia sesión nuevamente.',
        'error'
      );
      this.errorTareas = 'Sesión no válida. Por favor, inicia sesión.';
      return;
    }
    
    if (!userId || userId === 'null' || userId === 'undefined') {
      this.logger.error('❌ ID de usuario no válido en sessionStorage');
      this.mostrarAlerta(
        'Error de sesión',
        'No se pudo identificar al usuario. Por favor, cierra sesión y vuelve a entrar.',
        'error'
      );
      return;
    }
    
    this.cargarNombreEstudiante();
    
    this.logger.log('✅ Autenticación verificada correctamente, cargando datos...');
    this.cargarDatosIniciales();
  }

  // =====================================================
  // 👤 CARGAR NOMBRE DEL ESTUDIANTE
  // =====================================================
  private cargarNombreEstudiante(): void {
    try {
      const userData = sessionStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        this.nombreEstudiante = user.nino_nombre || user.nombre || user.userNombre || 'Estudiante';
        this.logger.log('👤 Estudiante:', this.nombreEstudiante);
      } else {
        const userNombre = sessionStorage.getItem('userNombre');
        const ninoNombre = sessionStorage.getItem('ninoNombre');
        this.nombreEstudiante = ninoNombre || userNombre || 'Estudiante';
        // ✅ CORREGIDO: Quitado punto y coma
        this.logger.log('👤 Estudiante (desde campos individuales):', this.nombreEstudiante);
      }
    } catch (error) {
      this.logger.warn('Error cargando nombre del estudiante:', error);
    }
  }

  // =====================================================
  // 🚀 CARGA INICIAL DE DATOS
  // =====================================================
  private cargarDatosIniciales(): void {
    this.logger.log('🚀 Iniciando carga de datos iniciales para estudiante...');
    this.cargarTareas();
  }

  // =====================================================
  // 🔑 MANEJO DE HEADERS
  // =====================================================
  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    const userRole = sessionStorage.getItem('userRole');
    
    if (!token) {
      this.logger.error('❌ No hay token de autenticación en sessionStorage');
      throw new Error('No hay sesión activa');
    }
    
    if (!userId || userId === 'null') {
      this.logger.error('❌ No hay userId en sessionStorage');
      throw new Error('No se pudo identificar al usuario');
    }

    // ✅ CORREGIDO: Quitado punto y coma
    this.logger.log('🔑 Creando headers:', { 
      token: token ? `✓ ${token.substring(0, 20)}...` : '✗ Ausente',
      userId,
      userRole: userRole || 'estudiante'
    });

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-User-Id': userId,
      'X-User-Rol': userRole || 'estudiante'
    });
  }

  private getAuthHeadersFormData(): HttpHeaders {
    const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    const userRole = sessionStorage.getItem('userRole');

    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`,
      'X-User-Id': userId || '',
      'X-User-Rol': userRole || 'estudiante'
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
  // 📥 CARGA DE TAREAS - URL CORREGIDA
  // =====================================================
  cargarTareas(): void {
    this.logger.log('🔄 Iniciando carga de tareas para estudiante...');
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
          }),
          catchError((err: HttpErrorResponse) => {
            this.manejarErrorAutenticacion(err);
            return of({ ok: false, error: err.message });
          })
        )
        .subscribe({
          next: (res: ApiResponse) => {
            this.logger.log('📥 Respuesta de tareas:', res);
            
            if (res?.ok && res.tareas) {
              this.tareas = res.tareas;
              this.nombreEstudiante = res.estudiante || this.nombreEstudiante;
              
              this.logger.log(`📚 ${this.tareas.length} tareas cargadas:`);
              this.tareas.forEach((tarea, i) => {
                // ✅ CORREGIDO: Quitado punto y coma
                this.logger.log(`   ${i+1}. ${tarea.titulo} (ID: ${tarea.id_tarea}) - Estado: ${tarea.estado_alumno}`);
              });
              
              if (this.tareas.length > 0 && !this.tareaSeleccionada) {
                this.logger.log('🎯 Seleccionando primera tarea automáticamente');
                this.seleccionarTarea(this.tareas[0]);
              }
            } else {
              this.logger.warn('⚠️ Respuesta inesperada de tareas:', res);
              this.errorTareas = res?.error || res?.message || 'No se encontraron tareas disponibles';
            }
            
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
  // 🔐 MANEJO DE ERRORES DE AUTENTICACIÓN
  // =====================================================
  private manejarErrorAutenticacion(err: HttpErrorResponse): void {
    this.logger.error('❌ Error de autenticación:', err.status, err.message);
    
    if (err.status === 401) {
      this.logger.error('🔐 Token inválido o expirado');
      this.mostrarAlerta(
        'Sesión expirada',
        'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        'error'
      );
      
      setTimeout(() => {
        sessionStorage.clear();
        window.location.href = '/login';
      }, 2000);
    } else if (err.status === 403) {
      this.logger.error('🚫 Acceso denegado');
      this.mostrarAlerta(
        'Acceso denegado',
        'No tienes permisos para acceder a esta información.',
        'error'
      );
    }
  }

  // =====================================================
  // 🎯 FUNCIONES PRINCIPALES
  // =====================================================
  seleccionarTarea(tarea: TareaEstudiante): void {
    this.logger.log('🎯 Seleccionando tarea:', tarea.titulo, `(ID: ${tarea.id_tarea})`);
    this.tareaSeleccionada = tarea;
    this.cdRef.markForCheck();
  }

  cambiarVista(vista: 'tareas' | 'entregas' | 'calificaciones' | 'estadisticas'): void {
    this.vistaActual = vista;
    
    switch (vista) {
      case 'entregas':
        this.cargarMisEntregas();
        break;
      case 'calificaciones':
        this.cargarCalificaciones();
        break;
      case 'estadisticas':
        this.cargarEstadisticas();
        break;
    }
    
    this.cdRef.markForCheck();
  }

  // =====================================================
  // 📄 CARGAR MIS ENTREGAS - URL CORREGIDA
  // =====================================================
  cargarMisEntregas(): void {
    this.logger.log('🔄 Cargando entregas del estudiante...');
    this.loadingEntregas = true;
    this.errorEntregas = null;
    this.cdRef.markForCheck();

    try {
      const headers = this.getAuthHeaders();
      const url = `${this.TAREAS_ENDPOINT}/mis-entregas`;
      
      this.logger.log('🌐 Solicitando entregas desde:', url);
      
      this.http.get<ApiResponse>(url, { headers })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loadingEntregas = false;
            this.cdRef.markForCheck();
          })
        )
        .subscribe({
          next: (res: ApiResponse) => {
            this.logger.log('📥 Respuesta de entregas:', res);
            
            if (res?.ok && res.entregas) {
              this.misEntregas = res.entregas;
              this.logger.log(`📄 ${this.misEntregas.length} entregas cargadas`);
            } else {
              this.misEntregas = [];
            }
            this.cdRef.markForCheck();
          },
          error: (err: HttpErrorResponse) => {
            this.logger.error('❌ Error cargando entregas:', err);
            this.errorEntregas = `Error al cargar entregas: ${err.status}`;
            this.misEntregas = [];
            this.cdRef.markForCheck();
          }
        });
    } catch (error: any) {
      this.logger.error('🚨 Error crítico cargando entregas:', error);
      this.loadingEntregas = false;
      this.errorEntregas = 'Error inesperado';
      this.misEntregas = [];
      this.cdRef.markForCheck();
    }
  }

  // =====================================================
  // 📊 CARGAR CALIFICACIONES - No hay endpoint específico, usar mis-entregas
  // =====================================================
  cargarCalificaciones(): void {
    this.logger.log('🔄 Cargando calificaciones desde entregas...');
    this.loadingCalificaciones = true;
    this.cdRef.markForCheck();

    try {
      const headers = this.getAuthHeaders();
      const url = `${this.TAREAS_ENDPOINT}/mis-entregas`;
      
      this.logger.log('🌐 Solicitando entregas para calificaciones desde:', url);
      
      this.http.get<ApiResponse>(url, { headers })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loadingCalificaciones = false;
            this.cdRef.markForCheck();
          })
        )
        .subscribe({
          next: (res: ApiResponse) => {
            this.logger.log('📥 Respuesta de entregas para calificaciones:', res);
            
            if (res?.ok && res.entregas) {
              const entregasConCalificacion = res.entregas.filter(e => e.calificacion !== null && e.calificacion !== undefined);
              this.calificaciones = entregasConCalificacion.map(e => ({
                id_entrega: e.id_entrega,
                id_tarea: e.id_tarea,
                titulo: e.titulo || 'Tarea',
                nombre_materia: e.nombre_materia || 'Sin materia',
                color_materia: e.color_materia || '#718096',
                calificacion: e.calificacion || 0,
                comentario_docente: e.comentario_docente || undefined,
                fecha_entrega: e.fecha_entrega || new Date().toISOString(),
                nivel_desempeno: this.obtenerNivelDesempeno(e.calificacion || 0)
              }));
              this.logger.log(`📊 ${this.calificaciones.length} calificaciones cargadas`);
            } else {
              this.calificaciones = [];
            }
            this.cdRef.markForCheck();
          },
          error: (err: HttpErrorResponse) => {
            this.logger.error('❌ Error cargando calificaciones:', err);
            this.calificaciones = [];
            this.cdRef.markForCheck();
          }
        });
    } catch (error: any) {
      this.logger.error('🚨 Error crítico cargando calificaciones:', error);
      this.loadingCalificaciones = false;
      this.calificaciones = [];
      this.cdRef.markForCheck();
    }
  }

  // Helper para obtener nivel de desempeño
  private obtenerNivelDesempeno(calificacion: number): string {
    if (calificacion >= 90) return 'EXCELENTE';
    if (calificacion >= 75) return 'BUENO';
    if (calificacion >= 60) return 'SUFICIENTE';
    return 'INSUFICIENTE';
  }

  // =====================================================
  // 📈 CARGAR ESTADÍSTICAS - URL CORREGIDA
  // =====================================================
  cargarEstadisticas(): void {
    this.logger.log('🔄 Cargando estadísticas...');
    this.cdRef.markForCheck();

    try {
      const headers = this.getAuthHeaders();
      const url = `${this.TAREAS_ENDPOINT}/estadisticas`;
      
      this.logger.log('🌐 Solicitando estadísticas desde:', url);
      
      this.http.get<ApiResponse>(url, { headers })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: ApiResponse) => {
            this.logger.log('📥 Respuesta de estadísticas:', res);
            
            if (res?.ok && res.estadisticas) {
              this.estadisticas = res.estadisticas;
              this.logger.log('📈 Estadísticas cargadas');
            } else {
              this.estadisticas = {};
            }
            this.cdRef.markForCheck();
          },
          error: (err: HttpErrorResponse) => {
            this.logger.error('❌ Error cargando estadísticas:', err);
            this.estadisticas = {};
            this.cdRef.markForCheck();
          }
        });
    } catch (error: any) {
      this.logger.error('🚨 Error crítico cargando estadísticas:', error);
      this.estadisticas = {};
      this.cdRef.markForCheck();
    }
  }

  // =====================================================
  // 🔍 FILTRADO
  // =====================================================
  get tareasFiltradas(): TareaEstudiante[] {
    switch (this.filtroSeleccionado) {
      case 'pendientes':
        return this.tareas.filter(t => 
          (!t.id_entrega || t.estado_entrega === 'PENDIENTE') && 
          (!t.dias_restantes || t.dias_restantes > 0)
        );
      case 'entregadas':
        return this.tareas.filter(t => 
          t.id_entrega && 
          (t.estado_entrega === 'ENTREGADO' || t.estado_entrega === 'ENTREGADO_TARDE')
        );
      case 'calificadas':
        return this.tareas.filter(t => 
          t.id_entrega && 
          t.estado_entrega === 'REVISADO' && 
          t.calificacion !== null && 
          t.calificacion !== undefined
        );
      case 'vencidas':
        return this.tareas.filter(t => 
          !t.id_entrega && 
          t.dias_restantes !== undefined && 
          t.dias_restantes < 0
        );
      default:
        return this.tareas;
    }
  }

  setFiltro(filtro: 'todas' | 'pendientes' | 'entregadas' | 'calificadas' | 'vencidas'): void {
    this.filtroSeleccionado = filtro;
    this.cdRef.markForCheck();
  }

  // =====================================================
  // 🛠️ UTILIDADES
  // =====================================================
  permiteTarde(tarea: TareaEstudiante | null): boolean {
    return tarea ? Boolean(tarea.permitir_entrega_tarde) : false;
  }

  estaActiva(tarea: TareaEstudiante | null): boolean {
    return tarea ? Boolean(tarea.activa) : false;
  }

  estadoClass(estado: string | undefined): string {
    if (!estado) return 'estado-chip pendiente';
    
    const e = estado.toUpperCase();
    if (e === 'REVISADO') return 'estado-chip revisado';
    if (e === 'ENTREGADO' || e === 'ENTREGADO_TARDE') return 'estado-chip entregado';
    if (e === 'VENCIDA') return 'estado-chip vencida';
    return 'estado-chip pendiente';
  }

  materiaColor(nombre: string | undefined): string {
    if (!nombre) return '#718096';
    return this.COLORES_MATERIAS[nombre] || '#718096';
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

  diasRestantes(tarea: TareaEstudiante): number {
    if (!tarea.fecha_cierre) return 0;
    
    try {
      const fechaCierre = new Date(tarea.fecha_cierre);
      const ahora = new Date();
      const diferenciaMs = fechaCierre.getTime() - ahora.getTime();
      return Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
    } catch (error) {
      this.logger.warn('Error calculando días restantes:', error);
      return 0;
    }
  }

  formatoDiasRestantes(tarea: TareaEstudiante): string {
    const dias = this.diasRestantes(tarea);
    
    if (dias > 0) {
      return `${dias} día${dias !== 1 ? 's' : ''}`;
    } else if (dias === 0) {
      return 'Hoy';
    } else {
      return `Hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
    }
  }

  nivelDesempenoClass(nivel: string): string {
    switch (nivel) {
      case 'EXCELENTE': return 'nivel-excelente';
      case 'BUENO': return 'nivel-bueno';
      case 'SUFICIENTE': return 'nivel-suficiente';
      case 'INSUFICIENTE': return 'nivel-insuficiente';
      default: return 'nivel-sin-calificar';
    }
  }

  truncarTexto(texto: string, limite: number = 150): string {
    if (!texto) return '';
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
  }

  // =====================================================
  // 🪟 MODALES DE ENTREGA
  // =====================================================
  abrirModalEntrega(tarea: TareaEstudiante, esActualizacion: boolean = false): void {
    this.logger.log('📤 Abriendo modal para', esActualizacion ? 'actualizar entrega' : 'entregar tarea');
    
    if (!this.estaActiva(tarea)) {
      this.mostrarAlerta('Tarea no disponible', 'Esta tarea no está activa', 'error');
      return;
    }
    
    const dias = this.diasRestantes(tarea);
    if (dias < 0 && !this.permiteTarde(tarea)) {
      this.mostrarAlerta('Tarea vencida', 'La fecha límite ha pasado y no se permiten entregas tardías', 'error');
      return;
    }
    
    this.formEntrega = {
      id_tarea: tarea.id_tarea,
      id_entrega: tarea.id_entrega || 0,
      comentario_alumno: '',
      esActualizacion: esActualizacion
    };
    
    this.archivoSeleccionado = null;
    this.nombreArchivo = '';
    this.modalEntregaAbierto = true;
    this.errorModalEntrega = null;
    this.cdRef.markForCheck();
  }

  cerrarModalEntrega(): void {
    this.modalEntregaAbierto = false;
    this.errorModalEntrega = null;
    this.cdRef.markForCheck();
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
      this.nombreArchivo = '';
      this.cdRef.markForCheck();
      return;
    }
    
    const extensionesPermitidas = [
      '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.zip', '.rar',
      '.txt', '.xls', '.xlsx', '.ppt', '.pptx'
    ];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!extensionesPermitidas.includes(extension)) {
      this.mostrarAlerta(
        'Formato no permitido',
        `Formatos permitidos: ${extensionesPermitidas.join(', ')}`,
        'error'
      );
      input.value = '';
      this.archivoSeleccionado = null;
      this.nombreArchivo = '';
      this.cdRef.markForCheck();
      return;
    }
    
    // ✅ CORREGIDO: Quitado punto y coma
    this.logger.log('📎 Archivo seleccionado:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    this.archivoSeleccionado = file;
    this.nombreArchivo = file.name;
    this.cdRef.markForCheck();
  }

  // =====================================================
  // 💾 ENTREGAR/ACTUALIZAR TAREA
  // =====================================================
  enviarEntrega(): void {
    this.logger.log('💾 Iniciando proceso de entrega...');
    
    if (!this.archivoSeleccionado) {
      this.mostrarAlerta('Archivo requerido', 'Debes seleccionar un archivo para entregar la tarea', 'error');
      return;
    }
    
    this.entregandoTarea = true;
    this.cdRef.markForCheck();
    
    const formData = new FormData();
    
    formData.append('id_tarea', this.formEntrega.id_tarea.toString());
    if (this.formEntrega.comentario_alumno) {
      formData.append('comentario_alumno', this.formEntrega.comentario_alumno);
    }
    
    if (this.formEntrega.esActualizacion && this.formEntrega.id_entrega > 0) {
      formData.append('id_entrega', this.formEntrega.id_entrega.toString());
    }
    
    formData.append('archivo_entrega', this.archivoSeleccionado, this.archivoSeleccionado.name);
    
    const endpoint = this.formEntrega.esActualizacion
      ? `${this.TAREAS_ENDPOINT}/actualizar-entrega`
      : `${this.TAREAS_ENDPOINT}/entregar`;
    
    const headers = this.getAuthHeadersFormData();
    
    this.http.post<ApiResponse>(endpoint, formData, { headers })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.entregandoTarea = false;
          this.cdRef.markForCheck();
        })
      )
      .subscribe({
        next: (res: ApiResponse) => {
          this.logger.log('📥 Respuesta del servidor:', res);
          
          if (res?.ok) {
            this.mostrarAlerta(
              'Tarea entregada',
              this.formEntrega.esActualizacion 
                ? 'La entrega ha sido actualizada correctamente'
                : 'La tarea ha sido entregada correctamente',
              'success'
            );
            
            this.cerrarModalEntrega();
            this.cargarTareas();
            
            if (this.vistaActual === 'entregas') {
              this.cargarMisEntregas();
            }
          } else {
            this.mostrarAlerta('Error', res?.error || 'Error al procesar la entrega', 'error');
          }
          this.cdRef.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          this.logger.error('❌ Error completo:', err);
          
          let mensajeError = 'Error al procesar la entrega';
          
          if (err.error?.error) {
            mensajeError = err.error.error;
          } else if (err.status === 401) {
            mensajeError = 'Acceso no autorizado para entregar tareas';
            this.manejarErrorAutenticacion(err);
          } else if (err.status === 500) {
            mensajeError = 'Error interno del servidor. Intenta más tarde.';
          }
          
          this.mostrarAlerta('Error', mensajeError, 'error');
          this.cdRef.markForCheck();
        }
      });
  }

  // =====================================================
  // 📊 ESTADÍSTICAS
  // =====================================================
  get estadisticasTareas() {
    const total = this.tareas.length;
    const entregadas = this.tareas.filter(t => t.id_entrega).length;
    const calificadas = this.tareas.filter(t => t.calificacion).length;
    const vencidas = this.tareas.filter(t => 
      !t.id_entrega && 
      this.diasRestantes(t) < 0
    ).length;
    
    return {
      total,
      entregadas,
      calificadas,
      vencidas,
      porcentajeEntregadas: total > 0 ? Math.round((entregadas / total) * 100) : 0,
      porcentajeCalificadas: entregadas > 0 ? Math.round((calificadas / entregadas) * 100) : 0
    };
  }

  // =====================================================
  // 🔧 DIAGNÓSTICO Y DEBUG - CORREGIDO
  // =====================================================
  verificarEstado(): void {
    // ✅ CORREGIDO: Quitado punto y coma
    this.logger.group('=== VERIFICACIÓN DE ESTADO (ESTUDIANTE) ===');
    // ✅ CORREGIDO: Quitado punto y coma
    this.logger.log('🔐 Tokens en sessionStorage:', {
      authToken: sessionStorage.getItem('authToken') ? '✓ Presente' : '✗ Ausente',
      token: sessionStorage.getItem('token') ? '✓ Presente' : '✗ Ausente',
      userId: sessionStorage.getItem('userId'),
      userRole: sessionStorage.getItem('userRole')
    });
    this.logger.log('📊 Estado del componente:', {
      tareasCount: this.tareas.length,
      entregasCount: this.misEntregas.length,
      calificacionesCount: this.calificaciones.length,
      tareaSeleccionada: this.tareaSeleccionada?.titulo || 'Ninguna',
      vistaActual: this.vistaActual,
      filtroSeleccionado: this.filtroSeleccionado
    });
    this.logger.log('👤 Estudiante:', this.nombreEstudiante);
    this.logger.groupEnd();
    
    if (this.tareas.length === 0 && !this.loadingTareas) {
      this.logger.log('🔄 Forzando recarga de tareas...');
      this.cargarTareas();
    }
  }

  forzarCarga(): void {
    this.logger.log('🚀 Forzando carga completa...');
    this.cargarTareas();
    this.cargarMisEntregas();
    this.cargarCalificaciones();
    this.cargarEstadisticas();
  }

  probarConexionBackend(): void {
    this.logger.log('🔧 Probando conexión con backend...');
    
    this.http.get(`${this.TAREAS_ENDPOINT}/health`)
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
}