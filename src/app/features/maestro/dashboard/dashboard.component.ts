import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpClientModule,
  HttpParams,
} from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export type Prioridad = 'alta' | 'media' | 'baja';

export interface Aviso {
  id: number;
  titulo: string;
  contenido: string;
  prioridad: Prioridad;
  activo: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  // ================= HEADER (FECHA / HORA) =================
  fechaActual = { hora: '', dia: '', mes: '', anio: '' };
  private intervalId: any = null;

  // ================= BACKEND BASE URL ======================
  private apiAvisosBase = 'http://localhost/gestion_e/Aviso';

  // ================= DATOS PRINCIPALES =====================
  avisos: Aviso[] = [];          // Avisos activos (panel principal)
  todosLosAvisos: Aviso[] = [];  // Todos los avisos (gestión)

  // Buscador en gestión
  busquedaAvisos = '';
  todosLosAvisosFiltrados: Aviso[] | null = null;

  // Indicadores UI
  loadingAvisos = false;
  errorAvisos = '';

  // Modales
  mostrarModalAviso = false;
  mostrarGestionAvisos = false;
  editandoAviso = false;
  avisoEditando: Partial<Aviso> | null = null;

  // Para compatibilidad
  nuevoAviso: Partial<Aviso> = {
    id: 0,
    titulo: '',
    contenido: '',
    prioridad: 'media',
    activo: true,
  };

  // Gestión / selección múltiple
  tabActiva: 'visibles' | 'ocultos' | 'todos' = 'visibles';
  mostrarSeleccionados = false;
  avisosSeleccionados: Set<number> = new Set<number>();

