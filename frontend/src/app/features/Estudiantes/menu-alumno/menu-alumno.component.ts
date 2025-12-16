﻿// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\Estudiantes\menu-alumno\menu-alumno.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  HostListener,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

interface NavItem {
  key: string;
  titulo: string;
  desc: string;
  icono: string;
  link: string;
  badge?: number;
}

interface Prefs {
  mostrarMenuBotones: boolean;
  gridCols: number;
  menuCompacto: boolean;
  tema: 'claro' | 'oscuro' | 'auto';
  animaciones: boolean;
}

interface StudentData {
  alumno_nombre: string;
  fecha_nacimiento: string;
  condiciones_medicas: string;
  tutor_nombre: string;
  correo_tutor: string;
  grado: string;
  seccion: string;
  promedio?: number;
  asistencia?: number;
}

@Component({
  selector: 'app-menu-alumno',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './menu-alumno.component.html',
  styleUrls: ['./menu-alumno.component.scss'],
})
export class MenuAlumnoComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('ink') inkElements!: QueryList<ElementRef<HTMLSpanElement>>;
  @ViewChild('particlesContainer') particlesContainer?: ElementRef<HTMLDivElement>;

  datosAlumno: StudentData | null = null;
  error: string | null = null;
  cargando = false;

  prefs: Prefs = {
    mostrarMenuBotones: true,
    gridCols: 3,
    menuCompacto: false,
    tema: 'claro',
    animaciones: true,
  };

  nav: NavItem[] = [
    {
      key: 'dashboard',
      titulo: 'Dashboard',
      desc: 'Panel principal interactivo',
      icono: '📊',
      link: '/estudiante/dashboard',
    },
    {
      key: 'tareas',
      titulo: 'Tareas Inteligentes',
      desc: 'Gestión avanzada de actividades',
      icono: '📚',
      link: '/estudiante/tareas',
      badge: 3,
    },
    {
      key: 'asistencia',
      titulo: 'Asistencia',
      desc: 'Control de presencia en tiempo real',
      icono: '✅',
      link: '/estudiante/asistencia',
    },
    {
      key: 'calificaciones',
      titulo: 'Calificaciones',
      desc: 'Consulta tus calificaciones',
      icono: '🏆',
      link: '/estudiante/calificaciones',
    },
    {
      key: 'chat',
      titulo: 'Chat con mi Profesor',
      desc: 'Comunicación con el Profesor',
      icono: '💬',
      link: '/estudiante/chat',
    },
    {
      key: 'reportes',
      titulo: 'Reportes',
      desc: 'Documentación inteligente',
      icono: '📈',
      link: '/estudiante/reportes',
    },
    {
      key: 'graduacion',
      titulo: 'Fin de curso',
      desc: 'Seguimiento de metas académicas',
      icono: '🎓',
      link: '/estudiante/graduacion',
    },
    {
      key: 'manual',
      titulo: 'Centro de Ayuda',
      desc: 'Recursos y soporte premium',
      icono: '💡',
      link: '/estudiante/manual',
    },
    {
      key: 'configuracion',
      titulo: 'Configuración',
      desc: 'Personalización avanzada',
      icono: '⚙️',
      link: '/estudiante/configuracion',
    },
  ];

  sidebarColapsada = false;
  isMobile = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // ⚡ Fondo especial para MENÚ ESTUDIANTE
    document.body.classList.remove('login-page');
    document.body.classList.add('estudiante-page');

    this.checkMobileView();
    this.cargarDatosAlumno();
    this.cargarPrefs();
    this.aplicarTema();
    this.inicializarAnimaciones();
  }

  ngAfterViewInit(): void {
    this.crearParticulas();
  }

  ngOnDestroy(): void {
    // Limpia la clase cuando salgas de este layout
    document.body.classList.remove('estudiante-page');
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobileView();
  }

  checkMobileView(): void {
    this.isMobile = window.innerWidth <= 1024;
    if (!this.isMobile) {
      this.sidebarColapsada = false;
    }
  }

  isMobileView(): boolean {
    return this.isMobile;
  }

  cargarDatosAlumno(): void {
    const correo = localStorage.getItem('correo');
    if (!correo) {
      this.error = 'No se encontró la sesión del estudiante.';
      return;
    }

    this.cargando = true;
    this.error = null;

    const url = `http://localhost/gestion_e/Estudiantes/detalles.php?correo=${encodeURIComponent(
      correo
    )}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res?.ok && res.datos) {
          this.datosAlumno = {
            ...res.datos,
            promedio: this.generarPromedioAleatorio(),
            asistencia: this.generarAsistenciaAleatoria(),
          };
        } else {
          this.error = res?.error || 'No se pudieron cargar los datos del estudiante.';
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error de conexión con el servidor.';
        this.cargando = false;
        console.error('Error loading student data:', err);
      },
    });
  }

  cargarPrefs(): void {
    try {
      const raw = localStorage.getItem('prefs_estudiante');
      if (raw) {
        const p = JSON.parse(raw);
        this.prefs = {
          mostrarMenuBotones: p.mostrarMenuBotones ?? this.prefs.mostrarMenuBotones,
          gridCols: this.clamp(Number(p.gridCols ?? this.prefs.gridCols), 1, 4),
          menuCompacto: !!p.menuCompacto,
          tema: p.tema || 'claro',
          animaciones: p.animaciones ?? true,
        };
      }
    } catch (error) {
      console.warn('Error loading preferences:', error);
    }

    this.aplicarPreferencias();
  }

  guardarPrefs(): void {
    try {
      localStorage.setItem('prefs_estudiante', JSON.stringify(this.prefs));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  aplicarPreferencias(): void {
    document.documentElement.style.setProperty('--cols', String(this.prefs.gridCols));
    this.aplicarTema();
    this.toggleAnimaciones();
  }

  aplicarTema(): void {
    const tema = this.prefs.tema;
    if (
      tema === 'oscuro' ||
      (tema === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.setAttribute('data-tema', 'oscuro');
    } else {
      document.documentElement.setAttribute('data-tema', 'claro');
    }
  }

  toggleTema(): void {
    this.prefs.tema = this.prefs.tema === 'claro' ? 'oscuro' : 'claro';
    this.aplicarTema();
    this.guardarPrefs();
  }

  toggleAnimaciones(): void {
    if (this.prefs.animaciones) {
      document.body.classList.add('animaciones-activas');
    } else {
      document.body.classList.remove('animaciones-activas');
    }
  }

  inicializarAnimaciones(): void {
    this.toggleAnimaciones();
  }

  crearParticulas(): void {
    const container = this.particlesContainer?.nativeElement;
    if (!container) return;

    // Limpia partículas anteriores si se recrea la vista
    container.innerHTML = '';

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';

      const size = Math.random() * 6 + 2;
      const posX = Math.random() * 100;
      const delay = Math.random() * 20;

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${posX}%`;
      particle.style.animationDelay = `${delay}s`;
      particle.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;

      container.appendChild(particle);
    }
  }

  onItemClick(event: MouseEvent): void {
    // DEBUG: Verificar qué enlace se está clickeando
    const linkElement = (event.currentTarget as HTMLElement).closest('a');
    if (linkElement) {
      console.log('🔍 Navegando a:', linkElement.getAttribute('href'));
    }
    
    if (this.prefs.animaciones) {
      this.crearEfectoRipple(event);
    }

    // Cerrar menú en vista móvil después de la selección
    if (this.isMobile && this.sidebarColapsada) {
      setTimeout(() => {
        this.toggleSidebar();
      }, 300);
    }
  }

  crearEfectoRipple(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${
      event.clientX - button.getBoundingClientRect().left - radius
    }px`;
    circle.style.top = `${
      event.clientY - button.getBoundingClientRect().top - radius
    }px`;
    circle.classList.add('ink');

    const existingInk = button.querySelector('.ink');
    if (existingInk) {
      existingInk.remove();
    }

    button.appendChild(circle);

    setTimeout(() => {
      circle.remove();
    }, 600);
  }

  getPendingTasks(): number {
    const tareaItem = this.nav.find((item) => item.key === 'tareas');
    return tareaItem?.badge || 0;
  }

  getInitials(nombre: string): string {
    return nombre
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRendimiento(): number {
    return this.datosAlumno?.promedio || 85;
  }

  getTareasPendientes(): number {
    return this.getPendingTasks();
  }

  getAsistencia(): number {
    return this.datosAlumno?.asistencia || 92;
  }

  getPromedio(): number {
    return this.datosAlumno?.promedio || 88;
  }

  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 15;
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  refreshData(): void {
    this.cargarDatosAlumno();
  }

  toggleSidebar(): void {
    this.sidebarColapsada = !this.sidebarColapsada;

    // Forzar reflow para asegurar que las transiciones funcionen
    setTimeout(() => {
      document.body.classList.toggle(
        'sidebar-open',
        this.sidebarColapsada && this.isMobile
      );
    }, 50);
  }

  mostrarEstadisticas(): void {
    // Implementar modal de estadísticas
    alert('🚀 Funcionalidad premium: Estadísticas avanzadas en desarrollo...');
  }

  cerrarSesion(): void {
    if (
      confirm(
        '¿Estás seguro de que deseas cerrar sesión?\nTu progreso se guardará automáticamente.'
      )
    ) {
      localStorage.clear();
      window.location.href = '/auth/login';
    }
  }

  private generarPromedioAleatorio(): number {
    return Math.floor(Math.random() * 20) + 80; // 80-99
  }

  private generarAsistenciaAleatoria(): number {
    return Math.floor(Math.random() * 15) + 85; // 85-99
  }

  private clamp(n: number, min: number, max: number): number {
    if (!isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }
}