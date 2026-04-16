import { Component, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { LoggingService } from '../../../services/logging.service';

interface Seccion {
  id: string;
  titulo: string;
  icono: string;
  contenido: string[];
  abierta?: boolean;
}

interface FAQ {
  q: string;
  a: string;
}

@Component({
  selector: 'app-manual',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.scss']
})
export class ManualComponent {
  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private logger = inject(LoggingService);

  // =====================================================
  // 📋 FORMULARIO DE BÚSQUEDA
  // =====================================================
  form = this.fb.nonNullable.group({ q: '' });
  query = computed(() => this.form.getRawValue().q.trim().toLowerCase());

  // =====================================================
  // 🎯 VARIABLES DE CONTROL
  // =====================================================
  mostrarBotonArriba = false;

  // =====================================================
  // 📚 SECCIONES DEL MANUAL
  // =====================================================
  secciones = signal<Seccion[]>([
    {
      id: 'inicio',
      titulo: 'Inicio rápido',
      icono: '🚀',
      abierta: false,
      contenido: [
        'Inicia sesión con tu usuario y contraseña desde /login.',
        'Selecciona tu rol: Maestro o Estudiante (los Padres consultan desde el menú del Estudiante).',
        'Usa el menú lateral para entrar a Dashboard, Tareas, Asistencia, Calificaciones, Reportes y más.',
        'La interfaz es responsiva: funciona en móvil, tablet y escritorio.'
      ]
    },
    {
      id: 'alumno',
      titulo: 'Rol Estudiante',
      icono: '🎒',
      abierta: false,
      contenido: [
        'Tareas: sube imágenes o PDF, añade título y comentarios para el profesor.',
        'Asistencia: marca Asistí/Falta y envía justificantes con evidencia.',
        'Calificaciones: revisa notas, filtra por materia y exporta a CSV.',
        'Reportes: resumen de asistencias/tareas/calificaciones; imprime en PDF.',
        'Graduación: checklist de requisitos, evidencias y RSVP de ceremonia.'
      ]
    },
    {
      id: 'maestro',
      titulo: 'Rol Maestro',
      icono: '🧑‍🏫',
      abierta: false,
      contenido: [
        'Dashboard: visión general de grupos, tareas y asistencias.',
        'Estudiantes: lista y detalle de alumnos.',
        'Tareas: crea/valida entregas y asigna calificaciones.',
        'Asistencia: pasa lista y valida justificantes.',
        'Reportes: exporta por grupo o materia.'
      ]
    },
    {
      id: 'padres',
      titulo: 'Padres o Tutores',
      icono: '👨‍👩‍👧',
      abierta: false,
      contenido: [
        'Consulta y registra tutores con preferencias de contacto.',
        'Autoriza quién puede recoger al alumno y registro de mensajes.'
      ]
    },
    {
      id: 'navegacion',
      titulo: 'Mapa de navegación',
      icono: '🗺️',
      abierta: false,
      contenido: [
        'Menú principal: Maestro / Alumno.',
        'Alumno → Dashboard, Tareas, Asistencia, Calificaciones, Reportes, Padres, Graduación, Manual, Configuración.',
        'Maestro → Dashboard, Estudiantes, Tareas, Asistencia, Calificaciones, Reportes, Padres, Graduación, Manual, Configuración.',
        'Usa el breadcrumb o el botón Atrás del navegador para regresar.'
      ]
    },
    {
      id: 'atajos',
      titulo: 'Atajos y tips',
      icono: '⌨️',
      abierta: false,
      contenido: [
        'Búsqueda rápida: usa la caja de búsqueda del manual.',
        'Arrastra y suelta archivos en campos de selección (si tu navegador lo permite).',
        'Exportar/Imprimir: botones de CSV y “Imprimir / PDF” en Reportes y Calificaciones.',
        'Accesibilidad: navega con Tab/Enter; los controles tienen foco visible.'
      ]
    },
    {
      id: 'soporte',
      titulo: 'Soporte técnico',
      icono: '🛠️',
      abierta: false,
      contenido: [
        'Si no ves contenido, refresca (Ctrl+R) o revisa tu conexión.',
        'Borra caché si la UI luce desactualizada.',
        'Verifica que los adjuntos sean imagen o PDF.',
        'Contacta a soporte con matrícula, grupo y pantallazo del error.'
      ]
    }
  ]);

  // =====================================================
  // ❓ PREGUNTAS FRECUENTES
  // =====================================================
  faqs = signal<FAQ[]>([
    { q: '¿Cómo subo mi tarea?', a: 'En Alumno > Tareas, completa Título/Descripción, adjunta archivos y pulsa Enviar.' },
    { q: '¿Dónde veo mi calificación?', a: 'En Alumno > Calificaciones. Filtra por materia o exporta CSV.' },
    { q: '¿Cómo justifico una falta?', a: 'En Alumno > Asistencia, usa “Enviar justificante” con evidencia opcional.' },
    { q: '¿Puedo imprimir mis reportes?', a: 'Sí. En Alumno > Reportes, pulsa “Imprimir / PDF”.' },
    { q: '¿Cómo agrego a mis tutores?', a: 'En Alumno > Padres, registra o edita los datos de tus tutores.' },
    { q: '¿Olvidé mi contraseña?', a: 'En la página de login, haz clic en "¿Olvidaste tu contraseña?" y sigue las instrucciones.' },
    { q: '¿Cómo veo mi progreso?', a: 'En Dashboard puedes ver tu progreso general, y en Calificaciones el detalle por materia.' }
  ]);

  // =====================================================
  // 🔍 FILTROS DE BÚSQUEDA
  // =====================================================
  seccionesFiltradas = computed(() => {
    const q = this.query();
    if (!q) return this.secciones();
    return this.secciones()
      .map(s => ({
        ...s,
        contenido: s.contenido.filter(c => 
          c.toLowerCase().includes(q) || 
          s.titulo.toLowerCase().includes(q)
        )
      }))
      .filter(s => s.contenido.length > 0);
  });

  faqsFiltradas = computed(() => {
    const q = this.query();
    if (!q) return this.faqs();
    return this.faqs().filter(f => 
      f.q.toLowerCase().includes(q) || 
      f.a.toLowerCase().includes(q)
    );
  });

  // =====================================================
  // 🎮 FUNCIONES DEL ACORDEÓN
  // =====================================================
  
  /**
   * Alterna la apertura de una sección específica
   * @param id - ID de la sección a alternar
   */
  toggleSeccion(id: string) {
    this.secciones.update(secciones => 
      secciones.map(seccion => 
        seccion.id === id 
          ? { ...seccion, abierta: !seccion.abierta }
          : seccion
      )
    );
  }

  /**
   * Cierra todas las secciones del acordeón
   */
  cerrarTodas() {
    this.secciones.update(secciones => 
      secciones.map(seccion => ({ ...seccion, abierta: false }))
    );
  }

  /**
   * Abre una sección específica y cierra las demás
   * @param id - ID de la sección a abrir
   */
  abrirSeccion(id: string) {
    this.secciones.update(secciones => 
      secciones.map(seccion => ({
        ...seccion,
        abierta: seccion.id === id ? !seccion.abierta : false
      }))
    );
  }

  /**
   * Abre todas las secciones del acordeón
   */
  abrirTodas() {
    this.secciones.update(secciones => 
      secciones.map(seccion => ({ ...seccion, abierta: true }))
    );
  }

  // =====================================================
  // 📊 FUNCIONES DE UTILIDAD
  // =====================================================

  /**
   * Calcula el progreso de lectura basado en secciones abiertas
   * @returns Porcentaje de progreso (0-100)
   */
  calcularProgreso(): number {
    const totalSecciones = this.secciones().length;
    if (totalSecciones === 0) return 0;
    
    const abiertas = this.secciones().filter(s => s.abierta).length;
    return Math.round((abiertas / totalSecciones) * 100);
  }

  /**
   * Cuenta el total de puntos de contenido en todas las secciones
   * @returns Número total de items
   */
  totalContenido(): number {
    return this.secciones().reduce((acc, s) => acc + s.contenido.length, 0);
  }

  /**
   * Obtiene las secciones que tienen contenido destacado
   * @returns Array de secciones con más de 3 items
   */
  seccionesDestacadas() {
    return this.secciones().filter(s => s.contenido.length >= 4);
  }

  // =====================================================
  // 🖱️ FUNCIONES DE NAVEGACIÓN
  // =====================================================

  /**
   * Scroll suave hacia una sección específica
   * @param id - ID de la sección destino
   */
  irA(id: string) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      
      // Opcional: abrir la sección automáticamente
      this.abrirSeccion(id);
    }
  }

  /**
   * Scroll suave al inicio de la página
   */
  scrollToTop() {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  }

  /**
   * Scroll suave al final de la página
   */
  scrollToBottom() {
    window.scrollTo({ 
      top: document.body.scrollHeight, 
      behavior: 'smooth' 
    });
  }

  // =====================================================
  // 🖨️ FUNCIÓN DE IMPRESIÓN
  // =====================================================

  /**
   * Abre el diálogo de impresión del navegador
   */
  imprimir() {
    window.print();
  }

  // =====================================================
  // 📱 FUNCIONES DE RESPONSIVE
  // =====================================================

  /**
   * Detecta si es dispositivo móvil
   * @returns true si el ancho es menor a 768px
   */
  esMovil(): boolean {
    return window.innerWidth < 768;
  }

  /**
   * Detecta si es tablet
   * @returns true si el ancho está entre 768px y 1024px
   */
  esTablet(): boolean {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  }

  /**
   * Detecta si es desktop
   * @returns true si el ancho es mayor o igual a 1024px
   */
  esDesktop(): boolean {
    return window.innerWidth >= 1024;
  }

  // =====================================================
  // 🎨 FUNCIONES DE ESTILO
  // =====================================================

  /**
   * Obtiene la clase CSS para el ícono según el tipo de sección
   * @param id - ID de la sección
   * @returns Clase CSS
   */
  getIconoClase(id: string): string {
    const clases: Record<string, string> = {
      'inicio': 'icono-inicio',
      'alumno': 'icono-alumno',
      'maestro': 'icono-maestro',
      'padres': 'icono-padres',
      'navegacion': 'icono-navegacion',
      'atajos': 'icono-atajos',
      'soporte': 'icono-soporte'
    };
    return clases[id] || 'icono-default';
  }

  /**
   * Obtiene el color de fondo para el badge de la sección
   * @param id - ID de la sección
   * @returns Color en formato hex
   */
  getBadgeColor(id: string): string {
    const colores: Record<string, string> = {
      'inicio': '#3498db',
      'alumno': '#2ecc71',
      'maestro': '#e74c3c',
      'padres': '#f39c12',
      'navegacion': '#9b59b6',
      'atajos': '#1abc9c',
      'soporte': '#e67e22'
    };
    return colores[id] || '#95a5a6';
  }

  // =====================================================
  // 🎧 EVENT LISTENERS
  // =====================================================

  /**
   * Detecta el scroll para mostrar/ocultar el botón de volver arriba
   */
  @HostListener('window:scroll')
  onWindowScroll() {
    this.mostrarBotonArriba = window.scrollY > 400;
  }

  /**
   * Maneja eventos de teclado globales
   * @param event - Evento de teclado
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ctrl+F para enfocar búsqueda
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
    
    // Esc para cerrar todas las secciones
    if (event.key === 'Escape') {
      this.cerrarTodas();
    }
    
    // Ctrl+A para abrir todas (solo en desarrollo)
    if (event.ctrlKey && event.key === 'a' && this.esDesktop()) {
      event.preventDefault();
      this.abrirTodas();
    }
  }

  // =====================================================
  // 🔧 FUNCIONES DE DEBUG - CORREGIDAS
  // =====================================================

  /**
   * Muestra información de debug en consola
   */
  debugInfo() {
    this.logger.group('📚 MANUAL - DEBUG INFO');
    // ✅ CORREGIDO: Quitados todos los puntos y coma
    this.logger.log('Secciones totales:', this.secciones().length);
    this.logger.log('Secciones abiertas:', this.secciones().filter(s => s.abierta).length);
    this.logger.log('Total contenido:', this.totalContenido());
    this.logger.log('Búsqueda actual:', this.query());
    this.logger.log('Resultados búsqueda:', this.seccionesFiltradas().length);
    this.logger.log('FAQs totales:', this.faqs().length);
    this.logger.log('Dispositivo:', this.esMovil() ? 'Móvil' : this.esTablet() ? 'Tablet' : 'Desktop');
    this.logger.groupEnd();
  }

  /**
   * Resetea el manual al estado inicial
   */
  resetManual() {
    this.cerrarTodas();
    this.form.reset({ q: '' });
    this.scrollToTop();
  }
}