import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggingService } from '../../../services/logging.service';

interface SeccionManual {
  id: string;
  titulo: string;
  icono: string;
  descripcion: string;
  pasos: string[];
  consejos?: string[];
}

@Component({
  selector: 'app-manual',
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ManualComponent implements OnInit {
  secciones: SeccionManual[] = [
    {
      id: 'dashboard',
      titulo: 'Dashboard',
      icono: '📊',
      descripcion: 'Vea un resumen de actividades, tareas y accesos rápidos.',
      pasos: [
        'Al iniciar sesión, serás dirigido automáticamente al Dashboard',
        'Revisa las tarjetas de resumen para ver estadísticas rápidas',
        'Utiliza los accesos directos para navegar rápidamente a otras secciones',
        'Consulta el calendario de actividades próximas',
        'Revisa las tareas pendientes de calificación'
      ],
      consejos: [
        'Personaliza tu dashboard arrastrando las tarjetas',
        'Usa el buscador rápido para acceder a funciones específicas'
      ]
    },
    {
      id: 'estudiantes',
      titulo: 'Estudiantes',
      icono: '👨‍🎓',
      descripcion: 'Añada, elimine y gestione estudiantes.',
      pasos: [
        'Haz clic en "Estudiantes" en el menú lateral',
        'Para agregar un estudiante: presiona "Nuevo Estudiante"',
        'Completa el formulario con los datos requeridos',
        'Para editar: haz clic en el ícono de edición junto al estudiante',
        'Para eliminar: usa el ícono de papelera (requiere confirmación)',
        'Filtra estudiantes por grado o nombre usando la barra de búsqueda'
      ],
      consejos: [
        'Importa listas de estudiantes usando el botón de importación',
        'Exporta la lista completa en formato CSV o Excel'
      ]
    },
    {
      id: 'tareas',
      titulo: 'Tareas',
      icono: '📝',
      descripcion: 'Asigne y califique tareas, y gestione materias.',
      pasos: [
        'Navega a la sección "Tareas" desde el menú',
        'Para crear una tarea: presiona "Nueva Tarea"',
        'Selecciona la materia, fecha de entrega y estudiantes',
        'Adjunta archivos si es necesario',
        'Para calificar: haz clic en "Calificar" junto a cada tarea enviada',
        'Revisa el historial de tareas por estudiante'
      ],
      consejos: [
        'Programa tareas recurrentes para ahorrar tiempo',
        'Usa plantillas predefinidas para tareas comunes'
      ]
    },
    {
      id: 'asistencia',
      titulo: 'Asistencia',
      icono: '✅',
      descripcion: 'Registre la asistencia diaria de los estudiantes.',
      pasos: [
        'Accede a "Asistencia" en el menú principal',
        'Selecciona la fecha y el grupo/clase',
        'Marca la asistencia: Presente, Ausente, Justificado',
        'Guarda los cambios automáticamente',
        'Consulta reportes de asistencia por período',
        'Exporta registros para análisis'
      ],
      consejos: [
        'Usa los atajos de teclado para marcar asistencia rápidamente',
        'Configura alertas automáticas para ausencias repetidas'
      ]
    },
    {
      id: 'calificaciones',
      titulo: 'Calificaciones',
      icono: '📚',
      descripcion: 'Ingrese y gestione calificaciones por materia y trimestre.',
      pasos: [
        'Dirígete a "Calificaciones" en el menú',
        'Selecciona el período académico (trimestre, semestre)',
        'Elige la materia y el grupo',
        'Ingresa las calificaciones en el sistema de notas',
        'Calcula promedios automáticamente',
        'Genera boletines de calificaciones'
      ],
      consejos: [
        'Configura tu escala de calificación en Configuración',
        'Usa la función de copiar calificaciones para evaluaciones similares'
      ]
    },
    {
      id: 'reportes',
      titulo: 'Reportes',
      icono: '📋',
      descripcion: 'Genere y exporte reportes académicos o disciplinarios.',
      pasos: [
        'Accede a "Reportes" desde el menú lateral',
        'Selecciona el tipo de reporte: Académico, Conducta, Asistencia',
        'Define el período y los filtros necesarios',
        'Previsualiza el reporte antes de exportar',
        'Exporta en PDF, Excel o comparte por email',
        'Programa reportes automáticos si es necesario'
      ],
      consejos: [
        'Guarda plantillas de reportes para uso futuro',
        'Personaliza los campos que aparecen en cada reporte'
      ]
    },
    {
      id: 'padres',
      titulo: 'Padres',
      icono: '👨‍👩‍👧‍👦',
      descripcion: 'Administre la información de contacto de los padres.',
      pasos: [
        'Navega a "Padres" en el menú principal',
        'Visualiza la lista de padres/tutores registrados',
        'Agrega nuevos contactos de padres',
        'Actualiza información de contacto existente',
        'Establece el parentesco con cada estudiante',
        'Envía comunicaciones masivas o individuales'
      ],
      consejos: [
        'Importa contactos desde una hoja de cálculo',
        'Usa grupos de contactos para comunicaciones por grado'
      ]
    },
    {
      id: 'graduacion',
      titulo: 'Graduación',
      icono: '🎓',
      descripcion: 'Genere certificados y constancias de estudios.',
      pasos: [
        'Accede a "Graduación" en el menú',
        'Selecciona el tipo de certificado: Excelencia o Cierre',
        'Elige los estudiantes que recibirán el certificado',
        'Personaliza el contenido del certificado',
        'Previsualiza antes de generar',
        'Descarga en PDF o envía por email directamente'
      ],
      consejos: [
        'Guarda plantillas de certificados para uso futuro',
        'Usa la función de envío masivo para ahorrar tiempo'
      ]
    },
    {
      id: 'configuracion',
      titulo: 'Configuración',
      icono: '⚙️',
      descripcion: 'Personalice el tema y las notificaciones.',
      pasos: [
        'Haz clic en "Configuración" en el menú inferior',
        'Ajusta el tema: claro, oscuro o automático',
        'Configura notificaciones por email y en la app',
        'Personaliza tu perfil de usuario',
        'Gestiona preferencias del sistema',
        'Configura períodos académicos y materias'
      ],
      consejos: [
        'Exporta tu configuración para respaldo',
        'Revisa las actualizaciones del sistema regularmente'
      ]
    }
  ];

  seccionActiva: string = 'dashboard';

  constructor(private logger: LoggingService) { }

  ngOnInit(): void { }

  cambiarSeccion(seccionId: string): void {
    this.seccionActiva = seccionId;
    // Scroll suave a la sección
    setTimeout(() => {
      const elemento = document.getElementById(seccionId);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  obtenerSeccionActiva(): SeccionManual {
    return this.secciones.find(seccion => seccion.id === this.seccionActiva) || this.secciones[0];
  }

  descargarManualPDF(): void {
    alert('Descargando manual completo en PDF...');
    // En una aplicación real, aquí se generaría el PDF
    this.logger.log('Generando PDF del manual...');
  }

  imprimirManual(): void {
    window.print();
  }
}