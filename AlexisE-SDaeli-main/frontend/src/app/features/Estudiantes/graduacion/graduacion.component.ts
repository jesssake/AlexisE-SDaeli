// C:\Codigos\HTml\AlexisE-SDaeli-main\AlexisE-SDaeli-main\frontend\src\app\features\Estudiantes\graduacion\graduacion.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { LoggingService } from '../../../services/logging.service';
import {
  limpiarTextoWinAnsi,
  limpiarNombrePropio,
  crearNombreArchivoSeguro
} from '../../../utils/pdfUtils';

// ========================================
// INTERFACES
// ========================================
interface Certificado {
  id: number;
  alumno_id: number;
  alumno_nombre: string;
  alumno_nombre_limpio?: string;
  promedio: number;
  ciclo: string;
  ciclo_limpio?: string;
  maestro_firma: string;
  maestro_firma_limpia?: string;
  estado: 'enviado' | 'pendiente' | 'cancelado';
  fecha_creacion: string;
  fecha_formateada?: string;
  archivo_pdf?: string;
}

interface Estadisticas {
  total: number;
  enviados: number;
  pendientes: number;
  promedio_general: string;
  promedio_minimo: string;
  promedio_maximo: string;
}

interface ResumenEstudiante {
  success: boolean;
  estudiante: {
    id: number;
    nombre: string;
    nombre_limpio?: string;
    tutor: string;
    tutor_limpio?: string;
    email: string;
    grado: string;
  };
  estadisticas: Estadisticas;
  certificados_recientes: Certificado[];
  ciclos_disponibles: string[];
  certificados_disponibles_descarga: number;
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
@Component({
  selector: 'app-estudiante-graduacion',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './graduacion.component.html',
  styleUrls: ['./graduacion.component.scss']
})
export class EstudianteGraduacionComponent implements OnInit {
  // ========================================
  // PROPIEDADES PRIVADAS
  // ========================================
  private apiBase = 'http://localhost:3000/api/estudiante/graduacion/';
  
  // ========================================
  // PROPIEDADES PÚBLICAS
  // ========================================
  estudianteId: number = 0;
  cargando = false;
  descargando = false;
  error: string = '';
  certificados: Certificado[] = [];
  ciclosUnicos: string[] = [];
  
  // Filtros
  filtros = {
    tipo: 'todos',
    estado: 'todos',
    ciclo: 'todos'
  };

  // Estadísticas
  stats: Estadisticas = {
    total: 0,
    enviados: 0,
    pendientes: 0,
    promedio_general: '0.00',
    promedio_minimo: '0.00',
    promedio_maximo: '0.00'
  };

  // Resumen del estudiante
  resumen: ResumenEstudiante | null = null;

  // ========================================
  // GETTERS
  // ========================================
  get certificadosEnviados(): number {
    return this.certificados.filter(c => c.estado === 'enviado').length;
  }

  get certificadosPendientes(): number {
    return this.certificados.filter(c => c.estado === 'pendiente').length;
  }

  get tieneCertificados(): boolean {
    return this.certificados.length > 0;
  }

  // ========================================
  // CONSTRUCTOR
  // ========================================
  constructor(
    private http: HttpClient, 
    private logger: LoggingService
  ) {}

  // ========================================
  // LIFECYCLE HOOKS
  // ========================================
  ngOnInit(): void {
    this.obtenerIdEstudiante();
    if (this.estudianteId > 0) {
      this.cargarDatosCompletos();
    }
  }

