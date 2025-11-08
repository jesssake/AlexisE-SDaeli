import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

// Cargar estas libs por CDN en index.html:
//  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" defer></script>
//  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>
declare const html2canvas: any;

export interface Alumno {
  id: number;
  nombre: string;
  grado: string | null;
  ciclo: string | null;  // p.ej. "2025-2026"
  email: string;
  promedio?: number | null;
}

export type TipoCert = 'excelencia' | 'cierre';
export type EstadoCert = 'generado' | 'enviado';

export interface Certificado {
  id: number;
  alumno_id: number;
  tipo: TipoCert;
  estado: EstadoCert;
  ciclo: string;
  promedio?: number | null;
  fecha: string; // ISO
}

@Component({
  selector: 'app-graduacion',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './graduacion.component.html',
  styleUrls: ['./graduacion.component.scss']
})
export class GraduacionComponent implements OnInit {
  // ===== Config =====
  baseUrl = 'http://localhost/gestion_e/graduacion';

  // ===== Estado UI =====
  cargando = false;
  enviando = false;
  errorMsg: string | null = null;
  okMsg: string | null = null;

  // ===== Datos (signals) =====
  alumnos = signal<Alumno[]>([]);
  certificados = signal<Certificado[]>([]);

  // Selector grande (cards)
  tab = signal<TipoCert>('excelencia');

  // Filtros de la grilla
  filtroTipo = signal<'todos' | TipoCert>('todos');
  filtroEstado = signal<'todos' | EstadoCert>('todos');
  filtroAlumnoId = signal<number | 'todos'>('todos');

  // Campos para carta (se conservan de la versión anterior)
  asuntoCarta = signal<string>('Carta de despedida a estudiantes');
  mensajeExtra = signal<string>('');
  alumnoActivo = signal<Alumno | null>(null);

  // ===== Computeds =====
  alumnosIndex = computed(() => {
    const map = new Map<number, Alumno>();
    this.alumnos().forEach(a => map.set(a.id, a));
    return map;
  });

  certificadosFull = computed(() => {
    const idx = this.alumnosIndex();
    return this.certificados().map(c => ({
      ...c,
      alumno: idx.get(c.alumno_id) || null
    })).filter(x => !!x.alumno);
  });

  totalCert = computed(() => this.certificados().length);
  totalExcelencia = computed(() => this.certificados().filter(c => c.tipo === 'excelencia').length);
  totalCierre = computed(() => this.certificados().filter(c => c.tipo === 'cierre').length);
  totalEnviados = computed(() => this.certificados().filter(c => c.estado === 'enviado').length);

  certificadosFiltrados = computed(() => {
    let list = this.certificadosFull();
    const t = this.filtroTipo();
    const e = this.filtroEstado();
    const s = this.filtroAlumnoId();

    if (t !== 'todos') list = list.filter(c => c.tipo === t);
    if (e !== 'todos') list = list.filter(c => c.estado === e);
    if (s !== 'todos') list = list.filter(c => c.alumno_id === s);

    return [...list].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  });

