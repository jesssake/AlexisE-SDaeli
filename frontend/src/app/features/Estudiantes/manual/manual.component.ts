import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

interface Seccion {
  id: string;
  titulo: string;
  icono: string;
  contenido: string[];
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
  // Inyección directa para usar en inicializadores
  private fb = inject(FormBuilder);

  // Barra de búsqueda (no-nullable para evitar string|null)
  form = this.fb.nonNullable.group({ q: '' });
  query = computed(() => this.form.getRawValue().q.trim().toLowerCase());

  constructor() {}

  // Secciones principales del manual
  secciones = signal<Seccion[]>([
    {
      id: 'inicio',
      titulo: 'Inicio rápido',
      icono: '🚀',
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
      contenido: [
        'Consulta y registra tutores con preferencias de contacto.',
        'Autoriza quién puede recoger al alumno y registro de mensajes.'
      ]
    },
    {
      id: 'navegacion',
      titulo: 'Mapa de navegación',
      icono: '🗺️',
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
      contenido: [
        'Si no ves contenido, refresca (Ctrl+R) o revisa tu conexión.',
        'Borra caché si la UI luce desactualizada.',
        'Verifica que los adjuntos sean imagen o PDF.',
        'Contacta a soporte con matrícula, grupo y pantallazo del error.'
      ]
    }
  ]);

  // FAQs
  faqs = signal<FAQ[]>([
    { q: '¿Cómo subo mi tarea?', a: 'En Alumno > Tareas, completa Título/Descripción, adjunta archivos y pulsa Enviar.' },
    { q: '¿Dónde veo mi calificación?', a: 'En Alumno > Calificaciones. Filtra por materia o exporta CSV.' },
    { q: '¿Cómo justifico una falta?', a: 'En Alumno > Asistencia, usa “Enviar justificante” con evidencia opcional.' },
    { q: '¿Puedo imprimir mis reportes?', a: 'Sí. En Alumno > Reportes, pulsa “Imprimir / PDF”.' },
    { q: '¿Cómo agrego a mis tutores?', a: 'En Alumno > Padres, registra o edita los datos de tus tutores.' }
  ]);

  // Derivados con filtro de búsqueda
  seccionesFiltradas = computed(() => {
    const q = this.query();
    if (!q) return this.secciones();
    return this.secciones()
      .map(s => ({
        ...s,
        contenido: s.contenido.filter(c => c.toLowerCase().includes(q) || s.titulo.toLowerCase().includes(q))
      }))
      .filter(s => s.contenido.length > 0);
  });

  faqsFiltradas = computed(() => {
    const q = this.query();
    if (!q) return this.faqs();
    return this.faqs().filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  });

  // Acciones UI
  irA(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  imprimir() {
    window.print();
  }
}