  // Popup de éxito al aplicar selección
  mostrarPopupExito = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private el: ElementRef
  ) {}

  // =========================================================
  // CICLO DE VIDA
  // =========================================================
  ngOnInit(): void {
    this.actualizarFecha();
    this.intervalId = setInterval(() => this.actualizarFecha(), 1000);
    this.cargarAvisos();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.iniciarEfectosHover(), 200);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // =========================================================
  // NAVEGACIÓN
  // =========================================================
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  // =========================================================
  // FECHA / HORA
  // =========================================================
  private actualizarFecha(): void {
    const ahora = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');

    const dias = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    this.fechaActual.hora = `${pad(ahora.getHours())}:${pad(
      ahora.getMinutes()
    )}:${pad(ahora.getSeconds())}`;
    this.fechaActual.dia = `${dias[ahora.getDay()]}, ${ahora.getDate()}`;
    this.fechaActual.mes = meses[ahora.getMonth()];
    this.fechaActual.anio = ahora.getFullYear().toString();
  }

  // =========================================================
  // CARGA DE AVISOS
  // =========================================================
  cargarAvisos(): void {
    const url = `${this.apiAvisosBase}/avisos_activos.php`;
    this.loadingAvisos = true;
    this.errorAvisos = '';

    this.http.get<any>(url).subscribe({
      next: (r) => {
        this.avisos = this.mapListaRespuesta(r);
        this.reiniciarEfectosHover();
      },
      error: (error) => {
        const msg = this.obtenerMensajeError(error);
        console.error('❌ Error cargando avisos activos:', msg);
        this.errorAvisos = msg;
        this.avisos = [];
      },
      complete: () => {
        this.loadingAvisos = false;
      },
    });
  }

  cargarTodosLosAvisos(): void {
    const url = `${this.apiAvisosBase}/avisos.php`;
    this.loadingAvisos = true;
    this.errorAvisos = '';

    this.http.get<any>(url).subscribe({
      next: (r) => {
        this.todosLosAvisos = this.mapListaRespuesta(r);
        this.mostrarGestionAvisos = true;
        this.mostrarSeleccionados = false;
        this.avisosSeleccionados.clear();

        if (this.busquedaAvisos.trim()) {
          this.filtrarAvisos();
        } else {
          this.todosLosAvisosFiltrados = null;
        }
      },
      error: (error) => {
        const msg = this.obtenerMensajeError(error);
        console.error('❌ Error cargando todos los avisos:', msg);
        this.errorAvisos = msg;
        this.mostrarNotificacion('Error al cargar todos los avisos', 'error');
        this.todosLosAvisos = [];
        this.mostrarGestionAvisos = true;
      },
      complete: () => {
        this.loadingAvisos = false;
      },
    });
  }

  // =========================================================
  // BUSCADOR
  // =========================================================
  filtrarAvisos(): void {
    const q = (this.busquedaAvisos || '').toLowerCase().trim();
    this.todosLosAvisosFiltrados = q
      ? (this.todosLosAvisos || []).filter((a) =>
          (a?.titulo || '').toLowerCase().includes(q)
        )
      : null;
  }

  // =========================================================
  // SELECCIÓN MÚLTIPLE
  // =========================================================
  onToggleMaster(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    if (checked) this.seleccionarTodos();
    else this.deseleccionarTodos();
  }

  toggleSeleccionAviso(avisoId: number): void {
    if (this.avisosSeleccionados.has(avisoId)) {
      this.avisosSeleccionados.delete(avisoId);
    } else {
      this.avisosSeleccionados.add(avisoId);
    }
    this.mostrarSeleccionados = this.avisosSeleccionados.size > 0;
  }

  seleccionarTodos(): void {
    this.todosLosAvisos.forEach((a) => this.avisosSeleccionados.add(a.id));
    this.mostrarSeleccionados = this.avisosSeleccionados.size > 0;
  }

  deseleccionarTodos(): void {
    this.avisosSeleccionados.clear();
    this.mostrarSeleccionados = false;
  }

  mostrarAvisosSeleccionados(): void {
    this.mostrarSeleccionados = true;
  }

  volverAVistaNormal(): void {
    this.mostrarSeleccionados = false;
  }

  // =========================================================
  // HELPERS PARA TEMPLATE
  // =========================================================
  getAvisosSeleccionados(): Aviso[] {
    if (!this.todosLosAvisos?.length) return [];
    return this.todosLosAvisos.filter((a) =>
      this.avisosSeleccionados.has(a.id)
    );
  }

  getAvisosActivos(): Aviso[] {
    return (this.todosLosAvisos || []).filter((a) => !!a.activo);
  }

  getAvisosParaMostrar(): Aviso[] {
    return this.mostrarSeleccionados
      ? this.getAvisosSeleccionados()
      : this.todosLosAvisos || [];
  }

  formatearFecha(v: any): string {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }

  getEstadoAviso(activo: any): string {
    return activo ? 'Activo' : 'Oculto';
  }

  getEstadisticasAvisos(): { visibles: number; total: number } {
    const total = this.todosLosAvisos?.length || 0;
    const visibles = this.todosLosAvisos?.filter((a) => !!a.activo).length || 0;
    return { visibles, total };
  }

  // =========================================================
  // APLICAR SELECCIÓN (TOGGLE)
  // =========================================================
  aplicarSeleccion(): void {
    if (this.avisosSeleccionados.size === 0) {
      this.mostrarNotificacion('Selecciona al menos un aviso', 'warning');
      return;
    }

    const lista = this.todosLosAvisos.filter((a) =>
      this.avisosSeleccionados.has(a.id)
    );

    if (lista.length === 0) {
      this.mostrarNotificacion('No hay avisos para cambiar', 'error');
      return;
    }

    let hechos = 0;
    lista.forEach((a) => {
      const params = new HttpParams().set('id', a.id.toString());
      this.http
        .get(`${this.apiAvisosBase}/avisos_toggle.php`, { params })
        .subscribe({
          next: () => {},
          error: () => {},
          complete: () => {
            hechos++;
            if (hechos >= lista.length) {
              this.mostrarNotificacion('Estados actualizados', 'success');
              this.cargarAvisos();
              this.cargarTodosLosAvisos();

              // 👉 Mostrar popup de éxito
              this.mostrarPopupExito = true;
            }
          },
        });
    });
  }

  // Popup: cerrar
  cerrarPopupExito(): void {
    this.mostrarPopupExito = false;
  }

  // =========================================================
  // TOGGLE DE UN SOLO AVISO
  // =========================================================
  toggleAviso(aviso: Aviso): void {
    const params = new HttpParams().set('id', aviso.id.toString());

    this.http
      .get(`${this.apiAvisosBase}/avisos_toggle.php`, { params })
      .subscribe({
        next: (r: any) => {
          if (this.ok(r)) {
            aviso.activo = !aviso.activo;
            this.mostrarNotificacion('Estado actualizado', 'success');
            this.cargarAvisos();
            this.cargarTodosLosAvisos();
          } else {
            this.mostrarNotificacion('No se pudo actualizar', 'error');
          }
        },
        error: (error) => {
          const msg = this.obtenerMensajeError(error);
          this.mostrarNotificacion(msg, 'error');
        },
      });
  }

  // =========================================================
  // CREAR / EDITAR AVISO
  // =========================================================
  editarAviso(aviso: Aviso): void {
    this.avisoEditando = { ...aviso };
    this.editandoAviso = true;
    this.mostrarModalAviso = true;
    this.nuevoAviso = { ...this.avisoEditando };
  }

  agregarAviso(): void {
    const base: Aviso = {
      id: 0 as any,
      titulo: '',
      contenido: '',
      prioridad: 'media',
      activo: true,
    };
    this.avisoEditando = { ...base };
    this.nuevoAviso = { ...base };
    this.editandoAviso = false;
    this.mostrarModalAviso = true;
  }

  cerrarModalAviso(): void {
    this.mostrarModalAviso = false;
    this.avisoEditando = null;
  }

  guardarAviso(): void {
    if (this.editandoAviso && this.avisoEditando?.id) {
      // UPDATE
      const id = this.avisoEditando.id;
      const url = `${this.apiAvisosBase}/avisos_id.php?id=${id}`;

      this.http.put(url, this.avisoEditando).subscribe({
        next: (r: any) => {
          if (this.ok(r)) {
            this.mostrarNotificacion('Cambios guardados', 'success');
            this.cerrarModalAviso();
            this.cargarAvisos();
            if (this.mostrarGestionAvisos) this.cargarTodosLosAvisos();
          } else {
            this.mostrarNotificacion('No se pudo actualizar el aviso', 'error');
          }
        },
        error: (error) => {
          const msg = this.obtenerMensajeError(error);
          this.mostrarNotificacion(msg, 'error');
        },
      });
    } else {
      // CREATE
      const url = `${this.apiAvisosBase}/avisos.php`;
      const body = this.avisoEditando ?? this.nuevoAviso;

      this.http.post(url, body).subscribe({
        next: (r: any) => {
          if (this.ok(r)) {
            this.mostrarNotificacion('Aviso creado', 'success');
            this.cerrarModalAviso();
            this.cargarAvisos();
            if (this.mostrarGestionAvisos) this.cargarTodosLosAvisos();
          } else {
            this.mostrarNotificacion('No se pudo crear el aviso', 'error');
          }
        },
        error: (error) => {
          const msg = this.obtenerMensajeError(error);
          this.mostrarNotificacion(msg, 'error');
        },
      });
    }
  }

  // =========================================================
  // ELIMINAR AVISO
  // =========================================================
  eliminarAviso(id: number): void {
    if (!confirm('¿Eliminar el aviso seleccionado?')) return;

    const url = `${this.apiAvisosBase}/avisos_id.php`;
    const params = new HttpParams().set('id', id);

    this.http.delete(url, { params }).subscribe({
      next: (r: any) => {
        if (this.ok(r)) {
          this.mostrarNotificacion('Aviso eliminado correctamente', 'success');
          this.cargarAvisos();
          if (this.mostrarGestionAvisos) this.cargarTodosLosAvisos();
        } else {
          this.mostrarNotificacion('No se pudo eliminar el aviso', 'error');
        }
      },
      error: (error) => {
        console.error('❌ Error al eliminar aviso:', error);
        this.mostrarNotificacion('Error al eliminar aviso', 'error');
      },
    });
  }

  // =========================================================
  // TOGGLE TODOS LOS AVISOS
  // =========================================================
  toggleTodosLosAvisos(): void {
    const lista = [...this.todosLosAvisos];
    let hechos = 0;

    if (lista.length === 0) {
      this.mostrarNotificacion('No hay avisos para cambiar', 'error');
      return;
    }

    lista.forEach((a) => {
      const params = new HttpParams().set('id', a.id.toString());
      this.http
        .get(`${this.apiAvisosBase}/avisos_toggle.php`, { params })
        .subscribe({
          next: () => {},
          error: () => {},
          complete: () => {
            hechos++;
            if (hechos >= lista.length) {
              this.mostrarNotificacion(
                'Se actualizaron todos los avisos',
                'success'
              );
              this.cargarAvisos();
              this.cargarTodosLosAvisos();
            }
          },
        });
    });
  }

  // =========================================================
  // CERRAR MODAL GESTIÓN
  // =========================================================
  cerrarGestionAvisos(): void {
    this.mostrarGestionAvisos = false;
    this.mostrarSeleccionados = false;
    this.avisosSeleccionados.clear();
  }

  // =========================================================
  // EFECTOS VISUALES TARJETAS
  // =========================================================
  private iniciarEfectosHover(): void {
    const cards = this.el.nativeElement.querySelectorAll('.card-formal');
    cards.forEach((card: HTMLElement) => {
      card.addEventListener('mouseenter', this.onCardEnter);
      card.addEventListener('mouseleave', this.onCardLeave);
    });
  }

  private onCardEnter = (e: Event) => {
    const card = e.currentTarget as HTMLElement;
    if (!card) return;
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow =
      '0 10px 15px rgba(0,0,0,.1), 0 4px 6px rgba(0,0,0,.05)';
  };

  private onCardLeave = (e: Event) => {
    const card = e.currentTarget as HTMLElement;
    if (!card) return;
    card.style.transform = 'translateY(0)';
    card.style.boxShadow =
      '0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06)';
  };

  private reiniciarEfectosHover(): void {
    setTimeout(() => this.iniciarEfectosHover(), 100);
  }

  // =========================================================
  // HELPERS BACKEND
  // =========================================================
  private normalizarAviso(a: any): Aviso {
    const prioTxt = (a?.prioridad || '').toString().toLowerCase();
    const prioridad: Prioridad =
      prioTxt === 'alta' || prioTxt === 'media' || prioTxt === 'baja'
        ? (prioTxt as Prioridad)
        : 'media';

    return {
      id: Number(a.id),
      titulo: String(a.titulo ?? ''),
      contenido: String(a.contenido ?? ''),
      prioridad,
      activo: !!a.activo,
      fecha_creacion: a.fecha_creacion,
      fecha_actualizacion: a.fecha_actualizacion,
    };
  }

  private mapListaRespuesta(r: any): Aviso[] {
    const lista = Array.isArray(r) ? r : r?.avisos || [];
    return (lista || []).map((a: any) => this.normalizarAviso(a));
  }

  private ok(r: any): boolean {
    if (!r) return false;
    if (typeof r === 'object') {
      if ('ok' in r) return !!(r as any).ok;
      if ('success' in r) return !!(r as any).success;
    }
    return true;
  }

  private obtenerMensajeError(error: any): string {
    if (error?.status === 0)
      return 'Servidor no disponible. Revisa el backend/PHP.';
    if (error?.status === 404) return 'Endpoint no encontrado.';
    if (error?.status === 500) return 'Error interno del servidor.';
    return `Error ${error?.status ?? 'desconocido'}: ${
      error?.message ?? 'Sin detalle'
    }`;
  }

  // =========================================================
  // NOTIFICACIONES (LOG)
  // =========================================================
  mostrarNotificacion(
    msg: string,
    tipo: 'success' | 'error' | 'warning' = 'success'
  ): void {
    console.log(`[${tipo.toUpperCase()}] ${msg}`);
  }

  // =========================================================
  // ESCAPE CIERRA MODALES
  // =========================================================
  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.mostrarModalAviso) this.cerrarModalAviso();
    if (this.mostrarGestionAvisos) this.cerrarGestionAvisos();
    if (this.mostrarPopupExito) this.cerrarPopupExito();
  }
}