  // ===== Ciclo de vida =====
  constructor(private http: HttpClient) {
    effect(() => {
      const lista = this.alumnos();
      if (lista.length && !this.alumnoActivo()) this.alumnoActivo.set(lista[0]);
      if (!lista.length) this.alumnoActivo.set(null);
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.cargando = true; this.errorMsg = null;
    try {
      const [alumnos, certs] = await Promise.all([
        this.http.get<Alumno[]>(`${this.baseUrl}/alumnos.php`).toPromise(),
        this.http.get<Certificado[]>(`${this.baseUrl}/certificados.php`).toPromise()
      ]);
      const ordenA = (alumnos || []).sort((a, b) => a.nombre.localeCompare(b.nombre));
      this.alumnos.set(ordenA);
      this.certificados.set(certs || []);
    } catch (e) {
      console.error(e);
      this.errorMsg = 'No se pudieron cargar los datos.';
    } finally {
      this.cargando = false;
    }
  }

  // ===== Acciones Dashboard / filtros =====
  setTab(t: TipoCert) { this.tab.set(t); }
  setFiltroAlumno(id: number | 'todos') { this.filtroAlumnoId.set(id); }
  print() { window.print(); }

  // ===== Helpers seguros para template =====
  getIniciales(nombre?: string): string {
    if (!nombre) return '??';
    return nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w.charAt(0))
      .join('')
      .toUpperCase();
  }

  // ===== Estados (mock local, ideal: endpoints PHP dedicados) =====
  async marcarEnviado(certId: number) {
    try {
      // Ideal: POST `${baseUrl}/certificados_marcar_enviado.php` { id }
      const next = this.certificados().map(c => c.id === certId ? { ...c, estado: 'enviado' as EstadoCert } : c);
      this.certificados.set(next);
      alert('Certificado marcado como enviado.');
    } catch (e) {
      console.error(e);
      this.errorMsg = 'No se pudo marcar como enviado.';
    }
  }

  eliminarCert(certId: number) {
    // Ideal: DELETE backend. Aquí lo quitamos localmente.
    const next = this.certificados().filter(c => c.id !== certId);
    this.certificados.set(next);
  }

  // ===== Plantillas (carta y diploma) =====
  fechaHoy(): string {
    const d = new Date();
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  cartaHTML(al: Alumno | null, incluirExtra = true): string {
    const nombre = al?.nombre ?? 'Estudiantes';
    const msg = (incluirExtra && this.mensajeExtra())
      ? `<p>${this.escapeHtml(this.mensajeExtra())}</p>` : '';
    return `
<div style="font-family:Poppins,Arial,sans-serif;line-height:1.7;color:#2d2d2d">
  <div style="text-align:right;color:#666;font-size:12px">${this.fechaHoy()}</div>
  <h2 style="text-align:center;color:#5a54d6;margin:10px 0">Queridos ${this.escapeHtml(nombre)} 🚀</h2>
  ${msg}
  <p>Lleven cada recuerdo, lección y palabra de aliento como combustible para alcanzar la luna 🌕. Este año ha sido un viaje épico lleno de aprendizajes, risas 🤣 y momentos inolvidables 🏆.</p>
  <p>Son capaces de superar cualquier desafío 💪. ¡Sigan soñando grande y persiguiendo sus metas como guerreros ⚔️!</p>
  <p>Brillen, cuestionen el mundo y construyan su camino con valentía 🔥. Cada obstáculo fue una oportunidad para crecer 🚀.</p>
  <blockquote style="border-left:4px solid #5a54d6;padding:8px 12px;background:#f0f0ff20">
    "El éxito no es el final, el fracaso no es fatal: lo que cuenta es el valor para continuar."
  </blockquote>
</div>`;
  }

  buildDiplomaElement(al: Alumno): HTMLElement {
    const ciclo = al.ciclo || '2025-2026';
    const wrapper = document.createElement('div');
    wrapper.className = 'cert-container pdf-render';
    wrapper.innerHTML = `
      <div class="certificate">
        <div class="gold-border"></div>
        <div class="watermark">EXCELENCIA</div>
        <div class="decoration decoration-1">✦</div>
        <div class="decoration decoration-2">✦</div>
        <div class="header">
          <h1>Certificado de Excelencia Académica</h1>
          <p>Otorgado por mérito y dedicación</p>
        </div>
        <div class="recipient-name">${this.escapeHtml(al.nombre)}</div>
        <p>Por desempeño sobresaliente en el ciclo escolar</p>
        <div class="year-display">${this.escapeHtml(ciclo)}</div>
      </div>
    `;
    return wrapper;
  }

  async generarDiplomaPdfBlob(al: Alumno): Promise<Blob> {
    const host = document.getElementById('pdf-sandbox')!;
    const node = this.buildDiplomaElement(al);
    host.appendChild(node);
    await new Promise(r => setTimeout(r, 300)); // espera estilos/fuentes

    const certificate = node.querySelector('.certificate') as HTMLElement;
    const canvas = await html2canvas(certificate, { scale: 2, useCORS: true });
    const pngData = canvas.toDataURL('image/png');

    const pdf = new (window as any).jspdf.jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: [11.69, 8.27]
    });
    pdf.addImage(pngData, 'PNG', 0, 0, 11.69, 8.27);
    const blob = pdf.output('blob');

    host.removeChild(node);
    return blob;
  }

  async descargarDiploma(al: Alumno) {
    try {
      const blob = await this.generarDiplomaPdfBlob(al);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Diploma_${al.nombre.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      this.errorMsg = 'No se pudo generar el PDF del diploma.';
    }
  }

  // ===== Envío por alumno (según tipo de cert) =====
  async enviarCertificado(cert: Certificado) {
    const alumno = this.alumnosIndex().get(cert.alumno_id);
    if (!alumno || !alumno.email) { this.errorMsg = 'El alumno no tiene email.'; return; }

    this.enviando = true; this.errorMsg = null; this.okMsg = null;
    try {
      if (cert.tipo === 'excelencia') {
        // Enviar diploma como PDF adjunto
        const blob = await this.generarDiplomaPdfBlob(alumno);
        const base64 = await this.blobToBase64(blob);
        const filename = `Diploma_${alumno.nombre.replace(/\s+/g, '_')}.pdf`;
        const subject = `Diploma de Excelencia - ${alumno.nombre}`;
        await this.http.post(`${this.baseUrl}/enviar_diploma.php`, {
          to: [alumno.email], subject, pdfBase64: base64, filename
        }).toPromise();
      } else {
        // Enviar carta en HTML
        const subject = this.asuntoCarta();
        const html = this.cartaHTML(alumno, true);
        await this.http.post(`${this.baseUrl}/enviar_carta.php`, {
          to: [alumno.email], subject, html
        }).toPromise();
      }
      // Marcar enviado localmente (mock)
      await this.marcarEnviado(cert.id);
      alert(`Certificado enviado a: ${alumno.email}`);
    } catch (e) {
      console.error(e);
      this.errorMsg = 'Error al enviar el certificado.';
    } finally {
      this.enviando = false;
    }
  }

  // ===== Exportación rápida CSV =====
  exportarCSV() {
    const header = ['ID','Alumno','Tipo','Estado','Ciclo','Promedio','Fecha'];
    const rows = this.certificadosFull().map(c => [
      c.id,
      c.alumno?.nombre || '',
      c.tipo,
      c.estado,
      c.ciclo,
      (c.promedio ?? '').toString(),
      c.fecha
    ]);
    const csv = [header, ...rows]
      .map(r => r.map(x => `"${(x ?? '').toString().replace(/"/g,'""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'certificados.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // ===== Utils =====
  escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
    );
  }

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve((r.result as string).split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
}
