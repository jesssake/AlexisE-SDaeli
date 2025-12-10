import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, combineLatest, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import * as XLSX from 'xlsx';

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
  vistaActual: 'tabla' | 'cards' = 'tabla';
  
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
    private decimalPipe: DecimalPipe
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
    // Verificar si hay datos en cache y si no han expirado
    if (usarCache && 
        this.cacheDatos && 
        this.ultimaCarga && 
        (new Date().getTime() - this.ultimaCarga.getTime()) < this.CACHE_DURACION) {
      
      this.calificaciones = this.cacheDatos;
      this.calificacionesFiltradas = [...this.calificaciones];
      this.calcularResumen();
      this.extraerListasUnicas();
      this.crearVistaPlana();
      this.actualizarPaginaActual();
      this.manejarGrandesConjuntosDatos();
      this.mostrarAlertaMensaje('Datos cargados desde caché', 'info');
      return;
    }
    
    this.cargando = true;
    const inicioCarga = performance.now();
    
    this.http.get<{success: boolean; data: Estudiante[]}>('http://localhost:3000/api/maestro/calificaciones/completas').subscribe({
      next: (response) => {
        if (response.success) {
          // Guardar en cache
          this.cacheDatos = response.data;
          this.ultimaCarga = new Date();
          
          this.calificaciones = response.data;
          this.calificacionesFiltradas = [...this.calificaciones];
          this.calcularResumen();
          this.extraerListasUnicas();
          this.crearVistaPlana();
          this.actualizarPaginaActual();
          this.manejarGrandesConjuntosDatos();
          
          // Calcular tiempo de carga
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
        console.error('Error:', error);
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
    
    // Ocultar automáticamente después de 5 segundos
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
    if (estudiante.trimestres) {
      estudiante.trimestres.forEach((trimestre: Trimestre) => {
        if (trimestre.materias) {
          trimestre.materias.forEach((materia: Materia) => {
            // Verificar si materia.tareas existe y tiene elementos
            if (materia.tareas && materia.tareas.length > 0) {
              materia.tareas.forEach((tarea: Tarea) => {
                this.calificacionesFiltradasPlanas.push({
                  estudiante_id: estudiante.estudiante_id,
                  alumno_nombre: estudiante.alumno_nombre,
                  trimestre_nombre: trimestre.nombre,
                  materia_nombre: materia.nombre,
                  promedio_materia: materia.promedio || 0,
                  titulo_tarea: tarea.titulo,
                  calificacion: tarea.calificacion,
                  fecha_entrega: tarea.fecha_entrega ? new Date(tarea.fecha_entrega).toLocaleDateString('es-ES') : 'N/A',
                  estado_tarea: tarea.estado,
                  comentarios: tarea.comentarios || ''
                });
              });
            } else {
              // Si no hay tareas o tareas es undefined
              this.calificacionesFiltradasPlanas.push({
                estudiante_id: estudiante.estudiante_id,
                alumno_nombre: estudiante.alumno_nombre,
                trimestre_nombre: trimestre.nombre,
                materia_nombre: materia.nombre,
                promedio_materia: materia.promedio || 0,
                titulo_tarea: null,
                calificacion: null,
                fecha_entrega: null,
                estado_tarea: 'Sin tareas',
                comentarios: ''
              });
            }
          });
        }
      });
    }
  });
  
  // Aplicar ordenamiento si hay una columna seleccionada
  if (this.columnaOrden) {
    this.aplicarOrdenamiento();
  }
  
  // Calcular paginación
  this.calcularTotalPaginas();
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
      // Filtro por nombre
      if (filtros.busqueda && 
          !estudiante.alumno_nombre.toLowerCase().includes(filtros.busqueda)) {
        return false;
      }
      
      // Si hay filtros específicos
      const tieneFiltrosEspecificos = filtros.materia || filtros.trimestre || 
                                      filtros.estado || filtros.calificacionMin !== null || 
                                      filtros.calificacionMax !== null;
      
      if (!tieneFiltrosEspecificos) return true;
      if (!estudiante.trimestres?.length) return false;
      
      return estudiante.trimestres.some(trimestre => 
        this.trimestreCumpleFiltros(trimestre, filtros)
      );
    });
    
    this.crearVistaPlana();
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
  
  // Verificar si no hay tareas y el filtro es "Sin tareas"
  const tieneTareas = materia.tareas && materia.tareas.length > 0;
  
  if (!tieneTareas && filtros.estado === 'Sin tareas') {
    return true;
  }
  
  if (!tieneTareas) return false;
  
  // Si hay tareas, verificar que cumplan los filtros
  const tareasCumplen = materia.tareas!.some(tarea => {
    // Filtro por estado
    if (filtros.estado && tarea.estado !== filtros.estado) {
      return false;
    }
    
    // Filtro por calificación
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

  // Métodos de actualización para el template
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
    
    // Validar rango de calificaciones
    if (this.filtroCalificacionMin !== null && this.filtroCalificacionMax !== null) {
      if (this.filtroCalificacionMin > this.filtroCalificacionMax) {
        errores.push('La calificación mínima no puede ser mayor que la máxima');
      }
    }
    
    // Validar rango de fechas
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
  }

  aplicarOrdenamiento(): void {
    this.calificacionesFiltradasPlanas.sort((a, b) => {
      let valorA = a[this.columnaOrden as keyof CalificacionItem];
      let valorB = b[this.columnaOrden as keyof CalificacionItem];
      
      // Manejar valores nulos y diferentes tipos
      if (valorA === null || valorA === undefined) valorA = '';
      if (valorB === null || valorB === undefined) valorB = '';
      
      // Si son números, comparar numéricamente
      if (!isNaN(Number(valorA)) && !isNaN(Number(valorB))) {
        valorA = Number(valorA);
        valorB = Number(valorB);
      }
      
      // Comparación
      if (valorA < valorB) return this.ordenAscendente ? -1 : 1;
      if (valorA > valorB) return this.ordenAscendente ? 1 : -1;
      return 0;
    });
    
    // Crear nueva referencia para activar el change detection
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

  calcularPromedioEstudiante(estudiante: Estudiante): number {
    let suma = 0;
    let count = 0;
    
    estudiante.trimestres?.forEach((trimestre: Trimestre) => {
      trimestre.materias?.forEach((materia: Materia) => {
        if (materia.promedio) {
          suma += materia.promedio;
          count++;
        }
      });
    });
    
    return count > 0 ? suma / count : 0;
  }

  contarTareasEstudiante(estudiante: Estudiante): number {
    let total = 0;
    estudiante.trimestres?.forEach((trimestre: Trimestre) => {
      trimestre.materias?.forEach((materia: Materia) => {
        total += materia.tareas?.length || 0;
      });
    });
    return total;
  }

  contarMateriasTrimestre(trimestre: Trimestre): number {
    return trimestre.materias?.length || 0;
  }

  calcularPromedioTareas(tareas: Tarea[]): number {
    const tareasCalificadas = tareas.filter(t => t.calificacion !== null && t.calificacion !== undefined);
    if (tareasCalificadas.length === 0) return 0;
    return tareasCalificadas.reduce((acc: number, t: Tarea) => acc + (t.calificacion || 0), 0) / tareasCalificadas.length;
  }

  contarTareasEntregadas(tareas: Tarea[]): number {
    return tareas.filter(t => t.estado === 'Entregada' || t.estado === 'Calificada').length;
  }

  calcularPromedioGeneral(): number {
    const calificacionesValidas = this.calificacionesFiltradasPlanas
      .filter(item => item.calificacion !== null && item.calificacion !== undefined)
      .map(item => item.calificacion as number);
    
    if (calificacionesValidas.length === 0) return 0;
    return calificacionesValidas.reduce((acc: number, cal: number) => acc + cal, 0) / calificacionesValidas.length;
  }

  // ============ MÉTODOS DE COLORES ============

  getColorCalificacion(calificacion: number): string {
    if (calificacion >= 9) return 'bg-primary';
    if (calificacion >= 7) return 'bg-success';
    if (calificacion >= 5) return 'bg-warning';
    return 'bg-danger';
  }

  getColorEstado(estado: string): string {
    switch(estado) {
      case 'Calificada': return 'bg-success';
      case 'Entregada': return 'bg-info';
      case 'Pendiente': return 'bg-warning';
      case 'Sin tareas': return 'bg-gray-200 text-gray-700';
      default: return 'bg-secondary';
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
      this.mostrarAlertaMensaje('Estudiante removido de favoritos', 'info');
    } else {
      this.favoritos.add(estudianteId);
      this.mostrarAlertaMensaje('Estudiante agregado a favoritos', 'success');
    }
    // Guardar en localStorage
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

  agregarFavoritosEnLote(): void {
    if (this.estudiantesSeleccionados.size === 0) {
      this.mostrarAlertaMensaje('No hay estudiantes seleccionados', 'warning');
      return;
    }
    
    this.estudiantesSeleccionados.forEach(id => this.favoritos.add(id));
    localStorage.setItem('favoritosCalificaciones', JSON.stringify(Array.from(this.favoritos)));
    
    this.mostrarAlertaMensaje(`${this.estudiantesSeleccionados.size} estudiantes agregados a favoritos`, 'success');
  }

  // ============ SELECCIÓN MÚLTIPLE ============

  toggleSeleccionEstudiante(estudianteId: number): void {
    if (this.estudiantesSeleccionados.has(estudianteId)) {
      this.estudiantesSeleccionados.delete(estudianteId);
    } else {
      this.estudiantesSeleccionados.add(estudianteId);
    }
  }

  seleccionarTodos(): void {
    const ids = this.calificacionesPaginaActual.map(item => item.estudiante_id);
    ids.forEach(id => this.estudiantesSeleccionados.add(id));
    this.mostrarAlertaMensaje(`${ids.length} estudiantes seleccionados`, 'info');
  }

  deseleccionarTodos(): void {
    this.estudiantesSeleccionados.clear();
    this.mostrarAlertaMensaje('Selección limpiada', 'info');
  }

  realizarAccionEnLote(accion: string): void {
    if (this.estudiantesSeleccionados.size === 0) {
      this.mostrarAlertaMensaje('No hay estudiantes seleccionados', 'warning');
      return;
    }
    
    switch(accion) {
      case 'exportar':
        this.exportarEstudiantesSeleccionados();
        break;
      case 'favoritos':
        this.agregarFavoritosEnLote();
        break;
      case 'reporte':
        this.generarReporteSeleccionados();
        break;
    }
  }

  // ============ EXPORTACIÓN ============

  exportarDatos(formato: 'excel' | 'csv' | 'json'): void {
    switch(formato) {
      case 'excel':
        this.exportarExcel();
        break;
      case 'csv':
        this.exportarCSV();
        break;
      case 'json':
        this.exportarJSON();
        break;
    }
  }

  exportarPaginaActual(formato: 'excel' | 'csv' | 'json'): void {
    if (this.calificacionesPaginaActual.length === 0) {
      this.mostrarAlertaMensaje('No hay datos en la página actual para exportar', 'warning');
      return;
    }
    
    switch(formato) {
      case 'excel':
        this.exportarExcel(this.calificacionesPaginaActual);
        break;
      case 'csv':
        this.exportarCSV(this.calificacionesPaginaActual);
        break;
      case 'json':
        this.exportarJSON(this.calificacionesPaginaActual);
        break;
    }
  }

  exportarEstudiantesSeleccionados(): void {
    const estudiantesFiltrados = this.calificacionesFiltradasPlanas.filter(item =>
      this.estudiantesSeleccionados.has(item.estudiante_id)
    );
    
    if (estudiantesFiltrados.length === 0) {
      this.mostrarAlertaMensaje('No hay datos para exportar', 'warning');
      return;
    }
    
    this.exportarExcel(estudiantesFiltrados);
    this.mostrarAlertaMensaje(`Exportados ${estudiantesFiltrados.length} estudiantes seleccionados`, 'success');
  }

  exportarExcel(datos?: CalificacionItem[]): void {
    try {
      const datosAExportar = datos || this.calificacionesFiltradasPlanas;
      
      if (datosAExportar.length === 0) {
        this.mostrarAlertaMensaje('No hay datos para exportar', 'warning');
        return;
      }

      // Preparar datos para Excel con formato mejorado
      const datosExportar = this.prepararDatosExportacion(datosAExportar);

      // Crear hoja de cálculo
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExportar);
      
      // Ajustar ancho de columnas
      const wscols = [
        { wch: 10 }, // ID Estudiante
        { wch: 25 }, // Nombre Estudiante
        { wch: 15 }, // Trimestre
        { wch: 20 }, // Materia
        { wch: 15 }, // Promedio Materia
        { wch: 30 }, // Tarea
        { wch: 12 }, // Calificación
        { wch: 12 }, // Estado
        { wch: 15 }, // Fecha Entrega
        { wch: 30 }, // Comentarios
        { wch: 12 }  // Nivel
      ];
      ws['!cols'] = wscols;

      // Crear libro de trabajo
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones');
      
      // Formato de fecha para el nombre del archivo
      const fecha = new Date();
      const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
      const horaFormateada = `${fecha.getHours().toString().padStart(2, '0')}${fecha.getMinutes().toString().padStart(2, '0')}`;
      
      // Exportar archivo
      XLSX.writeFile(wb, `calificaciones_${fechaFormateada}_${horaFormateada}.xlsx`);
      
      this.mostrarAlertaMensaje('Archivo Excel exportado correctamente', 'success');
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      this.mostrarAlertaMensaje('Error al exportar el archivo', 'error');
    }
  }

  exportarCSV(datos?: CalificacionItem[]): void {
    try {
      const datosAExportar = datos || this.calificacionesFiltradasPlanas;
      
      if (datosAExportar.length === 0) {
        this.mostrarAlertaMensaje('No hay datos para exportar', 'warning');
        return;
      }

      const datosParaCSV = this.prepararDatosExportacion(datosAExportar);
      const csvContent = this.convertirACSV(datosParaCSV);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fecha = new Date();
      const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', `calificaciones_${fechaFormateada}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.mostrarAlertaMensaje('Archivo CSV exportado correctamente', 'success');
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      this.mostrarAlertaMensaje('Error al exportar el archivo', 'error');
    }
  }

  exportarJSON(datos?: CalificacionItem[]): void {
    try {
      const datosAExportar = datos || this.calificacionesFiltradasPlanas;
      
      if (datosAExportar.length === 0) {
        this.mostrarAlertaMensaje('No hay datos para exportar', 'warning');
        return;
      }

      const jsonContent = JSON.stringify(datosAExportar, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fecha = new Date();
      const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', `calificaciones_${fechaFormateada}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.mostrarAlertaMensaje('Archivo JSON exportado correctamente', 'success');
    } catch (error) {
      console.error('Error al exportar JSON:', error);
      this.mostrarAlertaMensaje('Error al exportar el archivo', 'error');
    }
  }

  prepararDatosExportacion(datos: CalificacionItem[]): any[] {
    return datos.map(item => ({
      'ID Estudiante': item.estudiante_id,
      'Nombre Estudiante': item.alumno_nombre,
      'Trimestre': item.trimestre_nombre,
      'Materia': item.materia_nombre,
      'Promedio Materia': item.promedio_materia || 0,
      'Tarea': item.titulo_tarea || 'Sin tarea',
      'Calificación': item.calificacion || 'N/A',
      'Estado': item.estado_tarea,
      'Fecha Entrega': item.fecha_entrega || 'N/A',
      'Comentarios': item.comentarios || '',
      'Nivel': item.calificacion ? this.getTextoCalificacion(item.calificacion) : 'N/A'
    }));
  }

  convertirACSV(datos: any[]): string {
    if (datos.length === 0) return '';
    
    const headers = Object.keys(datos[0]);
    const rows = datos.map(item => 
      headers.map(header => {
        const value = item[header];
        // Escapar comillas y añadir comillas si contiene comas o comillas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
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

  obtenerColorAleatorio(nombre: string): string {
    const colores = [
      'bg-primary', 'bg-success', 'bg-info', 'bg-warning', 
      'bg-danger', 'bg-secondary', 'bg-dark'
    ];
    
    // Usar el nombre para obtener un índice consistente
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colores[Math.abs(hash) % colores.length];
  }

  // ============ MÉTODOS DE ESTADÍSTICAS ============

  obtenerEstadisticasMateria(materiaNombre: string): any {
    const tareasMateria = this.calificacionesFiltradasPlanas.filter(
      item => item.materia_nombre === materiaNombre && item.calificacion
    );
    
    if (tareasMateria.length === 0) return null;
    
    const calificaciones = tareasMateria.map(item => item.calificacion as number);
    const promedio = calificaciones.reduce((sum: number, val: number) => sum + val, 0) / calificaciones.length;
    const max = Math.max(...calificaciones);
    const min = Math.min(...calificaciones);
    
    return {
      materia: materiaNombre,
      promedio: promedio,
      maximo: max,
      minimo: min,
      totalEstudiantes: new Set(tareasMateria.map(item => item.estudiante_id)).size,
      totalTareas: tareasMateria.length
    };
  }

  obtenerDistribucionCalificaciones(): any[] {
    const rangos = [
      { rango: '9-10', min: 9, max: 10, count: 0, color: 'bg-primary' },
      { rango: '7-8.9', min: 7, max: 8.9, count: 0, color: 'bg-success' },
      { rango: '5-6.9', min: 5, max: 6.9, count: 0, color: 'bg-warning' },
      { rango: '0-4.9', min: 0, max: 4.9, count: 0, color: 'bg-danger' }
    ];
    
    this.calificacionesFiltradasPlanas.forEach(item => {
      if (item.calificacion !== null && item.calificacion !== undefined) {
        for (const rango of rangos) {
          if (item.calificacion >= rango.min && item.calificacion <= rango.max) {
            rango.count++;
            break;
          }
        }
      }
    });
    
    return rangos;
  }

  obtenerEstadisticasCompletas(): {
    generales: Resumen;
    porMateria: any[];
    porTrimestre: any[];
    distribucion: any[];
  } {
    return {
      generales: this.resumen,
      porMateria: this.materiasUnicas.map(materia => 
        this.obtenerEstadisticasMateria(materia)
      ).filter(Boolean),
      porTrimestre: this.trimestresUnicos.map(trimestre =>
        this.obtenerEstadisticasTrimestre(trimestre)
      ).filter(Boolean),
      distribucion: this.obtenerDistribucionCalificaciones()
    };
  }

  generarReporteEstadistico(): void {
    const estadisticas = this.obtenerEstadisticasCompletas();
    const reporte = {
      fechaGeneracion: new Date().toISOString(),
      totalRegistros: this.calificacionesFiltradasPlanas.length,
      filtrosAplicados: this.obtenerFiltrosActivos(),
      estadisticas
    };
    
    const jsonContent = JSON.stringify(reporte, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_estadistico_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.mostrarAlertaMensaje('Reporte estadístico generado correctamente', 'success');
  }

  generarReporteSeleccionados(): void {
    if (this.estudiantesSeleccionados.size === 0) {
      this.mostrarAlertaMensaje('No hay estudiantes seleccionados', 'warning');
      return;
    }
    
    const estudiantesFiltrados = this.calificacionesFiltradasPlanas.filter(item =>
      this.estudiantesSeleccionados.has(item.estudiante_id)
    );
    
    const reporte = {
      fechaGeneracion: new Date().toISOString(),
      totalEstudiantes: this.estudiantesSeleccionados.size,
      estudiantes: Array.from(this.estudiantesSeleccionados),
      datos: estudiantesFiltrados,
      resumen: {
        totalRegistros: estudiantesFiltrados.length,
        promedioCalificaciones: this.calcularPromedioDeLista(estudiantesFiltrados.map(e => e.calificacion)),
        materiasUnicas: new Set(estudiantesFiltrados.map(e => e.materia_nombre)).size
      }
    };
    
    const jsonContent = JSON.stringify(reporte, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_seleccionados_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.mostrarAlertaMensaje(`Reporte de ${this.estudiantesSeleccionados.size} estudiantes generado`, 'success');
  }

  private calcularPromedioDeLista(valores: (number | null)[]): number {
    const valoresValidos = valores.filter(v => v !== null && v !== undefined) as number[];
    if (valoresValidos.length === 0) return 0;
    return valoresValidos.reduce((a, b) => a + b, 0) / valoresValidos.length;
  }

  // ============ MÉTODOS DE VALIDACIÓN ============

  validarCalificacion(calificacion: number): boolean {
    return calificacion >= 0 && calificacion <= 10;
  }

  esCalificacionAprobatoria(calificacion: number): boolean {
    return calificacion >= 5;
  }

  // ============ MÉTODOS DE INTERFAZ ============

  toggleMostrarPromedios(): void {
    this.mostrarPromedios = !this.mostrarPromedios;
    const mensaje = this.mostrarPromedios 
      ? 'Promedios visibles' 
      : 'Promedios ocultos';
    this.mostrarAlertaMensaje(mensaje, 'info');
  }

  toggleFiltrosAvanzados(): void {
    this.mostrarFiltrosAvanzados = !this.mostrarFiltrosAvanzados;
  }

  alternarVista(): void {
    this.vistaActual = this.vistaActual === 'tabla' ? 'cards' : 'tabla';
    const mensaje = this.vistaActual === 'tabla' 
      ? 'Vista cambiada a tabla' 
      : 'Vista cambiada a tarjetas';
    this.mostrarAlertaMensaje(mensaje, 'info');
  }

  copiarPortapapeles(): void {
    try {
      const datosTexto = this.calificacionesFiltradasPlanas.map(item => 
        `${item.alumno_nombre}\t${item.materia_nombre}\t${item.calificacion || 'N/A'}\t${item.estado_tarea}`
      ).join('\n');
      
      navigator.clipboard.writeText(datosTexto).then(() => {
        this.mostrarAlertaMensaje('Datos copiados al portapapeles', 'success');
      });
    } catch (error) {
      this.mostrarAlertaMensaje('Error al copiar datos', 'error');
    }
  }

  // ============ MÉTODOS ADICIONALES ============

  obtenerResumenFiltrado(): any {
    const calificacionesValidas = this.calificacionesFiltradasPlanas
      .filter(item => item.calificacion !== null && item.calificacion !== undefined)
      .map(item => item.calificacion as number);
    
    const estudiantesUnicos = new Set(
      this.calificacionesFiltradasPlanas.map(item => item.estudiante_id)
    ).size;
    
    const materiasUnicas = new Set(
      this.calificacionesFiltradasPlanas.map(item => item.materia_nombre)
    ).size;
    
    return {
      totalRegistros: this.calificacionesFiltradasPlanas.length,
      totalEstudiantes: estudiantesUnicos,
      totalMaterias: materiasUnicas,
      promedio: calificacionesValidas.length > 0 
        ? calificacionesValidas.reduce((acc: number, cal: number) => acc + cal, 0) / calificacionesValidas.length 
        : 0,
      totalCalificadas: calificacionesValidas.length
    };
  }

  contarPorEstado(): { [key: string]: number } {
    const estados: { [key: string]: number } = {};
    
    this.calificacionesFiltradasPlanas.forEach(item => {
      const estado = item.estado_tarea;
      estados[estado] = (estados[estado] || 0) + 1;
    });
    
    return estados;
  }

  obtenerTopEstudiantes(limite: number = 5): Array<{
    id: number;
    nombre: string;
    calificaciones: number[];
    promedio: number;
  }> {
    const estudiantesMap = new Map<number, {
      id: number;
      nombre: string;
      calificaciones: number[];
      promedio: number;
    }>();
    
    this.calificacionesFiltradasPlanas.forEach(item => {
      if (item.calificacion) {
        if (!estudiantesMap.has(item.estudiante_id)) {
          estudiantesMap.set(item.estudiante_id, {
            id: item.estudiante_id,
            nombre: item.alumno_nombre,
            calificaciones: [],
            promedio: 0
          });
        }
        estudiantesMap.get(item.estudiante_id)!.calificaciones.push(item.calificacion);
      }
    });
    
    // Calcular promedio por estudiante
    const estudiantesArray = Array.from(estudiantesMap.values()).map(est => ({
      ...est,
      promedio: est.calificaciones.reduce((a: number, b: number) => a + b, 0) / est.calificaciones.length
    }));
    
    // Ordenar por promedio descendente
    return estudiantesArray
      .sort((a, b) => b.promedio - a.promedio)
      .slice(0, limite);
  }

  // ============ MÉTODOS NUEVOS UTILES ============

  obtenerEstadisticasTrimestre(trimestreNombre: string): any {
    const tareasTrimestre = this.calificacionesFiltradasPlanas.filter(
      item => item.trimestre_nombre === trimestreNombre && item.calificacion
    );
    
    if (tareasTrimestre.length === 0) return null;
    
    const calificaciones = tareasTrimestre.map(item => item.calificacion as number);
    const promedio = calificaciones.reduce((sum: number, val: number) => sum + val, 0) / calificaciones.length;
    
    const materias = new Set(tareasTrimestre.map(item => item.materia_nombre));
    const estudiantes = new Set(tareasTrimestre.map(item => item.estudiante_id));
    
    return {
      trimestre: trimestreNombre,
      promedio: promedio,
      totalMaterias: materias.size,
      totalEstudiantes: estudiantes.size,
      totalTareas: tareasTrimestre.length,
      calificacionMaxima: Math.max(...calificaciones),
      calificacionMinima: Math.min(...calificaciones)
    };
  }

  obtenerEstudiantesConCalificacionesBajas(limiteInferior: number = 5): any[] {
    const estudiantesMap = new Map<number, {
      id: number;
      nombre: string;
      calificacionesBajas: number[];
      promedio: number;
      materias: Set<string>;
    }>();
    
    this.calificacionesFiltradasPlanas.forEach(item => {
      if (item.calificacion && item.calificacion < limiteInferior) {
        if (!estudiantesMap.has(item.estudiante_id)) {
          estudiantesMap.set(item.estudiante_id, {
            id: item.estudiante_id,
            nombre: item.alumno_nombre,
            calificacionesBajas: [],
            promedio: 0,
            materias: new Set<string>()
          });
        }
        const estudiante = estudiantesMap.get(item.estudiante_id)!;
        estudiante.calificacionesBajas.push(item.calificacion);
        estudiante.materias.add(item.materia_nombre);
      }
    });
    
    // Calcular promedio de calificaciones bajas
    const estudiantesArray = Array.from(estudiantesMap.values()).map(est => ({
      ...est,
      promedio: est.calificacionesBajas.reduce((a: number, b: number) => a + b, 0) / est.calificacionesBajas.length,
      totalCalificacionesBajas: est.calificacionesBajas.length,
      totalMateriasBajas: est.materias.size
    }));
    
    // Ordenar por promedio ascendente (los peores primero)
    return estudiantesArray
      .sort((a, b) => a.promedio - b.promedio);
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
    
    // Mantener solo las últimas 100 métricas
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

  obtenerPromedioTiempoCarga(): number {
    if (this.metricasRendimiento.length === 0) return 0;
    
    const metricasCarga = this.metricasRendimiento
      .filter((m: Metrica) => m.nombre === 'tiempo_carga')
      .map((m: Metrica) => m.valor);
    
    if (metricasCarga.length === 0) return 0;
    
    return metricasCarga.reduce((a: number, b: number) => a + b, 0) / metricasCarga.length;
  }

  // ============ FILTROS ACTIVOS ============

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

  removerFiltro(filtroTipo: string): void {
    switch(filtroTipo) {
      case 'busqueda':
        this.actualizarFiltros({ busqueda: '' });
        break;
      case 'materia':
        this.actualizarFiltros({ materia: '' });
        break;
      case 'trimestre':
        this.actualizarFiltros({ trimestre: '' });
        break;
      case 'estado':
        this.actualizarFiltros({ estado: '' });
        break;
      case 'calificacionMin':
        this.actualizarFiltros({ calificacionMin: null });
        break;
      case 'calificacionMax':
        this.actualizarFiltros({ calificacionMax: null });
        break;
      case 'fechaDesde':
        this.actualizarFiltros({ fechaDesde: '' });
        break;
      case 'fechaHasta':
        this.actualizarFiltros({ fechaHasta: '' });
        break;
    }
  }

  getTipoFiltro(filtroTexto: string): string {
    if (filtroTexto.startsWith('Búsqueda:')) return 'busqueda';
    if (filtroTexto.startsWith('Materia:')) return 'materia';
    if (filtroTexto.startsWith('Trimestre:')) return 'trimestre';
    if (filtroTexto.startsWith('Estado:')) return 'estado';
    if (filtroTexto.startsWith('Calif. Mín:')) return 'calificacionMin';
    if (filtroTexto.startsWith('Calif. Máx:')) return 'calificacionMax';
    if (filtroTexto.startsWith('Desde:')) return 'fechaDesde';
    if (filtroTexto.startsWith('Hasta:')) return 'fechaHasta';
    return '';
  }

  // ============ ESTADÍSTICAS EN TIEMPO REAL ============

  obtenerEstadisticasTiempoReal(): Estadisticas | null {
    const calificacionesValidas = this.calificacionesPaginaActual
      .filter(item => item.calificacion !== null && item.calificacion !== undefined)
      .map(item => item.calificacion as number);
    
    if (calificacionesValidas.length === 0) return null;
    
    const promedio = calificacionesValidas.reduce((a: number, b: number) => a + b, 0) / calificacionesValidas.length;
    const max = Math.max(...calificacionesValidas);
    const min = Math.min(...calificacionesValidas);
    
    // Calcular mediana
    const sorted = [...calificacionesValidas].sort((a, b) => a - b);
    const mediana = sorted.length % 2 === 0 
      ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2
      : sorted[Math.floor(sorted.length/2)];
    
    // Calcular moda
    const frecuencia: { [key: number]: number } = {};
    calificacionesValidas.forEach(val => {
      frecuencia[val] = (frecuencia[val] || 0) + 1;
    });
    
    let moda = 0;
    let maxFrecuencia = 0;
    Object.entries(frecuencia).forEach(([valor, freq]) => {
      if (freq > maxFrecuencia) {
        moda = parseFloat(valor);
        maxFrecuencia = freq;
      }
    });
    
    return {
      promedio: promedio,
      maximo: max,
      minimo: min,
      mediana: mediana,
      moda: moda,
      total: calificacionesValidas.length,
      desviacionTipica: this.calcularDesviacionTipica(calificacionesValidas, promedio)
    };
  }

  calcularDesviacionTipica(valores: number[], promedio: number): number {
    const sumaDiferenciasCuadrado = valores.reduce((sum: number, val: number) => {
      return sum + Math.pow(val - promedio, 2);
    }, 0);
    
    return Math.sqrt(sumaDiferenciasCuadrado / valores.length);
  }

  // ============ MÉTODOS DE RENDIMIENTO ============

  medirRendimientoFiltros(): void {
    const inicio = performance.now();
    
    // Aplicar filtros
    this.aplicarFiltrosAvanzados();
    
    const fin = performance.now();
    const tiempoFiltrado = fin - inicio;
    
    console.log(`Tiempo de filtrado: ${tiempoFiltrado.toFixed(2)}ms`);
    
    // Si es muy lento, sugerir optimizaciones
    if (tiempoFiltrado > 100) {
      console.warn('El filtrado está tardando más de 100ms. Considere reducir el número de registros o optimizar los filtros.');
    }
    
    // Guardar métrica
    this.guardarMetrica('tiempo_filtrado', tiempoFiltrado);
  }

  optimizarMemoria(): void {
    // Limpiar cache si hay muchos datos
    if (this.calificacionesFiltradasPlanas.length > 10000) {
      this.cacheCalculos.clear();
      this.mostrarAlertaMensaje('Cache limpiado para optimizar memoria', 'info');
    }
  }

  manejarGrandesConjuntosDatos(): void {
    const totalRegistros = this.calificacionesFiltradasPlanas.length;
    
    if (totalRegistros > 10000) {
      // Reducir items por página automáticamente
      if (this.itemsPorPagina > 50) {
        this.itemsPorPagina = 50;
        this.mostrarAlertaMensaje(
          'Se redujo el número de items por página para mejorar el rendimiento', 
          'warning'
        );
      }
      
      // Desactivar funcionalidades que consumen muchos recursos
      this.mostrarPromedios = false;
      this.mostrarAlertaMensaje(
        'Algunas funcionalidades se desactivaron debido al gran volumen de datos', 
        'info'
      );
    }
  }

  // ============ MÉTODOS DE DEBUG ============

  debugEstado(): void {
    console.log('=== DEBUG ESTADO ===');
    console.log('Calificaciones totales:', this.calificaciones.length);
    console.log('Calificaciones filtradas:', this.calificacionesFiltradas.length);
    console.log('Vista plana:', this.calificacionesFiltradasPlanas.length);
    console.log('Página actual:', this.paginaActual, 'de', this.totalPaginas);
    console.log('Items por página:', this.itemsPorPagina);
    console.log('Filtros activos:', this.obtenerFiltrosActivos());
    console.log('Favoritos:', this.favoritos.size);
    console.log('Seleccionados:', this.estudiantesSeleccionados.size);
    console.log('Cache cálculos:', this.cacheCalculos.size);
    console.log('====================');
  }
}