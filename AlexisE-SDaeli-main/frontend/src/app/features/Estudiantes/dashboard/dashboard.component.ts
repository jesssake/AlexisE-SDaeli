import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoggingService } from '../../../services/logging.service';

export interface AvisoEstudiante {
  id: number;
  titulo: string;
  contenido: string;
  prioridad: 'alta' | 'media' | 'baja';
  publicado: string;
  fecha_formateada: string;
}

export interface Estadisticas {
  total: number;
  altos: number;
  medios: number;
  bajos: number;
  ultimo_aviso: string;
  ultima_actualizacion: string | null;
  mensaje?: string;
}

export interface InfoTabla {
  tabla_existe: boolean;
  total_registros: number;
  activos: number;
  inactivos: number;
  ejemplos?: any[];
  mensaje: string;
}

@Component({
  selector: 'app-dashboard-estudiante',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardEstudianteComponent implements OnInit, OnDestroy {
  // ================= FECHA Y HORA =================
  fechaActual = { hora: '', dia: '', mes: '', anio: '' };
  private intervalId: any = null;

  // ================= BACKEND =================
  // ¡CAMBIA ESTA LÍNEA! Usa la URL completa del backend
  private apiBase = 'http://localhost:3000/api/estudiante/dashboard';

  // ================= DATOS =================
  avisos: AvisoEstudiante[] = [];
  estadisticas: Estadisticas = {
    total: 0,
    altos: 0,
    medios: 0,
    bajos: 0,
    ultimo_aviso: 'Sin avisos activos',
    ultima_actualizacion: null,
    mensaje: 'Cargando...'
  };
  
  // UI States
  loading = false;
  error = '';
  avisoSeleccionado: AvisoEstudiante | null = null;
  mostrarModalDetalle = false;
  infoTabla: InfoTabla | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  , private logger: LoggingService) {}

  // ================= CICLO DE VIDA =================
  ngOnInit(): void {
    this.logger.log('🎓 Dashboard Estudiante - SOLO avisos ACTIVOS (activo = 1);');
    this.logger.log('🔧 API Base URL:', this.apiBase); // Verifica que se vea la URL completa
    
    this.actualizarFecha();
    this.intervalId = setInterval(() => this.actualizarFecha(), 1000);
    this.verificarTabla();
    this.cargarAvisosActivos();
    this.cargarEstadisticas();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // ================= VERIFICAR TABLA =================
  verificarTabla(): void {
    const url = `${this.apiBase}/verificar`;
    this.logger.log('🔍 Verificando tabla avisos desde:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.logger.log('✅ Verificación tabla EXITOSA:', response);
        this.infoTabla = response;
        
        if (!response.tabla_existe) {
          this.error = '⚠️ La tabla de avisos no existe en la base de datos';
        } else if (response.activos === 0) {
          this.error = '📭 No hay avisos activos publicados';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('❌ Error DETALLADO verificando tabla:', error);
        this.logger.error('❌ Status:', error.status);
        this.logger.error('❌ Status Text:', error.statusText);
        this.logger.error('❌ Error Object:', error.error);
        this.logger.error('❌ URL intentada:', error.url);
        
        this.infoTabla = { 
          tabla_existe: false, 
          total_registros: 0,
          activos: 0,
          inactivos: 0,
          mensaje: 'Error al verificar tabla: ' + error.message 
        };
      }
    });
  }

  // ================= CARGA DE AVISOS ACTIVOS =================
  cargarAvisosActivos(): void {
    const url = `${this.apiBase}/avisos`;
    this.logger.log('📡 Cargando SOLO avisos ACTIVOS desde:', url);
    
    this.loading = true;
    this.error = '';
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.logger.log('✅ Respuesta avisos ACTIVOS EXITOSA:', response);
        
        if (response && response.success) {
          this.avisos = response.avisos || [];
          this.logger.log(`📋 ${this.avisos.length} avisos ACTIVOS cargados`);
          
          if (response.mensaje && this.avisos.length === 0) {
            this.error = response.mensaje;
          }
        } else {
          this.error = response?.message || 'Error al cargar avisos activos';
          this.avisos = [];
        }
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('❌ Error DETALLADO cargando avisos ACTIVOS:', error);
        this.logger.error('❌ Status:', error.status);
        this.logger.error('❌ Status Text:', error.statusText);
        this.logger.error('❌ Error Object:', error.error);
        this.logger.error('❌ URL intentada:', error.url);
        
        this.error = this.obtenerMensajeError(error);
        this.avisos = [];
      },
      complete: () => {
        this.loading = false;
        this.logger.log('✅ Carga de avisos completada');
      }
    });
  }

  cargarEstadisticas(): void {
    const url = `${this.apiBase}/estadisticas`;
    this.logger.log('📡 Cargando estadísticas de AVISOS ACTIVOS desde:', url);
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.logger.log('✅ Respuesta estadísticas ACTIVAS EXITOSA:', response);
        
        if (response && response.success && response.estadisticas) {
          this.estadisticas = response.estadisticas;
          this.logger.log('📊 Estadísticas de avisos ACTIVOS cargadas:', this.estadisticas);
        } else {
          this.logger.warn('⚠️ Respuesta sin estadísticas:', response);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.logger.error('❌ Error DETALLADO cargando estadísticas:', error);
        this.logger.error('❌ Status:', error.status);
        this.logger.error('❌ Status Text:', error.statusText);
        this.logger.error('❌ Error Object:', error.error);
        this.logger.error('❌ URL intentada:', error.url);
      }
    });
  }

  // ================= UI HELPERS =================
  verDetalleAviso(aviso: AvisoEstudiante): void {
    this.logger.log('👁️ Ver detalle del aviso ACTIVO:', aviso.id);
    this.avisoSeleccionado = aviso;
    this.mostrarModalDetalle = true;
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.avisoSeleccionado = null;
  }

  getPrioridadClass(prioridad: string): string {
    switch (prioridad) {
      case 'alta': return 'prioridad-alta';
      case 'media': return 'prioridad-media';
      case 'baja': return 'prioridad-baja';
      default: return '';
    }
  }

  getPrioridadIcon(prioridad: string): string {
    switch (prioridad) {
      case 'alta': return '🔴';
      case 'media': return '🟡';
      case 'baja': return '🟢';
      default: return '📌';
    }
  }

  getPrioridadTexto(prioridad: string): string {
    switch (prioridad) {
      case 'alta': return 'Importante';
      case 'media': return 'Normal';
      case 'baja': return 'Informativo';
      default: return 'General';
    }
  }

  // ================= ACTUALIZAR =================
  actualizarDashboard(): void {
    this.logger.log('🔄 Actualizando avisos ACTIVOS...');
    this.error = '';
    this.cargarAvisosActivos();
    this.cargarEstadisticas();
    this.verificarTabla();
  }

  // ================= DEBUG =================
  mostrarInfoTabla(): void {
    this.logger.log('📊 Información de tabla:', this.infoTabla);
    if (this.infoTabla) {
      alert(`Tabla avisos: ${this.infoTabla.tabla_existe ? 'EXISTE' : 'NO EXISTE'}\n` +
            `Total registros: ${this.infoTabla.total_registros}\n` +
            `Activos: ${this.infoTabla.activos}\n` +
            `Inactivos: ${this.infoTabla.inactivos}\n` +
            `Mensaje: ${this.infoTabla.mensaje}`);
    }
  }

  // ================= TEST RÁPIDO =================
  testBackendManual(): void {
    this.logger.log('🧪 Probando backend manualmente...');
    
    // Prueba directa sin el componente
    const testUrl = 'http://localhost:3000/api/estudiante/dashboard/avisos';
    this.logger.log('🔗 URL de prueba:', testUrl);
    
    fetch(testUrl)
      .then(response => {
        this.logger.log('✅ Fetch response status:', response.status);
        return response.json();
      })
      .then(data => {
        this.logger.log('✅ Fetch response data:', data);
        alert('✅ Backend funciona! Mira la consola para los datos.');
      })
      .catch(error => {
        this.logger.error('❌ Fetch error:', error);
        alert('❌ Error en fetch: ' + error.message);
      });
  }

  // ================= MANEJO DE ERRORES =================
  private obtenerMensajeError(error: HttpErrorResponse): string {
    this.logger.log('🔍 Analizando error HTTP:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error
    });
    
    if (error.status === 0) {
      return '❌ Servidor no disponible. Verifica que el backend esté corriendo en http://localhost:3000';
    }
    
    if (error.status === 404) {
      return `❌ Ruta no encontrada: ${error.url}`;
    }
    
    if (error.status === 500) {
      if (error.error?.error?.includes('ER_NO_SUCH_TABLE')) {
        return '❌ La tabla "avisos" no existe en la base de datos.';
      }
      return '❌ Error interno del servidor.';
    }
    
    if (error.error?.message) {
      return `❌ ${error.error.message}`;
    }
    
    return `❌ Error ${error.status || 'desconocido'}: ${error.statusText}`;
  }

  // ================= FECHA/HORA =================
  private actualizarFecha(): void {
    const ahora = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');

    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    this.fechaActual.hora = `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;
    this.fechaActual.dia = `${dias[ahora.getDay()]}, ${ahora.getDate()}`;
    this.fechaActual.mes = meses[ahora.getMonth()];
    this.fechaActual.anio = ahora.getFullYear().toString();
  }
}