// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\Estudiantes\graduacion\graduacion.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

// ========================================
// INTERFACES
// ========================================
interface Certificado {
  id: number;
  alumno_id: number;
  alumno_nombre: string;
  promedio: number;
  ciclo: string;
  maestro_firma: string;
  estado: 'enviado' | 'pendiente' | 'cancelado';
  fecha_creacion: string;
  fecha_formateada?: string;
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
    tutor: string;
    email: string;
    grado: string;
  };
  estadisticas: Estadisticas;
  certificados_recientes: Certificado[];
  ciclos_disponibles: string[];
  certificados_disponibles_descarga: number;
}

interface DescargaResponse {
  success: boolean;
  message: string;
  certificado?: {
    id: number;
    alumno_id: number;
    alumno_nombre: string;
    promedio: string;
    ciclo: string;
    maestro_firma: string;
    estado: string;
    fecha_creacion: string;
    fecha_formateada: string;
  };
  nota?: string;
}

// ========================================
// COMPONENTE
// ========================================
@Component({
  selector: 'app-estudiante-graduacion',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './graduacion.component.html',
  styleUrls: ['./graduacion.component.scss']
})
export class EstudianteGraduacionComponent implements OnInit {
  private apiBase = 'http://localhost:3000/api/estudiante/graduacion/';
  
  // Obtener ID del estudiante del localStorage
  estudianteId: number = parseInt(localStorage.getItem('userId') || '0') || 
                        parseInt(localStorage.getItem('tutorId') || '0') ||
                        parseInt(localStorage.getItem('studentId') || '0');

