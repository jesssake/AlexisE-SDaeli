import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-maestro',
  templateUrl: './maestro.component.html',
  styleUrls: ['./maestro.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class MaestroComponent implements OnInit {
  nombreUsuario = 'Maestro';
  menuAbierto = false;
  seccionActual = 'Dashboard';
  
  // Estado de las categorías desplegables
  categoriasAbiertas = {
    academica: true,
    comunicacion: true,
    administracion: true
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
    'configuracion': 'Configuración'
  };

  constructor(public router: Router) {}

  ngOnInit(): void {
    try { 
      document?.body?.classList?.remove("dark", "dark-mode"); 
      document?.body?.classList?.add("maestro-page");
    } catch(e) {}
    
    this.verificarAnchoPantalla();
    this.actualizarSeccionActual();
    this.cargarUsuarioActual();

    // Escuchar cambios de navegación
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.actualizarSeccionActual());
  }

  private cargarUsuarioActual(): void {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        this.nombreUsuario = user.nombre || user.name || 'Maestro';
        console.log('👤 Usuario maestro cargado:', this.nombreUsuario);
      }
    } catch (error) {
      console.warn('No se pudo cargar usuario desde localStorage:', error);
    }
  }

  private actualizarSeccionActual(): void {
    // Quitar query/hash y quedarnos con la ruta
    const url = this.router.url.split('?')[0].split('#')[0];

    // Tomar lo que viene después de /maestro/
    const after = url.replace(/^\/maestro\/?/, '');
    const primerSegmento = after.split('/')[0]; // puede ser '' si es /maestro

    this.seccionActual = this.TITULOS[primerSegmento] ?? 'Dashboard';
  }

  @HostListener('window:resize')
  onResize() {
    this.verificarAnchoPantalla();
  }

  private verificarAnchoPantalla(): void {
    if (window.innerWidth > 768) {
      this.menuAbierto = false; // evita que quede abierto en escritorio
    }
  }

  toggleCategory(categoria: keyof typeof this.categoriasAbiertas): void {
    this.categoriasAbiertas[categoria] = !this.categoriasAbiertas[categoria];
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  cerrarSesion(): void {
    // ✅ SOLUCIÓN DEFINITIVA: Forzar cierre completo de sesión
    if (confirm('¿Estás seguro de que deseas cerrar sesión?\nSe perderá toda la información de sesión actual.')) {
      console.log('🚪 CERRIENDO SESIÓN - INICIANDO PROCESO...');
      
      try {
        // 1. Limpiar TODOS los almacenamientos
        console.log('🧹 Limpiando localStorage...');
        localStorage.clear();
        
        console.log('🧹 Limpiando sessionStorage...');
        sessionStorage.clear();
        
        // 2. Limpiar cookies de forma agresiva
        this.limpiarCookies();
        
        // 3. Remover clases del body
        console.log('🎨 Removiendo clases CSS...');
        const clasesARemover = [
          'maestro-page', 'dark', 'dark-mode', 
          'login-page', 'estudiante-page', 'admin-page', 'tutor-page'
        ];
        clasesARemover.forEach(clase => {
          try {
            document.body.classList.remove(clase);
          } catch (e) {}
        });
        
        // 4. Añadir clase temporal para transición
        document.body.classList.add('cerrando-sesion');
        
        // 5. Forzar recarga completa con parámetro anti-caché
        console.log('📍 Redirigiendo a login...');
        const timestamp = new Date().getTime();
        const urlRedireccion = `/auth/login?logout=${timestamp}&nocache=${timestamp}`;
        
        // Pequeña pausa para que el usuario vea el mensaje
        setTimeout(() => {
          console.log('✅ Redirección forzada activada');
          window.location.href = urlRedireccion;
          
          // Forzar recarga si no se redirige en 2 segundos
          setTimeout(() => {
            if (window.location.pathname !== '/auth/login') {
              window.location.reload();
            }
          }, 2000);
        }, 500);
        
      } catch (error) {
        console.error('❌ Error crítico al cerrar sesión:', error);
        
        // Último recurso: redirección forzada
        alert('Error al cerrar sesión. Redirigiendo manualmente...');
        window.location.href = '/auth/login';
      }
    }
  }

  private limpiarCookies(): void {
    try {
      // Intentar limpiar cookies
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
      }
      console.log('🍪 Cookies limpiadas');
    } catch (error) {
      console.warn('⚠️ No se pudieron limpiar cookies:', error);
    }
  }

  obtenerIniciales(): string {
    return this.nombreUsuario
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}