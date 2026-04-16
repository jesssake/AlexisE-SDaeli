﻿// C:\Codigos\HTml\AlexisE-SDaeli-main\AlexisE-SDaeli-main\frontend\src\app\features\Estudiantes\menu-alumno\menu-alumno.component.ts
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
import { Router, RouterModule } from '@angular/router';
import { LoggingService } from '../../../services/logging.service';

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

  constructor(
    private http: HttpClient,
    private router: Router,
    private logger: LoggingService
  ) {}

  ngOnInit(): void {
    // ⚡ Fondo especial para MENÚ ESTUDIANTE
    document.body.classList.remove('login-page');
    document.body.classList.add('estudiante-page');

    this.checkMobileView();
    
    // ✅ CORRECCIÓN: En móvil, la sidebar debe estar oculta inicialmente
    if (this.isMobile) {
      this.sidebarColapsada = true;
      this.logger.log('📱 Modo móvil detectado - menú oculto inicialmente');
    } else {
      this.sidebarColapsada = false;
      this.logger.log('💻 Modo desktop detectado - menú visible');
    }
    
    this.cargarDatosAlumno();
    this.cargarPrefs();
    this.aplicarTema();
    this.inicializarAnimaciones();
    
    // ✅ Mostrar en consola los datos del estudiante para debug
    this.mostrarInfoEstudiante();
  }

  ngAfterViewInit(): void {
    this.crearParticulas();
    
    setTimeout(() => {
      this.checkMobileView();
      if (this.isMobile) {
        this.sidebarColapsada = true;
      }
      this.logger.log('📱 AfterViewInit - isMobile:', this.isMobile, 'sidebarColapsada:', this.sidebarColapsada);
    }, 100);
  }

  ngOnDestroy(): void {
    document.body.classList.remove('estudiante-page');
  }

  @HostListener('window:resize')
  onResize(): void {
    const wasMobile = this.isMobile;
    this.checkMobileView();
    
    if (this.isMobile !== wasMobile) {
      if (this.isMobile) {
        this.sidebarColapsada = true;
      } else {
        this.sidebarColapsada = false;
      }
      this.logger.log('🔄 Cambio de orientación/dimensión - isMobile:', this.isMobile);
    }
  }

  checkMobileView(): void {
    this.isMobile = window.innerWidth <= 1024;
    this.logger.log('📱 Check mobile view:', {
      width: window.innerWidth,
      isMobile: this.isMobile
    });
  }

  isMobileView(): boolean {
    return this.isMobile;
  }

  // ✅ CORREGIDO: Quitados puntos y coma dentro de sessionStorage.getItem
  private mostrarInfoEstudiante(): void {
    this.logger.group('👨‍🎓 INFORMACIÓN DEL ESTUDIANTE');
    this.logger.log('📊 Datos del alumno:', this.datosAlumno);
    this.logger.log('📦 sessionStorage:');
    this.logger.log('  - userId:', sessionStorage.getItem('userId'));
    this.logger.log('  - userNombre:', sessionStorage.getItem('userNombre'));
    this.logger.log('  - ninoNombre:', sessionStorage.getItem('ninoNombre'));
    this.logger.log('  - userEmail:', sessionStorage.getItem('userEmail'));
    this.logger.log('  - userRole:', sessionStorage.getItem('userRole'));
    this.logger.log('  - tutorId:', sessionStorage.getItem('tutorId'));
    this.logger.groupEnd();
  }

  // ✅ CORREGIDO: Usar sessionStorage y obtener datos correctamente
  cargarDatosAlumno(): void {
    // Obtener datos de sessionStorage (no localStorage)
    const userId = sessionStorage.getItem('userId');
    const userEmail = sessionStorage.getItem('userEmail');
    const userNombre = sessionStorage.getItem('userNombre');
    const userRole = sessionStorage.getItem('userRole');
    const tutorId = sessionStorage.getItem('tutorId');
    const ninoNombre = sessionStorage.getItem('ninoNombre');
    
    this.logger.log('🔍 Cargando datos del alumno desde sessionStorage:');
    this.logger.log('  - userId:', userId);
    this.logger.log('  - userRole:', userRole);
    this.logger.log('  - ninoNombre:', ninoNombre);
    this.logger.log('  - userNombre:', userNombre);
    this.logger.log('  - userEmail:', userEmail);
    this.logger.log('  - tutorId:', tutorId);
    
    // Verificar si hay sesión
    if (!userId && !userEmail) {
      this.error = 'No se encontró la sesión del estudiante. Por favor, inicia sesión nuevamente.';
      this.logger.error('❌ No hay sesión activa en sessionStorage');
      return;
    }

    this.cargando = true;
    this.error = null;

    // ✅ CORRECCIÓN: El nombre del alumno puede venir de varias fuentes
    let nombreAlumno = '';
    let nombreTutor = '';
    
    // Prioridad: 1. ninoNombre (nombre del niño), 2. userNombre (nombre del tutor)
    if (ninoNombre && ninoNombre !== 'null' && ninoNombre !== 'undefined') {
      nombreAlumno = ninoNombre;
      this.logger.log('✅ Nombre del alumno desde ninoNombre:', nombreAlumno);
    } else if (userNombre) {
      // Si el usuario es tutor, mostrar "Tutor: [nombre]"
      if (userRole === 'tutor') {
        nombreAlumno = `Estudiante de ${userNombre}`;
        nombreTutor = userNombre;
        this.logger.log('✅ Usando nombre del tutor como referencia:', nombreAlumno);
      } else {
        nombreAlumno = userNombre;
        this.logger.log('✅ Nombre desde userNombre:', nombreAlumno);
      }
    } else {
      nombreAlumno = 'Estudiante';
      this.logger.log('⚠️ Usando nombre por defecto: Estudiante');
    }
    
    // Nombre del tutor (si es tutor, usar userNombre, si no, usar tutorId para buscar)
    if (userRole === 'tutor' && userNombre) {
      nombreTutor = userNombre;
    } else {
      nombreTutor = 'Tutor';
    }
    
    this.datosAlumno = {
      alumno_nombre: nombreAlumno,
      tutor_nombre: nombreTutor,
      correo_tutor: userEmail || '',
      fecha_nacimiento: sessionStorage.getItem('fecha_nacimiento') || '',
      condiciones_medicas: sessionStorage.getItem('ninoCondiciones') || 'Sin información',
      grado: sessionStorage.getItem('grado') || '',
      seccion: sessionStorage.getItem('seccion') || '',
      promedio: this.generarPromedioAleatorio(),
      asistencia: this.generarAsistenciaAleatoria(),
    };
    
    this.logger.log('✅ Datos del alumno cargados:', this.datosAlumno);
    this.cargando = false;
    this.mostrarInfoEstudiante();
  }

  cargarPrefs(): void {
    try {
      const raw = sessionStorage.getItem('prefs_estudiante');
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
      this.logger.warn('Error loading preferences:', error);
    }

    this.aplicarPreferencias();
  }

  guardarPrefs(): void {
    try {
      sessionStorage.setItem('prefs_estudiante', JSON.stringify(this.prefs));
    } catch (error) {
      this.logger.error('Error saving preferences:', error);
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

  // ✅ CORREGIDO: Quitado punto y coma dentro de getAttribute
  onItemClick(event: MouseEvent): void {
    const linkElement = (event.currentTarget as HTMLElement).closest('a');
    if (linkElement) {
      this.logger.log('🔍 Navegando a:', linkElement.getAttribute('href'));
    }
    
    if (this.isMobile && !this.sidebarColapsada) {
      setTimeout(() => {
        this.toggleSidebar();
      }, 300);
    }
  }

  getPendingTasks(): number {
    const tareaItem = this.nav.find((item) => item.key === 'tareas');
    return tareaItem?.badge || 0;
  }

  getInitials(nombre: string): string {
    if (!nombre) return '??';
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
    
    this.logger.log('🔄 Toggle sidebar:', {
      isMobile: this.isMobile,
      sidebarColapsada: this.sidebarColapsada,
      estado: this.sidebarColapsada ? 'oculto' : 'visible'
    });

    if (this.isMobile) {
      if (!this.sidebarColapsada) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  mostrarEstadisticas(): void {
    alert('🚀 Funcionalidad premium: Estadísticas avanzadas en desarrollo...');
  }

  cerrarSesion(): void {
    if (
      confirm(
        '¿Estás seguro de que deseas cerrar sesión?\nTu progreso se guardará automáticamente.'
      )
    ) {
      sessionStorage.clear();
      
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
      
      this.router.navigate(['/auth/login'], { 
        queryParams: { logout: 'true' },
        replaceUrl: true 
      }).then(() => {
        window.location.reload();
      });
    }
  }

  private generarPromedioAleatorio(): number {
    return Math.floor(Math.random() * 20) + 80;
  }

  private generarAsistenciaAleatoria(): number {
    return Math.floor(Math.random() * 15) + 85;
  }

  private clamp(n: number, min: number, max: number): number {
    if (!isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }
}