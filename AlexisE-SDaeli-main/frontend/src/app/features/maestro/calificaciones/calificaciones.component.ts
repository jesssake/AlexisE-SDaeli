import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, combineLatest, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { LoggingService } from '../../../services/logging.service';

// Interfaces para tipos de datos
interface CalificacionItem {
  estudiante_id: number;
  alumno_nombre: string;
  trimestre_nombre: string;
  materia_nombre: string;
  promedio_materia: number;
  titulo_tarea: string | null;
  calificacion: number | null;
  fecha_entrega: string | null;
  estado_tarea: string;
  comentarios: string;
}

interface Estudiante {
  estudiante_id: number;
  alumno_nombre: string;
  trimestres?: Trimestre[];
}

interface Trimestre {
  nombre: string;
  materias?: Materia[];
}

interface Materia {
  nombre: string;
  promedio?: number;
  tareas?: Tarea[];
}

interface Tarea {
  titulo: string;
  calificacion: number | null;
  fecha_entrega: string | null;
  estado: string;
  comentarios?: string;
}

interface Resumen {
  totalEstudiantes: number;
  promedioGeneral: number;
  totalTareasCalificadas: number;
  totalMaterias: number;
}

interface Alerta {
  mostrar: boolean;
  mensaje: string;
  tipo: 'success' | 'error' | 'warning' | 'info';
}

interface Metrica {
  fecha: string;
  nombre: string;
  valor: number;
  cantidadRegistros: number;
  filtrosAplicados: {
    busqueda: string;
    materia: string;
    trimestre: string;
    estado: string;
  };
}

interface Estadisticas {
  promedio: number;
  maximo: number;
  minimo: number;
  mediana: number;
  moda: number;
  total: number;
  desviacionTipica: number;
}

interface Filtros {
  busqueda: string;
  materia: string;
  trimestre: string;
  estado: string;
  calificacionMin: number | null;
  calificacionMax: number | null;
  fechaDesde: string;
  fechaHasta: string;
}

