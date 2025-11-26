import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  ReportesService,
  ReporteDTO,
  EstudianteOpt,
  TipoReporte,
  EstadoReporte,
  Prioridad
} from './reportes.service';

type EncabezadoSettings = {
  escuela: string;
  direccion: string;
  telefono: string;
  maestro: string;
  grupo: string;
  citaFecha: string; // YYYY-MM-DD
  citaHora: string;  // HH:mm
  logoUrl: string;   // ruta relativa devuelta por upload
  folioActual: number;
};

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesComponent implements OnInit {

  // ===== Datos =====
  estudiantes: EstudianteOpt[] = [];
  reportes: ReporteDTO[] = [];

  resumen = { total: 0, pendientes: 0, resueltos: 0, altaPrioridad: 0 };
  maestroId = 1;

  // Catálogos
  tiposReporte = [
    { valor: 'academico' as TipoReporte, nombre: 'Académico', icono: '📚' },
    { valor: 'conducta'  as TipoReporte, nombre: 'Conducta',  icono: '👥' },
    { valor: 'asistencia'as TipoReporte, nombre: 'Asistencia',icono: '✅' },
    { valor: 'personal'  as TipoReporte, nombre: 'Personal',  icono: '💬' },
    { valor: 'salud'     as TipoReporte, nombre: 'Salud',     icono: '🏥' },
    { valor: 'familiar'  as TipoReporte, nombre: 'Familiar',  icono: '👨‍👩‍👧‍👦' },
  ];

  nivelesPrioridad = [
    { valor: 'baja'  as Prioridad, nombre: 'Baja',  color: '#27ae60' },
    { valor: 'media' as Prioridad, nombre: 'Media', color: '#f39c12' },
    { valor: 'alta'  as Prioridad, nombre: 'Alta',  color: '#e74c3c' },
  ];

  estadosReporte = [
    { valor: 'pendiente' as EstadoReporte, nombre: 'Pendiente', color: '#f39c12' },
    { valor: 'revisado'  as EstadoReporte, nombre: 'Revisado',  color: '#3498db' },
    { valor: 'resuelto'  as EstadoReporte, nombre: 'Resuelto',  color: '#27ae60' },
  ];

  // Formulario
  nuevoReporte = {
    tipo: '' as '' | TipoReporte,
    estudianteId: 0,
    motivo: '',
    descripcion: '',
    prioridad: 'media' as Prioridad,
  };

  // Filtros
  filtroTipo: 'todos' | TipoReporte = 'todos';
  filtroEstado: 'todos' | EstadoReporte = 'todos';
  filtroPrioridad: 'todos' | Prioridad = 'todos';
  filtroEstudiante = 0;

  // UI
  cargando = false;
  guardando = false;
  logoSubiendo = false;

  // Modal (opcional)
  reporteSeleccionado: ReporteDTO | null = null;
  mostrarModal = false;

  // ===== Encabezado / Folio (persisten en localStorage) =====
  private SETTINGS_KEY = 'reportes.settings.v1';
  private FOLIO_KEY    = 'reportes.folio.v1';

  settings: EncabezadoSettings = {
    escuela: 'COLEGIO NUEVOS HORIZONTES',
    direccion: 'Calle Ejemplo #123, Col. Centro, C.P. 00000',
    telefono: '(000) 000 00 00',
    maestro: 'Maestra/O',
    grupo: '3° A',
    citaFecha: '', // opcional
    citaHora: '',  // opcional
    logoUrl: '',   // opcional
    folioActual: 1,
  };

  constructor(private api: ReportesService) {}

  ngOnInit(): void {
    this.cargarTodo();
    this.cargarSettings();
    this.cargarFolio();
  }

  // ================== Carga inicial ==================
  private cargarTodo() {
    this.cargando = true;

    this.api.getEstudiantes().subscribe({
      next: (arr) => (this.estudiantes = arr || []),
      error: () => (this.estudiantes = []),
    });

    this.api.getReportes({ maestroId: this.maestroId, resumen: 1 }).subscribe({
      next: (r) => {
        this.reportes = r.data || [];
        this.resumen = r.summary ?? this.recuentoLocal();
        this.cargando = false;
      },
      error: () => {
        this.reportes = [];
        this.resumen = this.recuentoLocal();
        this.cargando = false;
      },
    });
  }

  private recuentoLocal() {
    return {
      total: this.reportes.length,
      pendientes: this.reportes.filter(x => x.estado === 'pendiente').length,
      resueltos: this.reportes.filter(x => x.estado === 'resuelto').length,
      altaPrioridad: this.reportes.filter(x => x.prioridad === 'alta').length,
    };
  }

  // ================== Helpers KPI (tests) ==================
  obtenerCantidadPendientes(): number { return this.reportes.filter(r => r.estado === 'pendiente').length; }
  obtenerCantidadResueltos(): number  { return this.reportes.filter(r => r.estado === 'resuelto').length; }
  obtenerCantidadAltaPrioridad(): number { return this.reportes.filter(r => r.prioridad === 'alta').length; }
  obtenerTotalReportes(): number { return this.reportes.length; }

  // ================== Crear ==================
  crearReporte(): void {
    if (!this.validarReporte()) return;
    this.guardando = true;

    this.api.crear({
      tipo: this.nuevoReporte.tipo as TipoReporte,
      estudianteId: this.nuevoReporte.estudianteId,
      motivo: this.nuevoReporte.motivo.trim(),
      descripcion: this.nuevoReporte.descripcion.trim(),
      prioridad: this.nuevoReporte.prioridad,
      maestroId: this.maestroId,
    }).subscribe({
      next: () => { this.guardando = false; this.limpiarFormulario(); this.cargarTodo(); },
      error: () => { this.guardando = false; alert('Error al crear el reporte'); },
    });
  }

  validarReporte(): boolean {
    const n = this.nuevoReporte;
    if (!n.tipo || !n.estudianteId || !n.motivo.trim() || !n.descripcion.trim()) {
      alert('Completa tipo, estudiante, motivo y descripción.');
      return false;
    }
    return true;
  }

  limpiarFormulario(): void {
    this.nuevoReporte = { tipo: '' as any, estudianteId: 0, motivo: '', descripcion: '', prioridad: 'media' };
  }

  // ================== Acciones por tarjeta ==================
  cambiarEstado(r: ReporteDTO, nuevo: EstadoReporte) {
    this.api.cambiarEstado({ id: r.id, estado: nuevo, accionesTomadas: r.accionesTomadas || '' })
      .subscribe({
        next: () => this.cargarTodo(),
        error: () => alert('No se pudo actualizar el estado'),
      });
  }

  eliminarReporte(id: number) {
    if (!confirm('¿Eliminar este reporte?')) return;
    this.api.eliminar(id).subscribe({
      next: () => this.cargarTodo(),
      error: () => alert('No se pudo eliminar'),
    });
  }

  eliminar(r: ReporteDTO) { this.eliminarReporte(r.id); }

  // ================== Encabezado (persistencia) ==================
  cargarSettings() {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (raw) this.settings = { ...this.settings, ...JSON.parse(raw) };
    } catch {}
  }
  guardarSettings() {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    alert('Encabezado guardado ✅');
  }

  // ================== Folio ==================
  cargarFolio() {
    const n = Number(localStorage.getItem(this.FOLIO_KEY) || '1');
    this.settings.folioActual = isNaN(n) || n < 1 ? 1 : n;
  }
  private incrementarFolio() {
    this.settings.folioActual = (this.settings.folioActual || 1) + 1;
    localStorage.setItem(this.FOLIO_KEY, String(this.settings.folioActual));
  }
  reiniciarFolio() {
    if (!confirm('¿Reiniciar folio a 1?')) return;
    this.settings.folioActual = 1;
    localStorage.setItem(this.FOLIO_KEY, '1');
    alert('Folio reiniciado a 1');
  }
  folioEtiquetaSimple() {
    return `REP-${String(this.settings.folioActual).padStart(4,'0')}`;
  }

  // ================== Logo (upload simple) ==================
  async onLogoSelected(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('logo', file);
    this.logoSubiendo = true;
    try {
      const resp = await fetch('http://localhost/gestion_e/reportes/upload_logo.php', {
        method: 'POST',
        body: fd
      });
      const json = await resp.json();
      if (!json.ok) throw new Error(json.error || 'Error subiendo logo');
      this.settings.logoUrl = json.url; // p.ej. 'uploads/logo.png'
      this.guardarSettings();
    } catch (e: any) {
      alert('No se pudo subir el logo: ' + (e?.message || e));
    } finally {
      this.logoSubiendo = false;
    }
  }

  // ================== Export ==================
  exportarReportes() {
    // CSV (usa ; si tu Excel/Word esperan punto y coma)
    this.api.exportarCSV({ maestroId: this.maestroId, sep: ';' });
  }

  // Exportar un reporte guardado (por ID)
  exportarWord(r: ReporteDTO) {
    this.guardarSettings();
    const q = new URLSearchParams({
      id: String(r.id),
      escuela: this.settings.escuela,
      direccion: this.settings.direccion,
      telefono: this.settings.telefono,
      maestro: this.settings.maestro,
      grupo: this.settings.grupo,
      cita: this.compCitaISO(),
      folioN: String(this.settings.folioActual),
      logo: this.settings.logoUrl || ''
    }).toString();
    window.open(`http://localhost/gestion_e/reportes/export_word.php?${q}`, '_blank');
    this.incrementarFolio();
  }

  // Exportar desde el formulario (sin guardar en BD)
  exportarWordDesdeFormulario() {
    this.guardarSettings();
    const q = new URLSearchParams({
      // datos del reporte actual
      tipo: String(this.nuevoReporte.tipo || ''),
      estudiante: String(this.nuevoReporte.estudianteId || ''),
      prioridad: String(this.nuevoReporte.prioridad || 'media'),
      motivo: this.nuevoReporte.motivo || '',
      descripcion: this.nuevoReporte.descripcion || '',
      // encabezado
      escuela: this.settings.escuela,
      direccion: this.settings.direccion,
      telefono: this.settings.telefono,
      maestro: this.settings.maestro,
      grupo: this.settings.grupo,
      cita: this.compCitaISO(),
      folioN: String(this.settings.folioActual),
      logo: this.settings.logoUrl || ''
    }).toString();

    window.open(`http://localhost/gestion_e/reportes/export_word.php?${q}`, '_blank');
    this.incrementarFolio();
  }

  private compCitaISO() {
    const f = (this.settings.citaFecha || '').trim();
    const h = (this.settings.citaHora || '').trim();
    if (!f && !h) return '';
    return `${f}${h ? ' ' + h : ''}`; // el PHP lo imprimirá si llega
  }

  // ================== Filtros ==================
  get reportesFiltrados(): ReporteDTO[] {
    let f = this.reportes.slice();
    if (this.filtroTipo !== 'todos')      f = f.filter(r => r.tipo === this.filtroTipo);
    if (this.filtroEstado !== 'todos')    f = f.filter(r => r.estado === this.filtroEstado);
    if (this.filtroPrioridad !== 'todos') f = f.filter(r => r.prioridad === this.filtroPrioridad);
    if (this.filtroEstudiante > 0)        f = f.filter(r => r.estudianteId === this.filtroEstudiante);
    return f.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }
  filtrados() { return this.reportesFiltrados; }

  // ================== Helpers UI ==================
  nombreEstudiante(id: number): string {
    return this.estudiantes.find(e => e.id === id)?.nombre ?? '—';
  }
  obtenerNombreTipo(tipo: TipoReporte) {
    return this.tiposReporte.find(t => t.valor === tipo)?.nombre ?? '—';
  }
  iconoTipo(tipo: TipoReporte) {
    return this.tiposReporte.find(t => t.valor === tipo)?.icono ?? '📄';
  }
  fechaBonita(f: string) { return new Date(f).toLocaleDateString('es-MX'); }
  obtenerColorPrioridad(p: Prioridad) {
    return this.nivelesPrioridad.find(x => x.valor === p)?.color ?? '#95a5a6';
  }
  obtenerColorEstado(e: EstadoReporte) {
    return this.estadosReporte.find(x => x.valor === e)?.color ?? '#95a5a6';
  }
  obtenerGradoEstudiante(_id: number) { return ''; }

  generarReporteRapido(tipo: TipoReporte, estudianteId: number, motivo: string) {
    this.nuevoReporte.tipo = tipo;
    this.nuevoReporte.estudianteId = estudianteId || 0;
    this.nuevoReporte.motivo = motivo;
    const nombre = this.nombreEstudiante(estudianteId) || 'el estudiante';
    this.nuevoReporte.descripcion = `Reporte rápido para ${nombre}. ${motivo}`;
    this.nuevoReporte.prioridad = 'media';
  }
}