  // ========================================
  // MÉTODOS PRIVADOS - AUTENTICACIÓN (ACTUALIZADO A sessionStorage)
  // ========================================
  private obtenerIdEstudiante(): void {
    // ✅ ACTUALIZADO: Usar sessionStorage en lugar de localStorage
    const userId = sessionStorage.getItem('userId');
    const tutorId = sessionStorage.getItem('tutorId');
    const userDataStr = sessionStorage.getItem('userData');
    
    // Priorizar nino_id si existe
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.nino_id && userData.nino_id > 0) {
          this.estudianteId = userData.nino_id;
          this.logger.log('✅ ID obtenido de userData.nino_id:', this.estudianteId);
        }
      } catch (e) {
        this.logger.warn('Error parseando userData:', e);
      }
    }
    
    // Si no se obtuvo de nino_id, usar userId o tutorId
    if (!this.estudianteId || this.estudianteId <= 0) {
      this.estudianteId = parseInt(userId || '0') || 
                          parseInt(tutorId || '0') ||
                          parseInt(sessionStorage.getItem('studentId') || '0');
    }

    if (!this.estudianteId || this.estudianteId <= 0) {
      this.logger.error('❌ No se pudo obtener el ID del estudiante');
      
      const urlParams = new URLSearchParams(window.location.search);
      const idFromUrl = urlParams.get('estudianteId');
      if (idFromUrl && !isNaN(parseInt(idFromUrl))) {
        this.estudianteId = parseInt(idFromUrl);
        this.logger.log('✅ ID obtenido de URL:', this.estudianteId);
      } else {
        this.error = '⚠️ Por favor, inicia sesión nuevamente para acceder a tus certificados';
      }
    } else {
      this.logger.log('✅ ID del estudiante cargado:', this.estudianteId);
    }
  }

  private getHeaders(): HttpHeaders {
    // ✅ ACTUALIZADO: Usar sessionStorage
    const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
    let headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (this.estudianteId) {
      headers['X-User-Id'] = this.estudianteId.toString();
      headers['X-User-Rol'] = 'estudiante';
    }
    
    return new HttpHeaders(headers);
  }

  // ========================================
  // MÉTODOS PRIVADOS - LIMPIEZA DE TEXTOS
  // ========================================
  private limpiarTextosCertificados(certificados: any[]): Certificado[] {
    return certificados.map(c => ({
      ...c,
      alumno_nombre_limpio: limpiarNombrePropio(c.alumno_nombre || ''),
      ciclo_limpio: limpiarTextoWinAnsi(c.ciclo || ''),
      maestro_firma_limpia: limpiarNombrePropio(c.maestro_firma || '')
    }));
  }

  private limpiarTextosResumen(resumen: ResumenEstudiante): ResumenEstudiante {
    if (resumen?.estudiante) {
      resumen.estudiante.nombre_limpio = limpiarNombrePropio(resumen.estudiante.nombre);
      resumen.estudiante.tutor_limpio = limpiarNombrePropio(resumen.estudiante.tutor);
    }
    return resumen;
  }

  // ========================================
  // MÉTODOS PRIVADOS - CARGA DE DATOS
  // ========================================
  private cargarDatosCompletos(): void {
    if (!this.estudianteId || this.estudianteId <= 0) return;

    this.cargando = true;
    this.error = '';
    
    Promise.all([
      this.cargarResumen(),
      this.cargarCertificados(),
      this.cargarCiclosUnicos()
    ]).then(() => {
      this.cargando = false;
      this.logger.log('✅ Todos los datos cargados exitosamente');
    }).catch(error => {
      this.logger.error('❌ Error cargando datos:', error);
      this.cargando = false;
      this.error = 'Error al cargar los datos. Por favor, recarga la página.';
    });
  }

  private cargarResumen(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${this.apiBase}${this.estudianteId}/resumen`;
      this.logger.log('🔗 URL resumen:', url);

      this.http.get<ResumenEstudiante>(url, { headers: this.getHeaders() }).subscribe({
        next: (resp) => {
          if (resp?.success && resp?.estadisticas) {
            this.resumen = this.limpiarTextosResumen(resp);
            
            this.stats = {
              total: resp.estadisticas.total || 0,
              enviados: resp.estadisticas.enviados || 0,
              pendientes: resp.estadisticas.pendientes || 0,
              promedio_general: this.formatNumero(resp.estadisticas.promedio_general),
              promedio_minimo: this.formatNumero(resp.estadisticas.promedio_minimo),
              promedio_maximo: this.formatNumero(resp.estadisticas.promedio_maximo)
            };
            
            if (resp.ciclos_disponibles?.length > 0) {
              this.ciclosUnicos = resp.ciclos_disponibles.map(c => limpiarTextoWinAnsi(c));
            }
            
            this.logger.log('✅ Resumen cargado para:', resp.estudiante.nombre);
          }
          resolve();
        },
        error: (err) => {
          this.logger.error('❌ Error cargando resumen:', err);
          this.cargarEstadisticas().then(resolve).catch(reject);
        }
      });
    });
  }

  private cargarEstadisticas(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${this.apiBase}${this.estudianteId}/estadisticas`;
      
      this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
        next: (stats) => {
          // ✅ CORREGIDO: Quitado punto y coma
          this.logger.log('✅ Estadísticas cargadas (fallback):', stats);
          this.stats = {
            total: stats.total || 0,
            enviados: stats.enviados || 0,
            pendientes: stats.pendientes || (stats.total || 0) - (stats.enviados || 0),
            promedio_general: this.formatNumero(stats.promedio_general),
            promedio_minimo: this.formatNumero(stats.promedio_minimo),
            promedio_maximo: this.formatNumero(stats.promedio_maximo)
          };
          resolve();
        },
        error: (err) => {
          this.logger.error('❌ Error cargando estadísticas:', err);
          reject(err);
        }
      });
    });
  }

  private cargarCertificados(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${this.apiBase}${this.estudianteId}/certificados`;
      this.logger.log('🔗 URL certificados:', url);

      this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
        next: (resp) => {
          if (Array.isArray(resp)) {
            this.certificados = this.limpiarTextosCertificados(resp);
            this.logger.log(`✅ ${this.certificados.length} certificados cargados`);
          } else {
            this.logger.warn('⚠️ Formato inesperado en certificados:', resp);
            this.certificados = [];
          }
          resolve();
        },
        error: (err) => {
          this.logger.error('❌ Error cargando certificados:', err);
          this.certificados = [];
          reject(err);
        }
      });
    });
  }

  private cargarCiclosUnicos(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ciclosUnicos.length > 0) {
        resolve();
        return;
      }

      const url = `${this.apiBase}${this.estudianteId}/ciclos`;
      
      this.http.get<string[]>(url, { headers: this.getHeaders() }).subscribe({
        next: (ciclos) => {
          if (Array.isArray(ciclos)) {
            this.ciclosUnicos = ciclos.map(c => limpiarTextoWinAnsi(c));
            this.logger.log('✅ Ciclos cargados:', ciclos.length);
          }
          resolve();
        },
        error: () => {
          this.extractCiclosFromCertificados();
          resolve();
        }
      });
    });
  }

  private extractCiclosFromCertificados(): void {
    if (this.certificados.length > 0) {
      const ciclos = this.certificados
        .map(c => c.ciclo_limpio || c.ciclo)
        .filter(c => c && c.trim() !== '' && c !== 'Sin ciclo');
      
      this.ciclosUnicos = [...new Set(ciclos)].sort().reverse();
      this.logger.log('✅ Ciclos extraídos:', this.ciclosUnicos);
    }
  }

  // ========================================
  // MÉTODO PRINCIPAL - DESCARGAR CERTIFICADO
  // ✅ DESCARGA EL PDF QUE EL MAESTRO GUARDÓ EN EL SERVIDOR
  // ========================================
  descargarCertificado(certificadoId: number): void {
    const certificado = this.certificados.find(c => c.id === certificadoId);
    if (!certificado) {
      alert('❌ Certificado no encontrado');
      return;
    }

    if (certificado.estado !== 'enviado') {
      alert(`⏳ Este certificado aún no está disponible para descarga.\nEstado actual: ${this.estadoTexto(certificado.estado)}`);
      return;
    }

    const nombreLimpio = certificado.alumno_nombre_limpio || 
                        limpiarNombrePropio(certificado.alumno_nombre);
    const nombreArchivo = crearNombreArchivoSeguro(nombreLimpio);

    if (!confirm(`¿Descargar certificado de ${nombreLimpio}?`)) return;

    this.descargando = true;
    
    const url = `${this.apiBase}certificados/${certificadoId}/pdf?estudiante_id=${this.estudianteId}`;
    this.logger.log('🔗 Descargando PDF guardado desde:', url);
    
    this.http.get(url, { 
      headers: this.getHeaders(),
      responseType: 'blob',
      observe: 'response' 
    }).subscribe({
      next: (response: any) => {
        this.descargando = false;
        
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/pdf')) {
          this.descargarBlobComoPDF(response.body, nombreArchivo);
          this.logger.log('✅ Certificado descargado exitosamente desde el servidor');
          alert('✅ Certificado descargado exitosamente');
        } else {
          this.logger.error('❌ Respuesta no es PDF:', contentType);
          alert('❌ El certificado no está disponible en formato PDF. Contacta a tu maestro.');
        }
      },
      error: (err) => {
        this.descargando = false;
        this.logger.error('❌ Error descargando certificado:', err);
        
        if (err.status === 404) {
          alert('📄 El archivo PDF del certificado no se encuentra en el servidor.\n\nPor favor, contacta a tu maestro para que genere el certificado nuevamente.');
        } else if (err.status === 403) {
          alert('⛔ No tienes permiso para descargar este certificado.');
        } else if (err.status === 401) {
          alert('🔐 Sesión expirada. Por favor, inicia sesión nuevamente.');
          window.location.href = '/login';
        } else {
          alert('❌ Error al descargar el certificado. Verifica tu conexión o contacta a tu maestro.');
        }
      }
    });
  }

  private descargarBlobComoPDF(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // ========================================
  // MÉTODOS PÚBLICOS - INTERACCIÓN
  // ========================================
  verDetalles(certificado: Certificado): void {
    const nombreMostrar = certificado.alumno_nombre_limpio || certificado.alumno_nombre;
    const cicloMostrar = certificado.ciclo_limpio || certificado.ciclo;
    const maestroMostrar = certificado.maestro_firma_limpia || certificado.maestro_firma;
    
    const estadoEmoji = certificado.estado === 'enviado' ? '✅' : 
                       certificado.estado === 'pendiente' ? '⏳' : '❌';
    
    const detalles = `
📋 DETALLES DEL CERTIFICADO
-------------------------
ID: ${certificado.id}
Alumno: ${nombreMostrar}
Promedio: ${certificado.promedio.toFixed(2)}
Ciclo escolar: ${cicloMostrar}
Estado: ${estadoEmoji} ${this.estadoTexto(certificado.estado)}
Firma del maestro: ${maestroMostrar}
Fecha: ${certificado.fecha_formateada || this.fechaBonita(certificado.fecha_creacion)}
-------------------------
${certificado.estado === 'enviado' ? 
  '✅ Este certificado está disponible para descargar' : 
  '⏳ Tu maestro aún no ha enviado este certificado'}
    `;
    
    alert(detalles);
  }

  aplicarFiltros(): void {
    if (!this.estudianteId) return;
    
    this.cargando = true;
    const url = `${this.apiBase}${this.estudianteId}/certificados`;
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        if (Array.isArray(resp)) {
          let certificadosFiltrados = resp;
          
          if (this.filtros.estado !== 'todos') {
            certificadosFiltrados = certificadosFiltrados.filter((c: any) => 
              c.estado === this.filtros.estado
            );
          }
          
          if (this.filtros.ciclo !== 'todos') {
            certificadosFiltrados = certificadosFiltrados.filter((c: any) => 
              (c.ciclo_limpio || c.ciclo) === this.filtros.ciclo
            );
          }
          
          this.certificados = this.limpiarTextosCertificados(certificadosFiltrados);
        }
        this.cargando = false;
      },
      error: (err) => {
        this.logger.error('❌ Error aplicando filtros:', err);
        this.cargando = false;
        this.error = 'Error al aplicar filtros';
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      tipo: 'todos',
      estado: 'todos',
      ciclo: 'todos'
    };
    this.cargarCertificados();
  }

  recargarDatos(): void {
    this.logger.log('🔄 Recargando datos...');
    this.cargando = true;
    this.error = '';
    this.cargarDatosCompletos();
  }

  // ========================================
  // MÉTODOS PÚBLICOS - UTILIDADES
  // ========================================
  private formatNumero(value: any): string {
    if (typeof value === 'number') return value.toFixed(2);
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (!isNaN(num)) return num.toFixed(2);
    }
    return '0.00';
  }

  getColorPromedio(promedio: number): string {
    if (promedio >= 9.5) return '#059669';
    if (promedio >= 9.0) return '#10b981';
    if (promedio >= 8.5) return '#34d399';
    if (promedio >= 8.0) return '#f59e0b';
    if (promedio >= 7.0) return '#f97316';
    return '#ef4444';
  }

  fechaBonita(fecha: string): string {
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return fecha || 'Fecha no disponible';
      return fechaObj.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return fecha || 'Fecha no disponible';
    }
  }

  estadoTexto(estado: string): string {
    const estados: {[key: string]: string} = {
      'enviado': 'Enviado',
      'pendiente': 'Pendiente',
      'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'enviado': return '#10b981';
      case 'pendiente': return '#f59e0b';
      case 'cancelado': return '#ef4444';
      default: return '#6b7280';
    }
  }

  // ========================================
  // DEBUGGING - CORREGIDO
  // ========================================
  verificarDatos(): void {
    this.logger.group('🔍 VERIFICACIÓN DE DATOS (Graduación)');
    this.logger.log('ID del estudiante:', this.estudianteId);
    this.logger.log('Certificados cargados:', this.certificados.length);
    this.logger.log('Certificados enviados:', this.certificadosEnviados);
    this.logger.log('Certificados pendientes:', this.certificadosPendientes);
    this.logger.log('Ciclos únicos:', this.ciclosUnicos);
    this.logger.log('Estadísticas:', this.stats);
    this.logger.log('Resumen completo:', this.resumen);
    this.logger.log('Error actual:', this.error);
    this.logger.log('Descargando:', this.descargando);
    this.logger.log('📦 sessionStorage:');
    // ✅ CORREGIDO: Quitados todos los puntos y coma
    this.logger.log('   userId:', sessionStorage.getItem('userId'));
    this.logger.log('   tutorId:', sessionStorage.getItem('tutorId'));
    this.logger.log('   userRole:', sessionStorage.getItem('userRole'));
    this.logger.log('   ninoNombre:', sessionStorage.getItem('ninoNombre'));
    this.logger.log('   userData:', sessionStorage.getItem('userData'));
    
    if (this.certificados.length > 0) {
      this.logger.log('Primer certificado:', this.certificados[0]);
      this.logger.log('¿Tiene archivo_pdf?', this.certificados[0].archivo_pdf);
    }
    this.logger.groupEnd();
  }

  testBackend(): void {
    const testUrl = `${this.apiBase}test`;
    this.logger.log('🧪 Probando conexión backend:', testUrl);
    
    this.http.get(testUrl, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        this.logger.log('✅ Backend respondió:', response);
        alert('✅ Conexión con el backend exitosa');
      },
      error: (err) => {
        this.logger.error('❌ Error conectando al backend:', err);
        alert('❌ No se pudo conectar al backend. Verifica que el servidor esté corriendo en http://localhost:3000');
      }
    });
  }
}