  cargando = false;
  error: string = ''; // ✅ AGREGADA ESTA PROPIEDAD
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.verificarAutenticacion();
    this.cargarDatosCompletos();
  }

  // ========================================
  // AUTENTICACIÓN
  // ========================================
  private verificarAutenticacion(): void {
    if (!this.estudianteId || this.estudianteId <= 0) {
      console.error('❌ No se pudo obtener el ID del estudiante');
      console.warn('🔍 Valores en localStorage:');
      console.warn('  userId:', localStorage.getItem('userId'));
      console.warn('  tutorId:', localStorage.getItem('tutorId'));
      console.warn('  studentId:', localStorage.getItem('studentId'));
      console.warn('  authToken:', localStorage.getItem('authToken'));
      
      // Intentar obtener ID de la URL
      const urlParams = new URLSearchParams(window.location.search);
      const idFromUrl = urlParams.get('estudianteId');
      if (idFromUrl && !isNaN(parseInt(idFromUrl))) {
        this.estudianteId = parseInt(idFromUrl);
        console.log('✅ ID obtenido de URL:', this.estudianteId);
      } else {
        this.error = '⚠️ Por favor, inicia sesión nuevamente para acceder a tus certificados';
        alert(this.error);
        // Redirigir al login
        // window.location.href = '/login';
        return;
      }
    } else {
      console.log('✅ ID del estudiante cargado:', this.estudianteId);
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  // ========================================
  // CARGAR DATOS
  // ========================================
  private cargarDatosCompletos(): void {
    if (!this.estudianteId) return;

    this.cargando = true;
    this.error = ''; // Limpiar errores anteriores
    
    // Cargar en paralelo
    Promise.all([
      this.cargarResumen(),
      this.cargarCertificados(),
      this.cargarCiclosUnicos()
    ]).then(() => {
      this.cargando = false;
      console.log('✅ Todos los datos cargados exitosamente');
    }).catch(error => {
      console.error('❌ Error cargando datos:', error);
      this.cargando = false;
      this.error = 'Error al cargar los datos. Por favor, recarga la página.';
      this.mostrarError(this.error);
    });
  }

  // Cargar resumen completo
  private cargarResumen(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${this.apiBase}${this.estudianteId}/resumen`;
      console.log('🔗 URL resumen:', url);

      this.http.get<ResumenEstudiante>(url, { headers: this.getHeaders() }).subscribe({
        next: (resp) => {
          if (resp.success && resp.estadisticas) {
            this.resumen = resp;
            
            // Actualizar estadísticas
            this.stats = {
              total: resp.estadisticas.total || 0,
              enviados: resp.estadisticas.enviados || 0,
              pendientes: resp.estadisticas.pendientes || 0,
              promedio_general: this.formatNumero(resp.estadisticas.promedio_general),
              promedio_minimo: this.formatNumero(resp.estadisticas.promedio_minimo),
              promedio_maximo: this.formatNumero(resp.estadisticas.promedio_maximo)
            };
            
            // Actualizar ciclos
            if (resp.ciclos_disponibles && resp.ciclos_disponibles.length > 0) {
              this.ciclosUnicos = resp.ciclos_disponibles;
            }
            
            console.log('✅ Resumen cargado para:', resp.estudiante.nombre);
          } else {
            console.warn('⚠️ Respuesta sin datos válidos:', resp);
          }
          resolve();
        },
        error: (err) => {
          console.error('❌ Error cargando resumen:', err);
          this.error = 'Error al cargar el resumen.';
          this.cargarEstadisticas().then(resolve).catch(reject);
        }
      });
    });
  }

  // Cargar solo estadísticas (fallback)
  private cargarEstadisticas(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${this.apiBase}${this.estudianteId}/estadisticas`;
      
      this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
        next: (stats) => {
          console.log('✅ Estadísticas cargadas (fallback):', stats);
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
          console.error('❌ Error cargando estadísticas:', err);
          this.error = 'Error al cargar estadísticas.';
          reject(err);
        }
      });
    });
  }

  // Cargar certificados
  private cargarCertificados(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${this.apiBase}${this.estudianteId}/certificados`;
      console.log('🔗 URL certificados:', url);

      this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
        next: (resp) => {
          if (Array.isArray(resp)) {
            this.certificados = resp.map((c: any) => ({
              id: Number(c.id) || 0,
              alumno_id: Number(c.alumno_id) || 0,
              alumno_nombre: c.alumno_nombre || 'Sin nombre',
              promedio: Number(c.promedio) || 0,
              ciclo: c.ciclo || 'Sin ciclo',
              maestro_firma: c.maestro_firma || 'Sin firma',
              estado: (c.estado || 'pendiente') as 'enviado' | 'pendiente' | 'cancelado',
              fecha_creacion: c.fecha_creacion || '',
              fecha_formateada: c.fecha_formateada || ''
            }));
            
            console.log(`✅ ${this.certificados.length} certificados cargados`);
          } else {
            console.warn('⚠️ Formato inesperado en certificados:', resp);
            this.certificados = [];
          }
          resolve();
        },
        error: (err) => {
          console.error('❌ Error cargando certificados:', err);
          this.error = 'Error al cargar certificados.';
          this.certificados = [];
          reject(err);
        }
      });
    });
  }

  // Cargar ciclos únicos
  private cargarCiclosUnicos(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ciclosUnicos.length > 0) {
        resolve();
        return;
      }

      const url = `${this.apiBase}${this.estudianteId}/ciclos`;
      
      this.http.get<string[]>(url, { headers: this.getHeaders() }).subscribe({
        next: (ciclos) => {
          if (Array.isArray(ciclos)) {
            this.ciclosUnicos = ciclos;
            console.log('✅ Ciclos cargados desde endpoint:', ciclos.length);
          }
          resolve();
        },
        error: (err) => {
          console.error('❌ Error cargando ciclos:', err);
          this.extractCiclosFromCertificados();
          resolve();
        }
      });
    });
  }

  private extractCiclosFromCertificados(): void {
    if (this.certificados.length > 0) {
      const ciclos = this.certificados
        .map(c => c.ciclo)
        .filter(c => c && c.trim() !== '' && c !== 'Sin ciclo');
      
      this.ciclosUnicos = [...new Set(ciclos)].sort().reverse();
      console.log('✅ Ciclos extraídos de certificados:', this.ciclosUnicos);
    }
  }

  // ========================================
  // MÉTODOS PÚBLICOS PARA EL TEMPLATE
  // ========================================
  
  // Descargar certificado
  descargarCertificado(certificadoId: number): void {
    if (!confirm('¿Deseas descargar este certificado?')) return;

    const certificado = this.certificados.find(c => c.id === certificadoId);
    if (!certificado) {
      alert('❌ Certificado no encontrado');
      return;
    }

    if (certificado.estado !== 'enviado') {
      alert(`⏳ Este certificado aún no está disponible para descarga.\nEstado actual: ${this.estadoTexto(certificado.estado)}`);
      return;
    }

    const url = `${this.apiBase}certificados/${certificadoId}/descargar?estudiante_id=${this.estudianteId}`;
    console.log('🔗 URL descarga:', url);
    
    this.http.get<DescargaResponse>(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        if (response.success) {
          const mensaje = `✅ ${response.message}\n\n📋 Detalles:\n• Alumno: ${response.certificado?.alumno_nombre}\n• Promedio: ${response.certificado?.promedio}\n• Ciclo: ${response.certificado?.ciclo}\n• Fecha: ${response.certificado?.fecha_formateada}`;
          alert(mensaje);
        } else {
          alert(`⚠️ ${response.message || 'No se pudo procesar la descarga'}`);
        }
      },
      error: (err) => {
        console.error('❌ Error descargando certificado:', err);
        
        if (err.status === 403) {
          alert('⛔ No tienes permiso para descargar este certificado. Contacta a tu maestro.');
        } else if (err.status === 404) {
          alert('📄 La funcionalidad de descarga aún no está implementada completamente.\n\nPor ahora, puedes:\n1. Contactar a tu maestro para obtener el certificado\n2. Guardar una captura de pantalla de los detalles');
        } else {
          alert('❌ Error al procesar la descarga. Verifica tu conexión o contacta al administrador.');
        }
      }
    });
  }

  // Ver detalles del certificado
  verDetalles(certificado: Certificado): void {
    const estadoEmoji = certificado.estado === 'enviado' ? '✅' : 
                       certificado.estado === 'pendiente' ? '⏳' : '❌';
    
    const detalles = `
📋 DETALLES DEL CERTIFICADO
-------------------------
ID: ${certificado.id}
Alumno: ${certificado.alumno_nombre}
Promedio: ${certificado.promedio.toFixed(2)}
Ciclo escolar: ${certificado.ciclo}
Estado: ${estadoEmoji} ${this.estadoTexto(certificado.estado)}
Firma del maestro: ${certificado.maestro_firma}
Fecha: ${certificado.fecha_formateada || this.fechaBonita(certificado.fecha_creacion)}
-------------------------
${certificado.estado === 'enviado' ? 
  '✅ Este certificado está disponible para descargar' : 
  '⏳ Tu maestro aún no ha enviado este certificado'}
    `;
    
    alert(detalles);
  }

  // Aplicar filtros
  aplicarFiltros(): void {
    this.cargando = true;
    const url = `${this.apiBase}${this.estudianteId}/certificados`;
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        if (Array.isArray(resp)) {
          let certificadosFiltrados = resp;
          
          // Filtro por estado
          if (this.filtros.estado !== 'todos') {
            certificadosFiltrados = certificadosFiltrados.filter((c: any) => 
              c.estado === this.filtros.estado
            );
          }
          
          // Filtro por ciclo
          if (this.filtros.ciclo !== 'todos') {
            certificadosFiltrados = certificadosFiltrados.filter((c: any) => 
              c.ciclo === this.filtros.ciclo
            );
          }
          
          this.certificados = certificadosFiltrados.map((c: any) => ({
            id: Number(c.id) || 0,
            alumno_id: Number(c.alumno_id) || 0,
            alumno_nombre: c.alumno_nombre || 'Sin nombre',
            promedio: Number(c.promedio) || 0,
            ciclo: c.ciclo || 'Sin ciclo',
            maestro_firma: c.maestro_firma || 'Sin firma',
            estado: (c.estado || 'pendiente') as 'enviado' | 'pendiente' | 'cancelado',
            fecha_creacion: c.fecha_creacion || '',
            fecha_formateada: c.fecha_formateada || ''
          }));
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error aplicando filtros:', err);
        this.cargando = false;
        this.error = 'Error al aplicar filtros';
        this.mostrarError(this.error);
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

  // Recargar datos
  recargarDatos(): void {
    console.log('🔄 Recargando datos...');
    this.cargando = true;
    this.error = '';
    this.cargarDatosCompletos();
  }

  // ========================================
  // UTILIDADES
  // ========================================
  
  // Formatear número a string con 2 decimales
  private formatNumero(value: any): string {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return num.toFixed(2);
      }
    }
    
    return '0.00';
  }

  // Obtener color según el promedio
  getColorPromedio(promedio: number): string {
    if (promedio >= 9.5) return '#059669'; // Verde oscuro (excelente)
    if (promedio >= 9.0) return '#10b981'; // Verde (muy bueno)
    if (promedio >= 8.5) return '#34d399'; // Verde claro (bueno)
    if (promedio >= 8.0) return '#f59e0b'; // Amarillo (regular)
    if (promedio >= 7.0) return '#f97316'; // Naranja (aprobado)
    return '#ef4444'; // Rojo (bajo)
  }

  // Formatear fecha bonita
  fechaBonita(fecha: string): string {
    try {
      const fechaObj = new Date(fecha);
      
      if (isNaN(fechaObj.getTime())) {
        return fecha || 'Fecha no disponible';
      }
      
      return fechaObj.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return fecha || 'Fecha no disponible';
    }
  }

  // Texto del estado
  estadoTexto(estado: string): string {
    const estados: {[key: string]: string} = {
      'enviado': 'Enviado',
      'pendiente': 'Pendiente',
      'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
  }

  // Color del estado
  getColorEstado(estado: string): string {
    switch (estado) {
      case 'enviado': return '#10b981'; // Verde
      case 'pendiente': return '#f59e0b'; // Amarillo
      case 'cancelado': return '#ef4444'; // Rojo
      default: return '#6b7280'; // Gris
    }
  }

  // Mostrar error
  private mostrarError(mensaje: string): void {
    alert(`❌ ${mensaje}`);
  }

  // ========================================
  // DEBUGGING
  // ========================================
  verificarDatos(): void {
    console.log('🔍 VERIFICACIÓN DE DATOS:');
    console.log('ID del estudiante:', this.estudianteId);
    console.log('Certificados cargados:', this.certificados.length);
    console.log('Ciclos únicos:', this.ciclosUnicos);
    console.log('Estadísticas:', this.stats);
    console.log('Resumen completo:', this.resumen);
    console.log('Error actual:', this.error);
    
    if (this.certificados.length > 0) {
      console.log('Primer certificado:', this.certificados[0]);
    }
  }

  testBackend(): void {
    const testUrl = `${this.apiBase}test`;
    console.log('🧪 Probando conexión backend:', testUrl);
    
    this.http.get(testUrl).subscribe({
      next: (response) => {
        console.log('✅ Backend respondió:', response);
        alert('✅ Conexión con el backend exitosa');
      },
      error: (err) => {
        console.error('❌ Error conectando al backend:', err);
        alert('❌ No se pudo conectar al backend. Verifica que el servidor esté corriendo en http://localhost:3000');
      }
    });
  }
}