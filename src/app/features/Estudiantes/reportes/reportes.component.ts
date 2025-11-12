import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AuthService, AlumnoLight } from './auth.service';
import { ReportesAlumnoService, ReporteAlumno } from './reportes-alumno.service';

@Component({
  selector: 'app-reportes-alumno',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesAlumnoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth  = inject(AuthService);
  private srv   = inject(ReportesAlumnoService);

  cargando = signal(false);
  errorMsg = signal<string | null>(null);
  okMsg    = signal<string | null>(null);

  alumno = signal<AlumnoLight | null>(null);
  reportes = signal<ReporteAlumno[]>([]);

  hijos = signal<Array<{id:number; nombre:string}>>([]);
  hijoSeleccionado = signal<number | null>(null);

  filtroEstado = signal<'todos' | 'pendiente' | 'revisado' | 'resuelto'>('todos');
  filtroPrioridad = signal<'todas' | 'baja' | 'media' | 'alta'>('todas');

  filtrados = computed(() => {
    const E = this.filtroEstado(); const P = this.filtroPrioridad();
    return this.reportes().filter(r => {
      if (E !== 'todos' && r.estado !== E) return false;
      if (P !== 'todas' && r.prioridad !== P) return false;
      return true;
    });
  });

  kpiTotal = computed(() => this.reportes().length);
  kpiPend  = computed(() => this.reportes().filter(r => r.estado==='pendiente').length);
  kpiRev   = computed(() => this.reportes().filter(r => r.estado==='revisado').length);
  kpiRes   = computed(() => this.reportes().filter(r => r.estado==='resuelto').length);
  kpiAlta  = computed(() => this.reportes().filter(r => r.prioridad==='alta').length);

  async ngOnInit() {
    // 1) Forzado por URL (para pruebas rápidas)
    const qId = Number(this.route.snapshot.queryParamMap.get('alumno_id') || 0);
    if (qId > 0) {
      this.alumno.set({ id: qId, nombre: 'Alumno' });
      await this.cargar(qId);
      return;
    }

    // 2) Desde el menú/localStorage (puede ser ALUMNO o TUTOR)
    const u = this.auth.alumnoActual();
    if (u) {
      const rol = u.rol?.toUpperCase() || u.tipo?.toUpperCase() || '';
      if (rol === 'TUTOR') {
        // TUTOR: listar hijos
        this.cargando.set(true);
        try {
          const hijos = await this.srv.getHijosDeTutor(Number((u as any).id));
          this.hijos.set(hijos);
          if (hijos.length === 1) {
            const h = hijos[0];
            this.hijoSeleccionado.set(h.id);
            this.alumno.set({ id: h.id, nombre: h.nombre });
            await this.cargar(h.id);
          } else if (hijos.length > 1) {
            this.ok('Selecciona un alumno.');
          } else {
            this.error('Este tutor no tiene alumnos vinculados.');
          }
        } catch {
          this.error('No se pudieron cargar los alumnos del tutor.');
        } finally {
          this.cargando.set(false);
        }
        return;
      }

      // ALUMNO directo
      this.alumno.set(u);
      await this.cargar(u.id, u.email || undefined);
      return;
    }

    this.error('No se detectó alumno. Abre desde el menú autenticado o pasa ?alumno_id=');
  }

  async onSeleccionHijo(idStr: string) {
    const id = Number(idStr);
    this.hijoSeleccionado.set(id);
    const h = this.hijos().find(x => x.id === id);
    if (h) {
      this.alumno.set({ id: h.id, nombre: h.nombre });
      await this.cargar(h.id);
    }
  }

  async cargar(alumnoId: number, email?: string) {
    try {
      this.cargando.set(true);
      let data = await this.srv.getPorAlumnoId(alumnoId);
      if ((!data || !data.length) && email) {
        data = await this.srv.getPorEmail(email);
      }
      this.reportes.set(data);
      if (!data.length) this.ok('No hay reportes para mostrar.');
    } catch {
      this.error('No se pudieron cargar tus reportes.');
    } finally {
      this.cargando.set(false);
    }
  }

  descargarWord(id: number){ this.srv.descargarWord(id); }
  formatearFecha(iso: string){ try { return new Date(iso).toLocaleDateString('es-MX'); } catch { return iso; } }

  private ok(m:string){ this.okMsg.set(m); setTimeout(()=>this.okMsg.set(null), 2200); }
  private error(m:string){ this.errorMsg.set(m); setTimeout(()=>this.errorMsg.set(null), 3200); }
}
