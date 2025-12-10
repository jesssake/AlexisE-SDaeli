import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

export type Prioridad = 'alta' | 'media' | 'baja';

export interface Aviso {
  id: number;
  titulo: string;
  contenido: string;
  prioridad: Prioridad;
  activo: boolean;
  fecha_creacion?: string;
}

@Component({
  selector: 'app-estudiantes-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class EstudiantesDashboardComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  // Fecha y hora
  fechaActual = { hora: '', dia: '', mes: '', anio: '' };
  private intervalId: any = null;

  // API avisos (misma que usas en Maestro)
  private apiAvisosBase = 'http://localhost/gestion_e/Aviso';

  avisos: Aviso[] = [];
  loadingAvisos = false;
  errorAvisos = '';

  constructor(private http: HttpClient, private el: ElementRef) {}

  // ================== Ciclo de vida ==================
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

  // ================== Fecha / hora ==================
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

  // ================== Cargar avisos ==================
  cargarAvisos(): void {
    const url = `${this.apiAvisosBase}/avisos_activos.php`;
    this.loadingAvisos = true;
    this.errorAvisos = '';

    this.http.get<any>(url).subscribe({
      next: (r) => {
        const lista = Array.isArray(r) ? r : r?.avisos || [];
        this.avisos = (lista || []).map((a: any) => this.normalizarAviso(a));
      },
      error: (err) => {
        console.error('Error cargando avisos para alumnos:', err);
        if (err?.status === 0) {
          this.errorAvisos = 'Servidor no disponible';
        } else if (err?.status === 404) {
          this.errorAvisos = 'Endpoint de avisos no encontrado';
        } else {
          this.errorAvisos = `Error ${err?.status ?? ''}`;
        }
        this.avisos = [];
      },
    }).add(() => {
      this.loadingAvisos = false;
    });
  }

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
    };
  }

  // ================== Efectos visuales ==================
  private iniciarEfectosHover(): void {
    const cards = this.el.nativeElement.querySelectorAll('.card-formal');
    cards.forEach((card: HTMLElement) => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow =
          '0 10px 15px rgba(0,0,0,.1), 0 4px 6px rgba(0,0,0,.05)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow =
          '0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06)';
      });
    });
  }
}