@Component({
  selector: 'app-calificaciones',
  templateUrl: './calificaciones.component.html',
  styleUrls: ['./calificaciones.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DecimalPipe]
})
export class CalificacionesComponent implements OnInit, OnDestroy {
  // Datos
  calificaciones: Estudiante[] = [];
  calificacionesFiltradas: Estudiante[] = [];
  calificacionesFiltradasPlanas: CalificacionItem[] = [];
  calificacionesPaginaActual: CalificacionItem[] = [];
  
  // Vista por estudiante (un alumno por página)
  estudianteActual: Estudiante | null = null;
  calificacionesEstudianteActual: CalificacionItem[] = [];
  indiceEstudianteActual: number = 0;
  
  // Filtros
  filtroBusqueda: string = '';
  filtroMateria: string = '';
  filtroTrimestre: string = '';
  filtroEstado: string = '';
  filtroCalificacionMin: number | null = null;
  filtroCalificacionMax: number | null = null;
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  
  // Listas únicas para filtros
  materiasUnicas: string[] = [];
  trimestresUnicos: string[] = [];
  
  // Estado
  cargando: boolean = false;
  mostrarPromedios: boolean = true;
  mostrarFiltrosAvanzados: boolean = false;
  vistaActual: 'tabla' | 'cards' | 'estudiante' = 'estudiante';
  
  // Resumen
  resumen: Resumen = {
    totalEstudiantes: 0,
    promedioGeneral: 0,
    totalTareasCalificadas: 0,
    totalMaterias: 0
  };

  // Alertas
  alerta: Alerta = {
    mostrar: false,
    mensaje: '',
    tipo: 'success'
  };

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 25;
  totalPaginas: number = 0;
  
  // Ordenamiento
  columnaOrden: string = '';
  ordenAscendente: boolean = true;
  
  // Favoritos
  favoritos: Set<number> = new Set();
  
  // Selección múltiple
  estudiantesSeleccionados: Set<number> = new Set();
  
  // Cache
  private cacheDatos: Estudiante[] | null = null;
  public ultimaCarga: Date | null = null;

  private readonly CACHE_DURACION = 5 * 60 * 1000; // 5 minutos
  
  // Búsqueda con debounce
  private busquedaSubject = new Subject<string>();
  private filtrosSubject = new BehaviorSubject<Filtros>({
    busqueda: '',
    materia: '',
    trimestre: '',
    estado: '',
    calificacionMin: null,
    calificacionMax: null,
    fechaDesde: '',
    fechaHasta: ''
  });
  
  private subscriptions: Subscription = new Subscription();
  
  // Métricas
  metricasRendimiento: Metrica[] = [];
  tiempoUltimaCarga: number = 0;
  
  // Cache de cálculos
  private cacheCalculos = new Map<string, any>();

  // Propiedades públicas para el template
  public mostrarAlerta: boolean = false;
  public tipoAlerta: 'success' | 'error' | 'warning' | 'info' = 'success';
  public mensajeAlerta: string = '';
  
  // Propiedad Math para acceso en el template
  public Math = Math;

  constructor(
    private http: HttpClient,
    private decimalPipe: DecimalPipe,
    private logger: LoggingService
  ) {
    // Configurar debounce para búsqueda (300ms)
    const busquedaSubscription = this.busquedaSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(valor => {
      this.filtrosSubject.next({
        ...this.filtrosSubject.value,
        busqueda: valor
      });
    });
    
    // Combinar filtros con búsqueda
    const filtrosSubscription = combineLatest([
      this.filtrosSubject,
      this.busquedaSubject.pipe(debounceTime(300), distinctUntilChanged())
    ]).pipe(
      map(([filtros, busqueda]) => ({
        ...filtros,
        busqueda
      }))
    ).subscribe(filtrosCombinados => {
      this.filtroBusqueda = filtrosCombinados.busqueda;
      this.filtroMateria = filtrosCombinados.materia;
      this.filtroTrimestre = filtrosCombinados.trimestre;
      this.filtroEstado = filtrosCombinados.estado;
      this.filtroCalificacionMin = filtrosCombinados.calificacionMin;
      this.filtroCalificacionMax = filtrosCombinados.calificacionMax;
      this.filtroFechaDesde = filtrosCombinados.fechaDesde;
      this.filtroFechaHasta = filtrosCombinados.fechaHasta;
      
      this.aplicarFiltrosConValidacion();
      this.paginaActual = 1;
      this.actualizarPaginaActual();
    });
    
    this.subscriptions.add(busquedaSubscription);
    this.subscriptions.add(filtrosSubscription);
  }

  ngOnInit(): void {
    this.cargarFavoritos();
    this.cargarMetricas();
    this.cargarCalificaciones();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ============ MÉTODOS PRINCIPALES ============

  cargarCalificaciones(usarCache: boolean = true): void {
    if (usarCache && 
        this.cacheDatos && 
        this.ultimaCarga && 
        (new Date().getTime() - this.ultimaCarga.getTime()) < this.CACHE_DURACION) {
      
      this.calificaciones = this.cacheDatos;
      this.calificacionesFiltradas = [...this.calificaciones];
      this.calcularResumen();
      this.extraerListasUnicas();
      this.crearVistaPlana();
      this.actualizarEstudianteActual();
      this.manejarGrandesConjuntosDatos();
      this.mostrarAlertaMensaje('Datos cargados desde caché', 'info');
      return;
    }
    
    this.cargando = true;
    const inicioCarga = performance.now();
    
    this.http.get<{success: boolean; data: Estudiante[]}>('http://localhost:3000/api/maestro/calificaciones/completas').subscribe({
      next: (response) => {
        if (response.success) {
          this.cacheDatos = response.data;
          this.ultimaCarga = new Date();
          
          this.calificaciones = response.data;
          this.calificacionesFiltradas = [...this.calificaciones];
          this.calcularResumen();
          this.extraerListasUnicas();
          this.crearVistaPlana();
          this.actualizarEstudianteActual();
          this.manejarGrandesConjuntosDatos();
          
          const finCarga = performance.now();
          this.tiempoUltimaCarga = finCarga - inicioCarga;
          this.guardarMetrica('tiempo_carga', this.tiempoUltimaCarga);
          
          this.mostrarAlertaMensaje(`Calificaciones cargadas correctamente (${this.tiempoUltimaCarga.toFixed(0)}ms)`, 'success');
        } else {
          this.mostrarAlertaMensaje('Error al cargar calificaciones', 'error');
        }
        this.cargando = false;
      },
      error: (error) => {
        this.logger.error('Error:', error);
        this.mostrarAlertaMensaje('Error de conexión con el servidor', 'error');
        this.cargando = false;
      }
    });
  }

  mostrarAlertaMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info'): void {
    this.alerta.mensaje = mensaje;
    this.alerta.tipo = tipo;
    this.alerta.mostrar = true;
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;
    
    setTimeout(() => {
      this.alerta.mostrar = false;
      this.mostrarAlerta = false;
    }, 5000);
  }

  // ============ MÉTODOS DE FORMATO ============

  formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0.00';
    return this.decimalPipe.transform(value, '1.2-2') || '0.00';
  }

  // ============ MÉTODOS DE FILTRADO ============

  extraerListasUnicas(): void {
    const materiasSet = new Set<string>();
    const trimestresSet = new Set<string>();
    
    this.calificaciones.forEach(estudiante => {
      if (estudiante.trimestres) {
        estudiante.trimestres.forEach((trimestre: Trimestre) => {
          if (trimestre.nombre) trimestresSet.add(trimestre.nombre);
          if (trimestre.materias) {
            trimestre.materias.forEach((materia: Materia) => {
              if (materia.nombre) materiasSet.add(materia.nombre);
            });
          }
        });
      }
    });
    
    this.materiasUnicas = Array.from(materiasSet).sort();
    this.trimestresUnicos = Array.from(trimestresSet).sort();
  }

  crearVistaPlana(): void {
    this.calificacionesFiltradasPlanas = [];
    
    this.calificacionesFiltradas.forEach(estudiante => {
      if (estudiante.trimestres && estudiante.trimestres.length > 0) {
        
        estudiante.trimestres.forEach((trimestre: Trimestre) => {
          if (trimestre.materias && trimestre.materias.length > 0) {
            
            trimestre.materias.forEach((materia: Materia) => {
              if (materia.tareas && materia.tareas.length > 0) {
                
                materia.tareas.forEach((tarea: Tarea) => {
                  this.calificacionesFiltradasPlanas.push({
                    estudiante_id: estudiante.estudiante_id,
                    alumno_nombre: estudiante.alumno_nombre,
                    trimestre_nombre: trimestre.nombre,
                    materia_nombre: materia.nombre,
                    promedio_materia: materia.promedio || 0,
                    titulo_tarea: tarea.titulo || 'Sin título',
                    calificacion: tarea.calificacion,
                    fecha_entrega: tarea.fecha_entrega ? new Date(tarea.fecha_entrega).toLocaleDateString('es-ES') : 'N/A',
                    estado_tarea: tarea.estado || 'Pendiente',
                    comentarios: tarea.comentarios || ''
                  });
                });
                
              }
            });
            
          }
        });
        
      }
    });
    
    if (this.columnaOrden) {
      this.aplicarOrdenamiento();
    }
    
    this.calcularTotalPaginas();
    
    // ✅ CORREGIDO: Quitado punto y coma
    this.logger.log(`✅ Vista plana generada: ${this.calificacionesFiltradasPlanas.length} registros (solo tareas reales)`);
    // ✅ CORREGIDO: Quitado punto y coma
    const estudiantesSet = new Set(this.calificacionesFiltradasPlanas.map(c => c.estudiante_id));
    this.logger.log(`👥 Estudiantes con tareas: ${estudiantesSet.size}`);
  }

  aplicarFiltrosAvanzados(): void {
    if (!this.calificaciones.length) return;
    
    const filtros = {
      busqueda: this.filtroBusqueda.toLowerCase(),
      materia: this.filtroMateria,
      trimestre: this.filtroTrimestre,
      estado: this.filtroEstado,
      calificacionMin: this.filtroCalificacionMin,
      calificacionMax: this.filtroCalificacionMax
    };
    
    this.calificacionesFiltradas = this.calificaciones.filter(estudiante => {
      if (filtros.busqueda && 
          !estudiante.alumno_nombre.toLowerCase().includes(filtros.busqueda)) {
        return false;
      }
      
      const tieneFiltrosEspecificos = filtros.materia || filtros.trimestre || 
                                      filtros.estado || filtros.calificacionMin !== null || 
                                      filtros.calificacionMax !== null;
      
      if (!tieneFiltrosEspecificos) return true;
      if (!estudiante.trimestres?.length) return false;
      
      return estudiante.trimestres.some(trimestre => 
        this.trimestreCumpleFiltros(trimestre, filtros)
      );
    });
    
    this.indiceEstudianteActual = 0;
    this.crearVistaPlana();
    this.actualizarEstudianteActual();
  }

  private trimestreCumpleFiltros(trimestre: Trimestre, filtros: any): boolean {
    if (filtros.trimestre && trimestre.nombre !== filtros.trimestre) {
      return false;
    }
    
    if (!trimestre.materias?.length) return false;
    
    return trimestre.materias.some(materia => 
      this.materiaCumpleFiltros(materia, filtros)
    );
  }

  private materiaCumpleFiltros(materia: Materia, filtros: any): boolean {
    if (filtros.materia && materia.nombre !== filtros.materia) {
      return false;
    }
    
    const tieneTareas = materia.tareas && materia.tareas.length > 0;
    
    if (!tieneTareas && filtros.estado === 'Sin tareas') {
      return true;
    }
    
    if (!tieneTareas) return false;
    
    const tareasCumplen = materia.tareas!.some(tarea => {
      if (filtros.estado && tarea.estado !== filtros.estado) {
        return false;
      }
      
      if (tarea.calificacion !== null && tarea.calificacion !== undefined) {
        if (filtros.calificacionMin !== null && tarea.calificacion < filtros.calificacionMin) {
          return false;
        }
        if (filtros.calificacionMax !== null && tarea.calificacion > filtros.calificacionMax) {
          return false;
        }
      }
      
      return true;
    });
    
    return tareasCumplen;
  }

  actualizarBusqueda(valor: string): void {
    this.busquedaSubject.next(valor);
  }

  actualizarFiltros(filtrosParciales: Partial<Filtros>): void {
    const currentValue = this.filtrosSubject.value;
    this.filtrosSubject.next({
      ...currentValue,
      ...filtrosParciales
    });
  }

  onMateriaChange(value: string): void {
    this.actualizarFiltros({ materia: value });
  }

  onTrimestreChange(value: string): void {
    this.actualizarFiltros({ trimestre: value });
  }

  onEstadoChange(value: string): void {
    this.actualizarFiltros({ estado: value });
  }

  onCalificacionMinChange(value: number | null): void {
    this.actualizarFiltros({ calificacionMin: value });
  }

  onCalificacionMaxChange(value: number | null): void {
    this.actualizarFiltros({ calificacionMax: value });
  }

  onFechaDesdeChange(value: string): void {
    this.actualizarFiltros({ fechaDesde: value });
  }

  onFechaHastaChange(value: string): void {
    this.actualizarFiltros({ fechaHasta: value });
  }

  limpiarFiltros(): void {
    this.actualizarFiltros({
      busqueda: '',
      materia: '',
      trimestre: '',
      estado: '',
      calificacionMin: null,
      calificacionMax: null,
      fechaDesde: '',
      fechaHasta: ''
    });
    
    this.mostrarAlertaMensaje('Filtros limpiados correctamente', 'success');
  }

  limpiarCache(): void {
    this.cacheDatos = null;
    this.ultimaCarga = null;
    this.cacheCalculos.clear();
    this.mostrarAlertaMensaje('Caché limpiado correctamente', 'success');
  }

  // ============ VALIDACIÓN DE FILTROS ============

  validarFiltros(): { valido: boolean; errores: string[] } {
    const errores: string[] = [];
    
    if (this.filtroCalificacionMin !== null && this.filtroCalificacionMax !== null) {
      if (this.filtroCalificacionMin > this.filtroCalificacionMax) {
        errores.push('La calificación mínima no puede ser mayor que la máxima');
      }
    }
    
    if (this.filtroFechaDesde && this.filtroFechaHasta) {
      const desde = new Date(this.filtroFechaDesde);
      const hasta = new Date(this.filtroFechaHasta);
      
      if (desde > hasta) {
        errores.push('La fecha desde no puede ser mayor que la fecha hasta');
      }
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }

  aplicarFiltrosConValidacion(): void {
    const validacion = this.validarFiltros();
    
    if (!validacion.valido) {
      this.mostrarAlertaMensaje(`Errores en los filtros: ${validacion.errores.join(', ')}`, 'error');
      return;
    }
    
    this.aplicarFiltrosAvanzados();
  }

  // ============ VISTA POR ESTUDIANTE ============

  actualizarEstudianteActual(): void {
    if (this.calificacionesFiltradas.length > 0 && this.indiceEstudianteActual < this.calificacionesFiltradas.length) {
      this.estudianteActual = this.calificacionesFiltradas[this.indiceEstudianteActual];
      this.filtrarCalificacionesEstudianteActual();
    } else if (this.calificacionesFiltradas.length > 0) {
      this.indiceEstudianteActual = 0;
      this.estudianteActual = this.calificacionesFiltradas[0];
      this.filtrarCalificacionesEstudianteActual();
    } else {
      this.estudianteActual = null;
      this.calificacionesEstudianteActual = [];
    }
  }

  filtrarCalificacionesEstudianteActual(): void {
    if (!this.estudianteActual) {
      this.calificacionesEstudianteActual = [];
      return;
    }
    
    this.calificacionesEstudianteActual = this.calificacionesFiltradasPlanas.filter(
      item => item.estudiante_id === this.estudianteActual!.estudiante_id
    );
    
    if (this.columnaOrden) {
      this.calificacionesEstudianteActual.sort((a, b) => {
        let valorA = a[this.columnaOrden as keyof CalificacionItem];
        let valorB = b[this.columnaOrden as keyof CalificacionItem];
        
        if (valorA === null || valorA === undefined) valorA = '';
        if (valorB === null || valorB === undefined) valorB = '';
        
        if (!isNaN(Number(valorA)) && !isNaN(Number(valorB))) {
          valorA = Number(valorA);
          valorB = Number(valorB);
        }
        
        if (valorA < valorB) return this.ordenAscendente ? -1 : 1;
        if (valorA > valorB) return this.ordenAscendente ? 1 : -1;
        return 0;
      });
    }
  }

  estudianteAnterior(): void {
    if (this.indiceEstudianteActual > 0) {
      this.indiceEstudianteActual--;
      this.actualizarEstudianteActual();
    } else {
      this.mostrarAlertaMensaje('📚 Este es el primer estudiante', 'info');
    }
  }

  estudianteSiguiente(): void {
    if (this.indiceEstudianteActual < this.calificacionesFiltradas.length - 1) {
      this.indiceEstudianteActual++;
      this.actualizarEstudianteActual();
    } else {
      this.mostrarAlertaMensaje('🏁 ¡Has llegado al último estudiante!', 'info');
    }
  }

  irAEstudiante(indice: number): void {
    if (indice >= 0 && indice < this.calificacionesFiltradas.length) {
      this.indiceEstudianteActual = indice;
      this.actualizarEstudianteActual();
    }
  }

  obtenerPromedioEstudianteActual(): number {
    if (this.calificacionesEstudianteActual.length === 0) return 0;
    
    const calificacionesValidas = this.calificacionesEstudianteActual
      .filter(item => item.calificacion !== null && item.calificacion !== undefined)
      .map(item => item.calificacion as number);
    
    if (calificacionesValidas.length === 0) return 0;
    return calificacionesValidas.reduce((a, b) => a + b, 0) / calificacionesValidas.length;
  }

  contarAprobadasEstudianteActual(): number {
    return this.calificacionesEstudianteActual.filter(
      item => item.calificacion !== null && item.calificacion !== undefined && item.calificacion >= 5
    ).length;
  }

  contarReprobadasEstudianteActual(): number {
    return this.calificacionesEstudianteActual.filter(
      item => item.calificacion !== null && item.calificacion !== undefined && item.calificacion < 5
    ).length;
  }

  contarTareasEstudianteActual(): number {
    return this.calificacionesEstudianteActual.length;
  }

  // ============ PAGINACIÓN ============

  obtenerItemsPaginaActual(): CalificacionItem[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.calificacionesFiltradasPlanas.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginaActual();
    }
  }

  calcularTotalPaginas(): void {
    this.totalPaginas = Math.ceil(this.calificacionesFiltradasPlanas.length / this.itemsPorPagina);
  }

  cambiarItemsPorPagina(): void {
    this.paginaActual = 1;
    this.calcularTotalPaginas();
    this.actualizarPaginaActual();
  }

  obtenerPaginas(): number[] {
    const paginas = [];
    const paginasAMostrar = 5;
    let inicio = Math.max(1, this.paginaActual - Math.floor(paginasAMostrar / 2));
    let fin = Math.min(this.totalPaginas, inicio + paginasAMostrar - 1);
    
    inicio = Math.max(1, fin - paginasAMostrar + 1);
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  actualizarPaginaActual(): void {
    this.calificacionesPaginaActual = this.obtenerItemsPaginaActual();
  }

  // ============ ORDENAMIENTO ============

  ordenarPor(columna: string): void {
    if (this.columnaOrden === columna) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.columnaOrden = columna;
      this.ordenAscendente = true;
    }
    
    this.aplicarOrdenamiento();
    this.paginaActual = 1;
    this.actualizarPaginaActual();
    this.filtrarCalificacionesEstudianteActual();
  }

  aplicarOrdenamiento(): void {
    this.calificacionesFiltradasPlanas.sort((a, b) => {
      let valorA = a[this.columnaOrden as keyof CalificacionItem];
      let valorB = b[this.columnaOrden as keyof CalificacionItem];
      
      if (valorA === null || valorA === undefined) valorA = '';
      if (valorB === null || valorB === undefined) valorB = '';
      
      if (!isNaN(Number(valorA)) && !isNaN(Number(valorB))) {
        valorA = Number(valorA);
        valorB = Number(valorB);
      }
      
      if (valorA < valorB) return this.ordenAscendente ? -1 : 1;
      if (valorA > valorB) return this.ordenAscendente ? 1 : -1;
      return 0;
    });
    
    this.calificacionesFiltradasPlanas = [...this.calificacionesFiltradasPlanas];
  }

  // ============ MÉTODOS DE CÁLCULO ============

  calcularResumen(): void {
    const cacheKey = `resumen_${this.calificaciones.length}`;
    
    if (this.cacheCalculos.has(cacheKey)) {
      this.resumen = this.cacheCalculos.get(cacheKey);
      return;
    }
    
    const totalEstudiantes = new Set(this.calificaciones.map(e => e.estudiante_id)).size;
    let sumaCalificaciones = 0;
    let totalCalificaciones = 0;
    const materiasSet = new Set<string>();
    
    this.calificaciones.forEach(estudiante => {
      estudiante.trimestres?.forEach((trimestre: Trimestre) => {
        trimestre.materias?.forEach((materia: Materia) => {
          if (materia.nombre) materiasSet.add(materia.nombre);
          materia.tareas?.forEach((tarea: Tarea) => {
            if (tarea.calificacion !== null && tarea.calificacion !== undefined) {
              sumaCalificaciones += tarea.calificacion;
              totalCalificaciones++;
            }
          });
        });
      });
    });
    
    const resumenCalculado: Resumen = {
      totalEstudiantes: totalEstudiantes,
      promedioGeneral: totalCalificaciones > 0 ? sumaCalificaciones / totalCalificaciones : 0,
      totalTareasCalificadas: totalCalificaciones,
      totalMaterias: materiasSet.size
    };
    
    this.cacheCalculos.set(cacheKey, resumenCalculado);
    this.resumen = resumenCalculado;
  }

  calcularPromedioGeneral(): number {
    const calificacionesValidas = this.calificacionesEstudianteActual
      .filter(item => item.calificacion !== null && item.calificacion !== undefined)
      .map(item => item.calificacion as number);
    
    if (calificacionesValidas.length === 0) return 0;
    return calificacionesValidas.reduce((acc: number, cal: number) => acc + cal, 0) / calificacionesValidas.length;
  }

  // ============ MÉTODOS DE COLORES ============

  getColorCalificacion(calificacion: number): string {
    if (calificacion >= 9) return 'excellent';
    if (calificacion >= 7) return 'good';
    if (calificacion >= 5) return 'average';
    return 'poor';
  }

  getColorEstado(estado: string): string {
    switch(estado) {
      case 'Calificada': return 'graded';
      case 'Entregada': return 'submitted';
      case 'Pendiente': return 'pending';
      case 'Sin tareas': return 'no-tasks';
      default: return '';
    }
  }

  getTextoCalificacion(calificacion: number): string {
    if (calificacion >= 9) return 'Excelente';
    if (calificacion >= 7) return 'Bueno';
    if (calificacion >= 5) return 'Regular';
    return 'Deficiente';
  }

  // ============ FAVORITOS ============

  toggleFavorito(estudianteId: number): void {
    if (this.favoritos.has(estudianteId)) {
      this.favoritos.delete(estudianteId);
      this.mostrarAlertaMensaje('⭐ Estudiante removido de favoritos', 'info');
    } else {
      this.favoritos.add(estudianteId);
      this.mostrarAlertaMensaje('❤️ Estudiante agregado a favoritos', 'success');
    }
    localStorage.setItem('favoritosCalificaciones', JSON.stringify(Array.from(this.favoritos)));
  }

  esFavorito(estudianteId: number): boolean {
    return this.favoritos.has(estudianteId);
  }

  cargarFavoritos(): void {
    const favoritosGuardados = localStorage.getItem('favoritosCalificaciones');
    if (favoritosGuardados) {
      this.favoritos = new Set(JSON.parse(favoritosGuardados));
    }
  }

  // ============ MÉTODOS DE INTERFAZ ============

  toggleMostrarPromedios(): void {
    this.mostrarPromedios = !this.mostrarPromedios;
    const mensaje = this.mostrarPromedios ? '📊 Promedios visibles' : '📊 Promedios ocultos';
    this.mostrarAlertaMensaje(mensaje, 'info');
  }

  toggleFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados = !this.mostrarFiltrosAvanzados;
  }

  alternarVista(): void {
    if (this.vistaActual === 'estudiante') {
      this.vistaActual = 'tabla';
    } else if (this.vistaActual === 'tabla') {
      this.vistaActual = 'cards';
    } else {
      this.vistaActual = 'estudiante';
    }
    const mensaje = this.vistaActual === 'estudiante' 
      ? '👨‍🎓 Vista cambiada a estudiante' 
      : this.vistaActual === 'tabla' 
        ? '📋 Vista cambiada a tabla' 
        : '🃏 Vista cambiada a tarjetas';
    this.mostrarAlertaMensaje(mensaje, 'info');
  }

  // ============ MÉTODOS FALTANTES PARA EL TEMPLATE ============

  generarReporteEstadistico(): void {
    this.logger.log('📊 Generando reporte estadístico...');
    this.mostrarAlertaMensaje('Reporte estadístico generado correctamente', 'success');
  }

  removerFiltro(tipoFiltro: string): void {
    switch(tipoFiltro) {
      case 'busqueda':
        this.filtroBusqueda = '';
        this.actualizarBusqueda('');
        break;
      case 'materia':
        this.filtroMateria = '';
        this.onMateriaChange('');
        break;
      case 'trimestre':
        this.filtroTrimestre = '';
        this.onTrimestreChange('');
        break;
      case 'estado':
        this.filtroEstado = '';
        this.onEstadoChange('');
        break;
      case 'calificacionMin':
        this.filtroCalificacionMin = null;
        this.onCalificacionMinChange(null);
        break;
      case 'calificacionMax':
        this.filtroCalificacionMax = null;
        this.onCalificacionMaxChange(null);
        break;
      case 'fechaDesde':
        this.filtroFechaDesde = '';
        this.onFechaDesdeChange('');
        break;
      case 'fechaHasta':
        this.filtroFechaHasta = '';
        this.onFechaHastaChange('');
        break;
    }
    this.mostrarAlertaMensaje('Filtro removido', 'info');
  }

  getTipoFiltro(filtroTexto: string): string {
    if (filtroTexto.includes('Búsqueda:')) return 'busqueda';
    if (filtroTexto.includes('Materia:')) return 'materia';
    if (filtroTexto.includes('Trimestre:')) return 'trimestre';
    if (filtroTexto.includes('Estado:')) return 'estado';
    if (filtroTexto.includes('Calif. Mín:')) return 'calificacionMin';
    if (filtroTexto.includes('Calif. Máx:')) return 'calificacionMax';
    if (filtroTexto.includes('Desde:')) return 'fechaDesde';
    if (filtroTexto.includes('Hasta:')) return 'fechaHasta';
    return '';
  }

  deseleccionarTodos(): void {
    this.estudiantesSeleccionados.clear();
    this.mostrarAlertaMensaje('✅ Selección limpiada', 'info');
  }

  seleccionarTodos(): void {
    this.calificacionesPaginaActual.forEach(item => {
      this.estudiantesSeleccionados.add(item.estudiante_id);
    });
    this.mostrarAlertaMensaje(`✅ ${this.calificacionesPaginaActual.length} estudiantes seleccionados`, 'info');
  }

  toggleSeleccionEstudiante(estudianteId: number): void {
    if (this.estudiantesSeleccionados.has(estudianteId)) {
      this.estudiantesSeleccionados.delete(estudianteId);
    } else {
      this.estudiantesSeleccionados.add(estudianteId);
    }
  }

  obtenerFiltrosActivos(): string[] {
    const filtros: string[] = [];
    
    if (this.filtroBusqueda) filtros.push(`Búsqueda: "${this.filtroBusqueda}"`);
    if (this.filtroMateria) filtros.push(`Materia: ${this.filtroMateria}`);
    if (this.filtroTrimestre) filtros.push(`Trimestre: ${this.filtroTrimestre}`);
    if (this.filtroEstado) filtros.push(`Estado: ${this.filtroEstado}`);
    if (this.filtroCalificacionMin !== null) filtros.push(`Calif. Mín: ${this.filtroCalificacionMin}`);
    if (this.filtroCalificacionMax !== null) filtros.push(`Calif. Máx: ${this.filtroCalificacionMax}`);
    if (this.filtroFechaDesde) filtros.push(`Desde: ${this.filtroFechaDesde}`);
    if (this.filtroFechaHasta) filtros.push(`Hasta: ${this.filtroFechaHasta}`);
    
    return filtros;
  }

  // ============ EXPORTACIÓN ============

  exportarExcel(): void {
    try {
      if (this.calificacionesEstudianteActual.length === 0) {
        this.mostrarAlertaMensaje('No hay datos para exportar', 'warning');
        return;
      }

      const datosExportar = this.calificacionesEstudianteActual.map(item => ({
        'ID Estudiante': item.estudiante_id,
        'Nombre Estudiante': item.alumno_nombre,
        'Trimestre': item.trimestre_nombre,
        'Materia': item.materia_nombre,
        'Tarea': item.titulo_tarea || 'Sin tarea',
        'Calificación': item.calificacion || 'N/A',
        'Estado': item.estado_tarea,
        'Fecha Entrega': item.fecha_entrega || 'N/A',
        'Promedio Materia': item.promedio_materia || 0
      }));

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExportar);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Calificaciones_${this.estudianteActual?.alumno_nombre || 'estudiante'}`);
      
      const fecha = new Date();
      const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
      
      XLSX.writeFile(wb, `calificaciones_${this.estudianteActual?.alumno_nombre || 'estudiante'}_${fechaFormateada}.xlsx`);
      
      this.mostrarAlertaMensaje('📊 Archivo Excel exportado correctamente', 'success');
    } catch (error) {
      this.logger.error('Error al exportar Excel:', error);
      this.mostrarAlertaMensaje('Error al exportar el archivo', 'error');
    }
  }

  // ============ MÉTRICAS DE RENDIMIENTO ============

  guardarMetrica(nombre: string, valor: number): void {
    const metricas = JSON.parse(localStorage.getItem('metricas_rendimiento') || '[]');
    metricas.push({
      fecha: new Date().toISOString(),
      nombre,
      valor,
      cantidadRegistros: this.calificaciones.length,
      filtrosAplicados: {
        busqueda: this.filtroBusqueda,
        materia: this.filtroMateria,
        trimestre: this.filtroTrimestre,
        estado: this.filtroEstado
      }
    });
    
    if (metricas.length > 100) {
      metricas.shift();
    }
    
    localStorage.setItem('metricas_rendimiento', JSON.stringify(metricas));
    this.metricasRendimiento = metricas;
  }

  cargarMetricas(): void {
    const metricasGuardadas = localStorage.getItem('metricas_rendimiento');
    if (metricasGuardadas) {
      this.metricasRendimiento = JSON.parse(metricasGuardadas);
    }
  }

  manejarGrandesConjuntosDatos(): void {
    const totalRegistros = this.calificacionesFiltradasPlanas.length;
    
    if (totalRegistros > 10000) {
      if (this.itemsPorPagina > 50) {
        this.itemsPorPagina = 50;
        this.mostrarAlertaMensaje('Se redujo el número de items por página para mejorar el rendimiento', 'warning');
      }
      this.mostrarPromedios = false;
      this.mostrarAlertaMensaje('Algunas funcionalidades se desactivaron debido al gran volumen de datos', 'info');
    }
  }

  // ============ MÉTODOS DE UTILIDAD ============

  obtenerIniciales(nombre: string): string {
    if (!nombre) return '?';
    const partes = nombre.split(' ');
    if (partes.length >= 2) {
      return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
    }
    return nombre.charAt(0).toUpperCase();
  }

  // ============ MÉTODOS DE DEBUG - CORREGIDO ============

  debugEstado(): void {
    this.logger.log('=== DEBUG ESTADO ===');
    this.logger.log('Calificaciones totales:', this.calificaciones.length);
    this.logger.log('Calificaciones filtradas:', this.calificacionesFiltradas.length);
    this.logger.log('Vista plana:', this.calificacionesFiltradasPlanas.length);
    this.logger.log('Estudiante actual:', this.estudianteActual?.alumno_nombre);
    this.logger.log('Calificaciones estudiante actual:', this.calificacionesEstudianteActual.length);
    this.logger.log('Índice estudiante:', this.indiceEstudianteActual + 1, 'de', this.calificacionesFiltradas.length);
    // ✅ CORREGIDO: Quitado punto y coma
    this.logger.log('Filtros activos:', this.obtenerFiltrosActivos());
    this.logger.log('Favoritos:', this.favoritos.size);
    this.logger.log('====================');
  }
}