// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\Estudiantes\reportes\reportes.component.ts
import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReportesAlumnoService,
  ReporteAlumno,
  ListaResponse,
} from './reportes-alumno.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-reportes-alumno',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesAlumnoComponent implements OnInit {
  // TODO: reemplazar por datos reales del alumno logeado (AuthService)
  alumnoIdDefault = 2;                 // <- usa el id cuando ya lo tengas
  alumnoCorreoDefault = '';            // o correo del tutor para resolver alumno_id

  cargando = signal<boolean>(false);
  errorMsg = signal<string | null>(null);
  okMsg = signal<string | null>(null);

  // filtros
  estado = signal<'' | 'pendiente' | 'revisado' | 'resuelto'>('');
  prioridad = signal<'' | 'baja' | 'media' | 'alta'>('');
  buscar = signal<string>('');

  // datos
  alumnoId = signal<number>(this.alumnoIdDefault);
  conteo = signal<ListaResponse['conteo'] | null>(null);
  reportes = signal<ReporteAlumno[]>([]);
  seleccion: ReporteAlumno | null = null;

  totalFiltrados = computed(() => this.reportes().length);

  constructor(private srv: ReportesAlumnoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorMsg.set(null);
    this.okMsg.set(null);

    this.srv
      .listar({
        alumno_id: this.alumnoId(),
        correo: this.alumnoCorreoDefault || undefined,
        estado: this.estado() || undefined,
        prioridad: this.prioridad() || undefined,
      })
      .subscribe({
        next: (resp) => {
          if (!resp.ok) {
            this.errorMsg.set('No se pudieron cargar los reportes.');
            this.reportes.set([]);
            this.conteo.set(null);
          } else {
            // Mapea acciones_tomadas→acciones si viniera en ver.php
            const list = (resp.reportes || []).map(r => ({
              ...r,
              acciones: (r as any).acciones_tomadas ?? r.acciones ?? null,
            }));
            // Filtro local adicional por texto
            const q = (this.buscar() || '').toLowerCase();
            const f =
              q.length > 0
                ? list.filter(
                    (r) =>
                      r.motivo.toLowerCase().includes(q) ||
                      (r.descripcion || '').toLowerCase().includes(q) ||
                      r.tipo.toLowerCase().includes(q)
                  )
                : list;

            this.reportes.set(f);
            this.conteo.set(resp.conteo);
          }
          this.cargando.set(false);
        },
        error: () => {
          this.errorMsg.set('Error de red al cargar reportes.');
          this.reportes.set([]);
          this.conteo.set(null);
          this.cargando.set(false);
        },
      });
  }

  limpiarFiltros(): void {
    this.estado.set('');
    this.prioridad.set('');
    this.buscar.set('');
    this.cargar();
  }

  verDetalle(rep: ReporteAlumno): void {
    this.seleccion = rep;
  }

  cerrarDetalle(): void {
    this.seleccion = null;
  }

  marcarLeido(rep: ReporteAlumno): void {
    this.srv.marcarLeido(this.alumnoId(), rep.id).subscribe({
      next: (r) => {
        if (r.ok) {
          this.okMsg.set('Marcado como leído ✔');
          // reflectir en UI sin recargar todo
          this.reportes.update(arr =>
            arr.map(x => (x.id === rep.id ? { ...x, leido: 1, visto_en: new Date().toISOString() } : x))
          );
        } else {
          this.errorMsg.set('No se pudo marcar como leído.');
        }
      },
      error: () => this.errorMsg.set('Error al marcar como leído.'),
    });
  }

  exportar(): void {
    this.srv.exportarWord(this.alumnoId(), this.estado() || undefined, this.prioridad() || undefined);
  }

  badgeEstado(est: ReporteAlumno['estado']): string {
    return {
      pendiente: 'badge warn',
      revisado: 'badge info',
      resuelto: 'badge success',
    }[est];
  }

  badgePrioridad(p: ReporteAlumno['prioridad']): string {
    return {
      baja: 'chip low',
      media: 'chip med',
      alta: 'chip high',
    }[p];
  }
}
