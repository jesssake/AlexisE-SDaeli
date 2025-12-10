// ============================================
// ReportesAlumnoComponent (VERSIÃ“N FINAL)
// Totalmente compatible con AuthService global
// ============================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { AuthService, Usuario } from '../../../core/services/auth.service';
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

  // =============== SIGNALS PRINCIPALES ===============
  cargando = signal(false);
  errorMsg = signal<string | null>(null);
  okMsg    = signal<string | null>(null);

  alumno = signal<Usuario | null>(null);
  reportes = signal<ReporteAlumno[]>([]);

  // Hijos (si es tutor)
  hijos = signal<Array<{ id: number; nombre: string }>>([]);
  hijoSeleccionado = signal<number | null>(null);

  // Filtros
  filtroEstado = signal<'todos' | 'pendiente' | 'revisado' | 'resuelto'>('todos');
  filtroPrioridad = signal<'todas' | 'baja' | 'media' | 'alta'>('todas');

  // =============== FILTRADOS ===============
  filtrados = computed(() => {
    const E = this.filtroEstado();
    const P = this.filtroPrioridad();
    return this.reportes().filter(r => {
      if (E !== 'todos' && r.estado !== E) return false;
      if (P !== 'todas' && r.prioridad !== P) return false;
      return true;
    });
  });

  // =============== KPIs ===============
  kpiTotal = computed(() => this.reportes().length);
  kpiPend  = computed(() => this.reportes().filter(r => r.estado === 'pendiente').length);
  kpiRev   = computed(() => this.reportes().filter(r => r.estado === 'revisado').length);
  kpiRes   = computed(() => this.reportes().filter(r => r.estado === 'resuelto').length);
  kpiAlta  = computed(() => this.reportes().filter(r => r.prioridad === 'alta').length);

  // =====================================================================
  // INIT
  // =====================================================================
  async ngOnInit() {

    // 1ï¸âƒ£ Si viene en la URL (modo prueba)
    const qId = Number(this.route.snapshot.queryParamMap.get('alumno_id') || 0);

    if (qId > 0) {
      this.alumno.set({
        id: qId,
        nombre: 'Alumno',
        email: 'alumno@ejemplo.com',
        rol: 'ALUMNO',
      });
      await this.cargar(qId);
      return;
    }

    // 2ï¸âƒ£ Obtener usuario del LOGIN REAL
    const user = this.auth.currentUser;

    if (!user) {
      this.error('No hay sesiÃ³n activa.');
      return;
    }

    const rol = user.rol.toUpperCase();

    // ===============================
    // CASO TUTOR
    // ===============================
    if (rol === 'TUTOR') {
      try {
        this.cargando.set(true);

        const hijos = await this.srv.getHijosDeTutor(user.id);
        this.hijos.set(hijos);

        // 1 hijo â†’ carga automÃ¡tica
        if (hijos.length === 1) {
          const h = hijos[0];
          this.hijoSeleccionado.set(h.id);

          this.alumno.set({
            id: h.id,
            nombre: h.nombre,
            email: user.email,
            rol: 'ALUMNO',
          });

          await this.cargar(h.id);
        }

        // Varios hijos â†’ pide selecciÃ³n
        else if (hijos.length > 1) {
          this.ok('Selecciona un alumno.');
        }

        // NingÃºn hijo
        else {
          this.error('Este tutor no tiene alumnos ligados.');
        }

      } catch {
        this.error('Error al obtener hijos del tutor.');
      } finally {
        this.cargando.set(false);
      }

      return;
    }

    // ===============================
    // CASO ALUMNO NORMAL
    // ===============================
    if (this.auth.isStudent()) {
      const alumnoId = user.alumnoId ?? user.id;

      this.alumno.set(user);
      await this.cargar(alumnoId, user.email);
      return;
    }

    // Si NO es alumno NI tutor
    this.error('Acceso permitido solo para alumnos o tutores.');
  }

  // =====================================================================
  // CARGA PRINCIPAL
  // =====================================================================
  async cargar(alumnoId: number, email?: string) {
    try {
      this.cargando.set(true);

      // 1) Por id
      let data = await this.srv.getPorAlumnoId(alumnoId);

      // 2) Fallback por email
      if (!data.length && email) {
        data = await this.srv.getPorEmail(email);
      }

      this.reportes.set(data);

      if (!data.length) this.ok('No hay reportes para mostrar.');

    } catch {
      this.error('No se pudieron cargar los reportes.');
    } finally {
      this.cargando.set(false);
    }
  }

  // =====================================================================
  // CAMBIO DE HIJO (solo tutor)
  // =====================================================================
  async onSeleccionHijo(idStr: string | number) {
    const id = Number(idStr);
    this.hijoSeleccionado.set(id);

    const h = this.hijos().find(x => x.id === id);
    if (!h) return;

    this.alumno.set({
      id: h.id,
      nombre: h.nombre,
      email: '',
      rol: 'ALUMNO',
    });

    await this.cargar(h.id);
  }

  // =====================================================================
  // DESCARGAR WORD POR ID
  // =====================================================================
  descargarWord(id: number) {
    this.srv.descargarWord(id);
  }

  // =====================================================================
  // UTILIDADES
  // =====================================================================
  formatearFecha(iso: string) {
    try { return new Date(iso).toLocaleDateString('es-MX'); }
    catch { return iso; }
  }

  private ok(m: string) {
    this.okMsg.set(m);
    setTimeout(() => this.okMsg.set(null), 2200);
  }

  private error(m: string) {
    this.errorMsg.set(m);
    setTimeout(() => this.errorMsg.set(null), 3200);
  }
}


