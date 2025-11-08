import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // ====== Header (fecha/hora) ======
  fechaActual = { hora: '', dia: '', mes: '', anio: '' };
  private intervalId: any = null;

  // ====== BASE URL DEL BACKEND DE AVISOS ======
  private apiAvisosBase = 'http://localhost/gestion_e/Aviso';

  // ====== Datos ======
  avisos: any[] = [];            // avisos activos (tarjetas)
  todosLosAvisos: any[] = [];    // todos (gestión)

  // Buscador en Gestión
  busquedaAvisos: string = '';
  todosLosAvisosFiltrados: any[] | null = null;

  // Indicadores UI
  loadingAvisos = false;
  errorAvisos = '';

  // ====== Estado de modales ======
  mostrarModalAviso = false;
  mostrarGestionAvisos = false;
  editandoAviso = false;
  avisoEditando: any = null;

  // compatibilidad con tu template
  nuevoAviso: any = { id: 0, titulo: '', contenido: '', prioridad: 'media', activo: true };

  // ====== Pestañas dentro de gestión ======
  tabActiva: 'visibles' | 'ocultos' | 'todos' = 'visibles';
  mostrarSeleccionados = false;
  avisosSeleccionados: Set<number> = new Set<number>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private el: ElementRef
  ) {}

  // ====== Ciclo de vida ======
  ngOnInit(): void {
    this.actualizarFecha();
    this.intervalId = setInterval(() => this.actualizarFecha(), 1000);
    this.cargarAvisos(); // carga inicial: solo los activos/visibles
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.iniciarEfectosHover(), 300);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // ====== Navegación ======
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  // ====== Fecha/Hora ======
  actualizarFecha(): void {
    const ahora = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    this.fechaActual.hora = `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;

    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    this.fechaActual.dia = `${dias[ahora.getDay()]}, ${ahora.getDate()}`;
    this.fechaActual.mes = meses[ahora.getMonth()];
    this.fechaActual.anio = ahora.getFullYear().toString();
  }

  // ====== Tabs ======
  cambiarTab(tab: 'visibles'|'ocultos'|'todos'): void {
    this.tabActiva = tab;
    this.mostrarSeleccionados = false;
    this.avisosSeleccionados.clear();

    if (tab === 'visibles' || tab === 'ocultos') {
      this.cargarAvisos();
      this.cargarTodosLosAvisos();
    } else {
      this.cargarTodosLosAvisos();
    }
  }

  // ====== Carga avisos ACTIVOS (tarjetas del dashboard) ======
  cargarAvisos(): void {
    const apiUrl = `${this.apiAvisosBase}/avisos_activos.php`;
    this.loadingAvisos = true;
    this.errorAvisos = '';

    this.http.get<any>(apiUrl).subscribe({
      next: (r) => {
        this.avisos = this.mapListaRespuesta(r); // solo activos
        this.reiniciarEfectosHover();
      },
      error: (error) => {
        const msg = this.obtenerMensajeError(error);
        console.error('❌ Error cargando avisos activos:', msg);
        this.errorAvisos = msg;
        this.avisos = [];
      }
    }).add(() => {
      this.loadingAvisos = false;
    });
  }

  // ====== Carga TODOS los avisos (gestión) ======
  cargarTodosLosAvisos(): void {
    const apiUrl = `${this.apiAvisosBase}/avisos.php`;
    this.loadingAvisos = true;
    this.errorAvisos = '';

    this.http.get<any>(apiUrl).subscribe({
      next: (r) => {
        this.todosLosAvisos = this.mapListaRespuesta(r);
        this.mostrarGestionAvisos = true;
        this.mostrarSeleccionados = false;
        this.avisosSeleccionados.clear();

        // si hay un query activo, recalculamos
        if (this.busquedaAvisos.trim()) this.filtrarAvisos();
        else this.todosLosAvisosFiltrados = null;
      },
      error: (error) => {
        const msg = this.obtenerMensajeError(error);
        console.error('❌ Error cargando todos los avisos:', msg);
        this.errorAvisos = msg;
        this.mostrarNotificacion('Error al cargar todos los avisos', 'error');
        this.todosLosAvisos = [];
        this.mostrarGestionAvisos = true; // mostramos modal aunque falle
      }
    }).add(() => {
      this.loadingAvisos = false;
    });
  }

  // ====== Buscador (gestión) ======
  filtrarAvisos(): void {
    const q = (this.busquedaAvisos || '').toLowerCase().trim();
    this.todosLosAvisosFiltrados = q
      ? (this.todosLosAvisos || []).filter(a => (a?.titulo || '').toLowerCase().includes(q))
      : null;
  }

  // ====== Selección múltiple ======
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
    this.todosLosAvisos.forEach(a => this.avisosSeleccionados.add(a.id));
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

  // ====== Helpers para el template ======
  getAvisosSeleccionados(): any[] {
    if (!this.todosLosAvisos?.length) return [];
    return this.todosLosAvisos.filter(a => this.avisosSeleccionados.has(a.id));
  }

  getAvisosActivos(): any[] {
    return (this.todosLosAvisos || []).filter(a => !!a.activo);
  }

  getAvisosParaMostrar(): any[] {
    return this.mostrarSeleccionados
      ? this.getAvisosSeleccionados()
      : (this.todosLosAvisos || []);
  }

  formatearFecha(v: any): string {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  getEstadoAviso(activo: any): string {
    return activo ? 'Activo' : 'Oculto';
  }

  getEstadisticasAvisos(): { visibles: number; total: number } {
    const total = this.todosLosAvisos?.length || 0;
    const visibles = this.todosLosAvisos?.filter(a => !!a.activo).length || 0;
    return { visibles, total };
  }

  // ====== Cambiar estado (ACTIVO/OCULTO) de varios avisos ======
  aplicarSeleccion(): void {
    if (this.avisosSeleccionados.size === 0) {
      this.mostrarNotificacion('Selecciona al menos un aviso', 'warning');
      return;
    }

    const lista = this.todosLosAvisos.filter(a => this.avisosSeleccionados.has(a.id));
    let hechos = 0;

    lista.forEach((a) => {
      this.http.get(`${this.apiAvisosBase}/avisos_toggle.php`, { params: { id: a.id } })
        .subscribe({ next: () => {}, error: () => {} })
        .add(() => {
          hechos++;
          if (hechos >= lista.length) {
            this.mostrarNotificacion('Estados actualizados', 'success');
            this.cargarAvisos();
            this.cargarTodosLosAvisos();
          }
        });
    });

    if (lista.length === 0) {
      this.mostrarNotificacion('No hay avisos para cambiar', 'error');
    }
  }

  // ====== Cambiar estado de UNO solo ======
  toggleAviso(aviso: any): void {
    this.http.get(`${this.apiAvisosBase}/avisos_toggle.php`, { params: { id: aviso.id } }).subscribe({
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
      }
    });
  }

  // ====== Abrir modal para editar aviso ======
  editarAviso(aviso: any): void {
    this.avisoEditando = { ...aviso };
    this.editandoAviso = true;
    this.mostrarModalAviso = true;
    this.nuevoAviso = { ...this.avisoEditando };
  }

  // ====== Abrir modal para crear aviso ======
  agregarAviso(): void {
    const base = { id: 0, titulo: '', contenido: '', prioridad: 'media', activo: true };
    this.avisoEditando = { ...base };
    this.nuevoAviso = { ...base };
    this.editandoAviso = false;
    this.mostrarModalAviso = true;
  }

  cerrarModalAviso(): void {
    this.mostrarModalAviso = false;
    this.avisoEditando = null;
  }

  // ====== Guardar aviso (crear o actualizar) ======
  guardarAviso(): void {
    if (this.editandoAviso && this.avisoEditando?.id) {
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
        }
      });

    } else {
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
        }
      });
    }
  }

  // ====== Eliminar aviso ======
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
      }
    });
  }

  // ====== Toast / mensajes al usuario ======
  mostrarNotificacion(msg: string, tipo: 'success' | 'error' | 'warning' = 'success'): void {
    console.log(`[${tipo.toUpperCase()}] ${msg}`);
  }

  // ====== Efectos visuales de las tarjetas ======
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
    card.style.boxShadow = '0 10px 15px rgba(0,0,0,.1), 0 4px 6px rgba(0,0,0,.05)';
  };

  private onCardLeave = (e: Event) => {
    const card = e.currentTarget as HTMLElement;
    if (!card) return;
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = '0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06)';
  };

  private reiniciarEfectosHover(): void {
    setTimeout(() => this.iniciarEfectosHover(), 100);
  }

  // ====== Helpers de respuesta del backend ======
  private mapListaRespuesta(r: any): any[] {
    if (Array.isArray(r)) return r;
    if (r?.avisos && Array.isArray(r.avisos)) return r.avisos;
    return [];
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
    if (error?.status === 0) return 'Servidor no disponible. Revisa el backend/PHP.';
    if (error?.status === 404) return 'Endpoint no encontrado.';
    if (error?.status === 500) return 'Error interno del servidor.';
    return `Error ${error?.status ?? 'desconocido'}: ${error?.message ?? 'Sin detalle'}`;
  }

  // ====== Activar/desactivar TODOS los avisos ======
  toggleTodosLosAvisos(): void {
    const lista = [...this.todosLosAvisos];
    let hechos = 0;

    lista.forEach((a) => {
      this.http.get(`${this.apiAvisosBase}/avisos_toggle.php`, { params: { id: a.id } })
        .subscribe({ next: () => {}, error: () => {} })
        .add(() => {
          hechos++;
          if (hechos >= lista.length) {
            this.mostrarNotificacion('Se actualizaron todos los avisos', 'success');
            this.cargarAvisos();
            this.cargarTodosLosAvisos();
          }
        });
    });

    if (lista.length === 0) {
      this.mostrarNotificacion('No hay avisos para cambiar', 'error');
    }
  }

  // ====== Cerrar modal de gestión ======
  cerrarGestionAvisos(): void {
    this.mostrarGestionAvisos = false;
    this.mostrarSeleccionados = false;
    this.avisosSeleccionados.clear();
  }

  // ====== ESC cierra modales ======
  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.mostrarModalAviso) this.cerrarModalAviso();
    if (this.mostrarGestionAvisos) this.cerrarGestionAvisos();
  }
}
