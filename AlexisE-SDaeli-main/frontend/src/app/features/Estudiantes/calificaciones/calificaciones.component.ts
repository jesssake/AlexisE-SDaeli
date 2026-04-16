import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoggingService } from '../../../services/logging.service';

type Trimestre = {
  id: number | string;
  nombre: string;
  promedio: number | null;
  tareas: {
    tarea_id: number;
    titulo: string;
    instrucciones: string;
    fecha_cierre: string | null;
    maestro_id: number;
    calificacion: number | null;
    materia_nombre?: string;
    materia_color?: string;
    materia_icono?: string;
    fecha_entrega?: string;
    nivel_desempeno?: string;
  }[];
};

type Resp = {
  ok: boolean;
  alumno_id: number;
  alumno_nombre: string;
  promedio_global: number | null;
  trimestres: Trimestre[];
  error?: string;
};

@Component({
  selector: 'app-calificaciones-alumno',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './calificaciones.component.html',
  styleUrls: ['./calificaciones.component.scss'],
})
export class CalificacionesComponent implements OnInit {
  cargando = false;
  error: string | null = null;

  promedioGlobal: number | null = null;
  trimestres: Trimestre[] = [];
  alumnoNombre: string = '';

  private api = 'http://localhost:3000/api/estudiante/calificaciones';

  constructor(private http: HttpClient, private logger: LoggingService) {}

  ngOnInit(): void {
    this.cargar();
  }

  // Obtener ID del estudiante desde sessionStorage
  private obtenerIdEstudiante(): string | null {
    // Prioridad 1: userData.nino_id
    const userDataStr = sessionStorage.getItem('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.nino_id && userData.nino_id > 0) {
          this.logger.log('✅ ID obtenido de userData.nino_id:', userData.nino_id);
          return userData.nino_id.toString();
        }
      } catch (e) {
        this.logger.warn('Error parseando userData:', e);
      }
    }
    
    // Prioridad 2: userId
    const userId = sessionStorage.getItem('userId');
    if (userId && userId !== 'null' && userId !== 'undefined') {
      this.logger.log('✅ ID obtenido de userId:', userId);
      return userId;
    }
    
    // Prioridad 3: studentId
    const studentId = sessionStorage.getItem('studentId');
    if (studentId && studentId !== 'null' && studentId !== 'undefined') {
      this.logger.log('✅ ID obtenido de studentId:', studentId);
      return studentId;
    }
    
    this.logger.log('⚠️ No se encontró ID de estudiante en sesión');
    return null;
  }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
    const userId = this.obtenerIdEstudiante();
    
    let headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (userId) {
      headers['X-User-Id'] = userId;
      headers['X-User-Rol'] = 'estudiante';
    }
    
    return new HttpHeaders(headers);
  }

  cargar(): void {
    this.cargando = true;
    this.error = null;

    const estudianteId = this.obtenerIdEstudiante();
    
    if (!estudianteId) {
      this.error = 'No se encontró tu sesión. Por favor, inicia sesión nuevamente.';
      this.cargando = false;
      return;
    }

    this.logger.log('📡 Cargando calificaciones para estudiante ID:', estudianteId);

    const url = `${this.api}/${estudianteId}`;
    const headers = this.getHeaders();
    
    this.http.get<Resp>(url, { headers }).pipe(
      catchError(error => {
        this.logger.error('❌ Error en la petición:', error);
        
        if (error.status === 401) {
          this.error = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
        
        return throwError(() => error);
      })
    ).subscribe({
      next: (resp) => {
        this.logger.log('📥 Respuesta de calificaciones:', resp);
        
        if (!resp?.ok) {
          this.error = resp?.error || 'No se pudieron cargar tus calificaciones.';
          this.trimestres = [];
          this.promedioGlobal = null;
        } else {
          this.trimestres = resp.trimestres || [];
          this.promedioGlobal = resp.promedio_global;
          this.alumnoNombre = resp.alumno_nombre || '';
          
          this.logger.log(`✅ ${this.trimestres.length} trimestres cargados`);
          this.logger.log('📊 Promedio global:', this.promedioGlobal);
        }
        this.cargando = false;
      },
      error: (err) => {
        this.logger.error('❌ Error cargando calificaciones:', err);
        
        if (err.status === 0) {
          this.error = 'No se pudo conectar al servidor. Verifica tu conexión.';
        } else if (err.status === 404) {
          this.error = 'El servicio de calificaciones no está disponible.';
        } else if (err.status === 403) {
          this.error = 'No tienes permiso para ver estas calificaciones.';
        } else {
          this.error = 'Error de conexión. Intenta nuevamente más tarde.';
        }
        
        this.cargando = false;
      },
    });
  }

  // ✅ MÉTODO AGREGADO: Obtener total de tareas calificadas
  obtenerTotalTareas(): number {
    let total = 0;
    this.trimestres.forEach(trimestre => {
      total += trimestre.tareas.length;
    });
    return total;
  }

  // Formato de fecha
  fmt(fecha: string | null): string {
    if (!fecha) return '—';
    const d = fecha.slice(0, 10).split('-');
    if (d.length !== 3) return fecha;
    return `${d[2]}/${d[1]}/${d[0]}`;
  }

  getNivelDesempeno(calificacion: number | null): string {
    if (calificacion === null) return 'Sin calificar';
    if (calificacion >= 9) return 'Excelente';
    if (calificacion >= 7) return 'Bueno';
    if (calificacion >= 6) return 'Suficiente';
    return 'Insuficiente';
  }

  getColorCalificacion(calificacion: number | null): string {
    if (calificacion === null) return '#f1f5f9';
    if (calificacion >= 9) return '#10b981';
    if (calificacion >= 7) return '#3b82f6';
    if (calificacion >= 6) return '#f59e0b';
    return '#ef4444';
  }

  recargar(): void {
    this.logger.log('🔄 Recargando calificaciones...');
    this.cargar();
  }
}