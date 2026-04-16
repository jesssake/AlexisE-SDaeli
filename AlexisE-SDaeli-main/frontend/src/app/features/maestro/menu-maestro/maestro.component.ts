import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { LoggingService } from '../../../services/logging.service';

@Component({
  selector: 'app-maestro',
  templateUrl: './maestro.component.html',
  styleUrls: ['./maestro.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class MaestroComponent implements OnInit, OnDestroy {
  nombreUsuario = 'Maestro';
  menuAbierto = false;
  userMenuAbierto = false;
  seccionActual = 'Dashboard';
  isMobile = false;
  isTablet = false;
  
  // Estado de las categorías desplegables
  categoriasAbiertas = {
    academica: true,
    comunicacion: false,
    administracion: false
  };

  // Notificaciones de ejemplo
  notificaciones = {
    dashboard: false,
    estudiantes: true,
    tareas: true,
    padres: true
  };

  // Mapa "segmento -> Título bonito"
  private readonly TITULOS: Record<string, string> = {
    '': 'Dashboard',
    'dashboard': 'Dashboard',
    'estudiantes': 'Estudiantes',
    'tareas': 'Tareas',
    'asistencia': 'Asistencia',
    'calificaciones': 'Calificaciones',
    'reportes': 'Reportes',
    'padres': 'Padres',
    'graduacion': 'Graduación',
    'manual': 'Manual',
    'configuracion': 'Configuración',
    'perfil': 'Mi Perfil'
  };

  private routerSubscription: Subscription | undefined;

  constructor(public router: Router, private logger: LoggingService) {}

  ngOnInit(): void {
    try { 
      document?.body?.classList?.remove("dark", "dark-mode"); 
      document?.body?.classList?.add("maestro-page");
    } catch(e) {}
    
    this.checkScreenSize();
    this.actualizarSeccionActual();
    this.cargarUsuarioActual();
    this.cargarPreferencias();

    // Escuchar cambios de navegación
    this.routerSubscription = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.actualizarSeccionActual();
        this.cerrarUserMenu();
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userInfo = document.querySelector('.user-info');
    const userDropdown = document.querySelector('.user-dropdown');
    
    if (this.userMenuAbierto && 
        userInfo && 
        userDropdown &&
        !userInfo.contains(target) && 
        !userDropdown.contains(target)) {
      this.cerrarUserMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.userMenuAbierto) {
      this.cerrarUserMenu();
    }
    if (this.menuAbierto && this.isMobile) {
      this.cerrarMenu();
    }
  }

  private checkScreenSize(): void {
    const width = window.innerWidth;
    this.isMobile = width <= 768;
    this.isTablet = width > 768 && width <= 1024;
  }

  private cargarUsuarioActual(): void {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        this.nombreUsuario = user.nombre || user.name || 'Maestro';
        this.logger.log('👤 Usuario maestro cargado:', this.nombreUsuario);
      }
    } catch (error) {
      this.logger.warn('No se pudo cargar usuario desde localStorage:', error);
    }
  }

  private cargarPreferencias(): void {
    try {
      const preferencias = localStorage.getItem('maestro_preferencias');
      if (preferencias) {
        const pref = JSON.parse(preferencias);
        this.categoriasAbiertas = { ...this.categoriasAbiertas, ...pref.categorias };
      }
    } catch (error) {
      this.logger.warn('No se pudieron cargar preferencias:', error);
    }
  }

  private guardarPreferencias(): void {
    try {
      const preferencias = {
        categorias: this.categoriasAbiertas
      };
      localStorage.setItem('maestro_preferencias', JSON.stringify(preferencias));
    } catch (error) {
      this.logger.warn('No se pudieron guardar preferencias:', error);
    }
  }

  private actualizarSeccionActual(): void {
    const url = this.router.url.split('?')[0].split('#')[0];
    const after = url.replace(/^\/maestro\/?/, '');
    const primerSegmento = after.split('/')[0];
    this.seccionActual = this.TITULOS[primerSegmento] ?? 'Dashboard';
  }

  toggleCategory(categoria: keyof typeof this.categoriasAbiertas): void {
    this.categoriasAbiertas[categoria] = !this.categoriasAbiertas[categoria];
    this.guardarPreferencias();
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
    if (!this.menuAbierto) {
      this.cerrarUserMenu();
    }
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  cerrarMenuEnMovil(): void {
    if (this.isMobile) {
      this.cerrarMenu();
    }
  }

  toggleUserMenu(): void {
    this.userMenuAbierto = !this.userMenuAbierto;
  }

  cerrarUserMenu(): void {
    this.userMenuAbierto = false;
  }

  obtenerIniciales(): string {
    if (!this.nombreUsuario) return '';
    const palabras = this.nombreUsuario.split(' ').filter(p => p.length > 0);
    if (palabras.length === 0) return '';
    if (palabras.length === 1) return palabras[0].charAt(0).toUpperCase();
    return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase();
  }

  cerrarSesion(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.logger.log('🚪 Cerrando sesión...');
      
      try {
        // Limpiar almacenamiento
        localStorage.clear();
        sessionStorage.clear();
        
        // Limpiar cookies
        this.limpiarCookies();
        
        // Remover clases del body
        document.body.className = '';
        
        // Redirigir
        const timestamp = new Date().getTime();
        this.router.navigate(['/auth/login'], { 
          queryParams: { logout: timestamp }
        });
        
      } catch (error) {
        this.logger.error('❌ Error al cerrar sesión:', error);
        this.router.navigate(['/auth/login']);
      }
    }
  }

  private limpiarCookies(): void {
    try {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      }
    } catch (error) {
      this.logger.warn('⚠️ No se pudieron limpiar cookies:', error);
    }
  }
}