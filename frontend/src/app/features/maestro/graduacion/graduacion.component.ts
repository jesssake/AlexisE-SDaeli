// src/app/features/maestro/graduacion/graduacion.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpParams,
} from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type TipoCertificado = 'cierre' | 'excelencia';

interface Alumno {
  id: number;
  nombre: string;
}

interface Certificado {
  id: number;
  id_nino: number;
  alumno: string | null;
  promedio: number;
  tipo: string;         // 'cierre' | 'excelencia'
  ciclo: string;
  creado_en: string;    // datetime en string
  estado: string;       // 'enviado' | 'pendiente' | etc.
  archivo_path: string | null;
  nombre_archivo: string | null;
}

@Component({
  selector: 'app-graduacion',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './graduacion.component.html',
  styleUrls: ['./graduacion.component.scss'],
})
export class GraduacionComponent implements OnInit {
  // Base para endpoints usando el proxy /api
  private apiBase = '/api/graduacion/';
  
  // ID del maestro (debería venir del login)
  maestroId = 16;

  cargando = false;

  alumnos: Alumno[] = [];
  certificados: Certificado[] = [];

  // Totales para las tarjetas
  stats = {
    total: 0,
    excelencia: 0,
    cierre: 0,
    enviados: 0,
  };

  // Filtros de la parte de arriba
  filtros = {
    tipo: 'todos',   // 'todos' | 'cierre' | 'excelencia'
    estado: 'todos', // 'todos' | 'enviado' | 'pendiente'
    alumnoId: 0,     // 0 = todos
  };

  // Estado del modal
  mostrarFormularioCertificado = false;
  usarUltimo = true;

  // Formulario del modal
  form = {
    alumnoId: 0,
    nombreAlumno: '',
    promedio: 10,
    cicloEscolar: '2025-2026',
    // Internamente siempre será excelencia
    tipo: 'excelencia' as TipoCertificado,
    teacherName: '',
  };

  // Nueva propiedad para configuración de encabezado
  settings = {
    escuela: 'COLEGIO NUEVOS HORIZONTES',
    direccion: 'Calle Ejemplo #123, Col. Centro, C.P. 00000',
    telefono: '(000) 000 00 00',
    maestro: 'Juan Pérez',
    grupo: '3° A',
    logoUrl: '',
    folioActual: 1,
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarSettings();
    this.cargarAlumnos();
    this.cargarCertificados();
    this.cargarFolio();
  }

  // =======================================
  // CONFIGURACIÓN Y ENCABEZADO
  // =======================================
  private SETTINGS_KEY = 'graduacion.settings.v1';
  private FOLIO_KEY = 'graduacion.folio.v1';

  cargarSettings() {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (raw) {
        this.settings = { ...this.settings, ...JSON.parse(raw) };
        console.log('⚙️ Configuración cargada:', this.settings);
      }
    } catch (e) {
      console.error('❌ Error cargando settings:', e);
    }
  }

  guardarSettings() {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    console.log('💾 Configuración guardada:', this.settings);
    alert('Encabezado guardado ✅');
  }

  cargarFolio() {
    const n = Number(localStorage.getItem(this.FOLIO_KEY) || '1');
    this.settings.folioActual = isNaN(n) || n < 1 ? 1 : n;
    console.log('📄 Folio cargado:', this.settings.folioActual);
  }

  private incrementarFolio() {
    this.settings.folioActual = (this.settings.folioActual || 1) + 1;
    localStorage.setItem(this.FOLIO_KEY, String(this.settings.folioActual));
    console.log('📈 Folio incrementado a:', this.settings.folioActual);
  }

  reiniciarFolio() {
    if (!confirm('¿Está seguro de reiniciar el folio a 1?')) return;
    this.settings.folioActual = 1;
    localStorage.setItem(this.FOLIO_KEY, '1');
    console.log('🔄 Folio reiniciado a 1');
    alert('Folio reiniciado a 1');
  }

  folioEtiquetaSimple() {
    return `CERT-${String(this.settings.folioActual).padStart(4,'0')}`;
  }

  // =======================================
  // CARGAR ALUMNOS (para selects)
  // =======================================
  cargarAlumnos(): void {
    const url = `${this.apiBase}alumnos_listar.php`;
    this.http.get<any>(url, { params: { maestro_id: this.maestroId } }).subscribe({
      next: (resp) => {
        console.log('Respuesta cargar alumnos:', resp);

        if (resp && resp.ok && Array.isArray(resp.data)) {
          this.alumnos = resp.data as Alumno[];
        } else if (Array.isArray(resp)) {
          // Si la respuesta es directamente un array
          this.alumnos = resp as Alumno[];
        } else {
          console.warn('Formato inesperado al cargar alumnos', resp);
          this.alumnos = [];
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP al cargar alumnos:', err);
        this.alumnos = [];
      },
    });
  }

  // =======================================
  // CARGAR CERTIFICADOS (tabla principal)
  // =======================================
  cargarCertificados(): void {
    const url = `${this.apiBase}certificados_listar.php`;
    this.cargando = true;

    let params = new HttpParams()
      .set('maestroId', String(this.maestroId));

    if (this.filtros.tipo !== 'todos') {
      params = params.set('tipo', this.filtros.tipo);
    }
    if (this.filtros.estado !== 'todos') {
      params = params.set('estado', this.filtros.estado);
    }
    if (this.filtros.alumnoId > 0) {
      params = params.set('alumnoId', String(this.filtros.alumnoId));
    }

    this.http.get<any>(url, { params }).subscribe({
      next: (resp) => {
        console.log('Respuesta cargar certificados:', resp);

        if (resp && resp.ok && Array.isArray(resp.data)) {
          this.certificados = (resp.data as any[]).map((c) => {
            const promedioNum = Number(c.promedio);
            return {
              id: Number(c.id),
              id_nino: Number(c.id_nino),
              alumno: c.alumno ?? c.estudianteNombre ?? null,
              promedio: isNaN(promedioNum) ? 0 : promedioNum,
              tipo: c.tipo ?? 'cierre',
              ciclo: c.ciclo ?? '',
              creado_en: c.creado_en ?? c.fecha ?? '',
              estado: c.estado ?? 'pendiente',
              archivo_path: c.archivo_path ?? null,
              nombre_archivo: c.nombre_archivo ?? null,
            } as Certificado;
          });
        } else if (Array.isArray(resp)) {
          // Si la respuesta es directamente un array
          this.certificados = resp.map((c: any) => ({
            id: Number(c.id),
            id_nino: Number(c.id_nino),
            alumno: c.alumno ?? c.estudianteNombre ?? null,
            promedio: Number(c.promedio) || 0,
            tipo: c.tipo ?? 'cierre',
            ciclo: c.ciclo ?? '',
            creado_en: c.creado_en ?? c.fecha ?? '',
            estado: c.estado ?? 'pendiente',
            archivo_path: c.archivo_path ?? null,
            nombre_archivo: c.nombre_archivo ?? null,
          }));
        } else {
          console.warn('Formato inesperado en certificados_listar.php', resp);
          this.certificados = [];
        }

        this.actualizarStats();
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error HTTP al cargar certificados:', err);
        this.certificados = [];
        this.actualizarStats();
        this.cargando = false;
      },
    });
  }

  // =======================================
  // STATS
  // =======================================
  private actualizarStats(): void {
    this.stats.total = this.certificados.length;
    this.stats.excelencia = this.certificados.filter(
      (x) => x.tipo === 'excelencia'
    ).length;
    this.stats.cierre = this.certificados.filter(
      (x) => x.tipo === 'cierre'
    ).length;
    this.stats.enviados = this.certificados.filter(
      (x) => x.estado === 'enviado'
    ).length;
  }

  // =======================================
  // MODAL NUEVO CERTIFICADO
  // =======================================
  abrirModalNuevo(): void {
    this.mostrarFormularioCertificado = true;

    // Valores por defecto razonables
    this.form = {
      alumnoId: 0,
      nombreAlumno: '',
      promedio: 10,
      cicloEscolar: '2025-2026',
      tipo: 'excelencia',
      teacherName: this.settings.maestro, // Usar nombre del maestro configurado
    };
  }

  cerrarModal(): void {
    this.mostrarFormularioCertificado = false;
  }

  cambiarCheckUsarUltimo(): void {
    console.log('usarUltimo:', this.usarUltimo);
    // Aquí podrías cargar del backend la última config (ciclo, maestro), etc.
  }

  // Cuando eliges un alumno del select
  cuandoSeleccionaAlumno(): void {
    const seleccionado = this.alumnos.find(
      (a) => a.id === this.form.alumnoId
    );
    this.form.nombreAlumno = seleccionado ? seleccionado.nombre : '';
  }

  // =======================================
  // GENERAR CERTIFICADO
  // =======================================
  generarCertificado(): void {
    if (this.cargando) return;

    // Validaciones rápidas
    if (!this.form.alumnoId) {
      alert('Selecciona un alumno primero.');
      return;
    }
    if (!this.form.cicloEscolar.trim()) {
      alert('Escribe el ciclo escolar.');
      return;
    }
    if (!this.form.teacherName.trim()) {
      alert('Escribe el nombre del profesor (firma).');
      return;
    }

    const url = `${this.apiBase}crear.php`;

    // Enviamos todo como JSON
    const payload = {
      maestroId: this.maestroId,
      alumnoId: this.form.alumnoId,
      promedio: this.form.promedio,
      cicloEscolar: this.form.cicloEscolar.trim(),
      tipo: 'excelencia',
      teacherName: this.form.teacherName.trim(),
      
      // Datos del encabezado
      escuela: this.settings.escuela,
      direccion: this.settings.direccion,
      telefono: this.settings.telefono,
      grupo: this.settings.grupo,
      folio: this.settings.folioActual,
      logoUrl: this.settings.logoUrl || ''
    };

    this.cargando = true;

    this.http.post<any>(url, payload).subscribe({
      next: async (resp) => {
        console.log('Respuesta crear certificado:', resp);

        if (resp && resp.ok) {
          alert('✅ Certificado generado correctamente.');

          // Guardar configuración
          this.guardarSettings();

          // Generar y descargar el PDF personalizado
          await this.crearYDescargarPdfCertificado(
            this.form.nombreAlumno,
            this.form.promedio,
            this.form.cicloEscolar,
            this.form.teacherName
          );

          // Incrementar folio después de generar
          this.incrementarFolio();

          this.cerrarModal();
          this.cargarCertificados(); // refresca la tabla
        } else {
          alert(
            resp?.message ||
              'No se pudo generar el certificado.'
          );
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error HTTP al generar certificado:', err);
        alert('Error HTTP al generar el certificado: ' + err.message);
        this.cargando = false;
      },
    });
  }

  // =======================================
  // ACCIONES DE LA TABLA
  // =======================================
  descargar(id: number): void {
    const url = `${this.apiBase}descargar.php?id=${id}`;
    window.open(url, '_blank');
  }

  ver(certificado: Certificado): void {
    console.log('👁️ Ver certificado:', certificado);
    // Aquí podrías abrir un modal con más detalles
    alert(`Detalles del certificado:\nAlumno: ${certificado.alumno}\nPromedio: ${certificado.promedio}\nCiclo: ${certificado.ciclo}\nEstado: ${certificado.estado}`);
  }

  enviar(id: number): void {
    const confirmado = confirm('¿Marcar este certificado como ENVIADO?');
    if (!confirmado) return;

    const url = `${this.apiBase}cambiar_estado.php`;

    const payload = { id: id, estado: 'enviado' };

    this.http.post<any>(url, payload).subscribe({
      next: (resp) => {
        console.log('Respuesta cambiar estado:', resp);

        if (resp && resp.ok) {
          const cert = this.certificados.find((c) => c.id === id);
          if (cert) {
            cert.estado = 'enviado';
          }
          this.actualizarStats();
          alert('✅ Certificado marcado como enviado.');
        } else {
          alert(
            resp?.message ||
              'No se pudo cambiar el estado.'
          );
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP al cambiar estado:', err);
        alert('Error HTTP al cambiar el estado del certificado.');
      },
    });
  }

  eliminar(id: number): void {
    const confirmado = confirm('¿Seguro que quieres eliminar este certificado?');
    if (!confirmado) return;

    const url = `${this.apiBase}eliminar.php?id=${id}`;

    this.http.delete<any>(url).subscribe({
      next: (resp) => {
        console.log('Respuesta eliminar certificado:', resp);

        if (resp && resp.ok) {
          this.certificados = this.certificados.filter(
            (c) => c.id !== id
          );
          this.actualizarStats();
          alert('✅ Certificado eliminado exitosamente.');
        } else {
          alert(
            resp?.message ||
              'No se pudo eliminar el certificado.'
          );
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP al eliminar certificado:', err);
        alert('Error HTTP al eliminar el certificado.');
      },
    });
  }

  // =======================================
  // LOGO (upload simple)
  // =======================================
  logoSubiendo = false;

  async onLogoSelected(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('El logo no puede ser mayor a 5MB');
      return;
    }
    
    console.log('🖼️ Subiendo logo:', file.name);
    
    const fd = new FormData();
    fd.append('logo', file);
    this.logoSubiendo = true;
    
    try {
      const resp = await fetch(`${this.apiBase}upload_logo`, {
        method: 'POST',
        body: fd
      });
      
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const json = await resp.json();
      
      if (!json.ok) throw new Error(json.error || 'Error subiendo logo');
      
      this.settings.logoUrl = json.url;
      this.guardarSettings();
      console.log('✅ Logo subido exitosamente:', json.url);
      alert('✅ Logo subido correctamente.');
      
    } catch (e: any) {
      console.error('❌ Error subiendo logo:', e);
      alert('No se pudo subir el logo: ' + (e?.message || e));
    } finally {
      this.logoSubiendo = false;
    }
  }

  // =======================================
  // EXPORTAR (opcional)
  // =======================================
  exportarCertificados(): void {
    const url = `${this.apiBase}exportar.php?maestroId=${this.maestroId}`;
    window.open(url, '_blank');
  }

  exportarWord(certificado?: Certificado): void {
    console.log('📄 Exportando certificado a Word');
    this.guardarSettings();
    
    let url = `${this.apiBase}export_word?`;
    const params = new URLSearchParams({
      maestro: this.settings.maestro,
      grupo: this.settings.grupo,
      escuela: this.settings.escuela,
      direccion: this.settings.direccion,
      telefono: this.settings.telefono,
      folioN: String(this.settings.folioActual),
      logo: this.settings.logoUrl || ''
    });
    
    if (certificado) {
      params.append('id', String(certificado.id));
      const alumno = this.alumnos.find(a => a.id === certificado.id_nino);
      if (alumno) {
        params.append('alumno', alumno.nombre);
      }
    } else {
      // Exportar desde formulario
      params.append('alumno', this.form.nombreAlumno);
      params.append('promedio', String(this.form.promedio));
      params.append('cicloEscolar', this.form.cicloEscolar);
      params.append('teacherName', this.form.teacherName);
    }
    
    url += params.toString();
    console.log('🔗 URL de exportación Word:', url);
    
    window.open(url, '_blank');
    this.incrementarFolio();
  }

  // =======================================
  // PDF LOCAL CON DATOS DEL ALUMNO (pdf-lib)
  // =======================================
  private async crearYDescargarPdfCertificado(
    nombreAlumno: string,
    promedio: number,
    cicloEscolar: string,
    nombreMaestro: string
  ): Promise<void> {
    try {
      const templateUrl = 'assets/certificado-graduacion.pdf';

      // Cargar plantilla como ArrayBuffer
      const response = await firstValueFrom(
        this.http.get(templateUrl, {
          responseType: 'arraybuffer' as 'json',
        })
      );
      const arrayBuffer = response as ArrayBuffer;

      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const page = pages[0];

      const { width } = page.getSize();
      const centerX = width / 2;

      // === Fuentes en cursiva y color negro ===
      const fontItalica = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

      const fontSizeNombre = 22;
      const fontSizeTexto = 12;

      const negro = rgb(0, 0, 0);

      // 1) Nombre del alumno (cursiva negra)
      const textNombre = nombreAlumno || 'Alumno';
      const textWidthNombre = fontItalica.widthOfTextAtSize(
        textNombre,
        fontSizeNombre
      );
      const yNombre = 270;
      const xNombre = centerX - textWidthNombre / 2 + 120;

      page.drawText(textNombre, {
        x: xNombre,
        y: yNombre,
        size: fontSizeNombre,
        font: fontItalica,
        color: negro,
      });

      // 2) Promedio (izquierda)
      const textoPromedio = promedio.toFixed(1);
      const textWidthPromedio = fontItalica.widthOfTextAtSize(
        textoPromedio,
        fontSizeTexto
      );
      const xPromedio = 390;
      const yPromedio = 220;

      page.drawText(textoPromedio, {
        x: xPromedio - textWidthPromedio / 2,
        y: yPromedio,
        size: fontSizeTexto,
        font: fontItalica,
        color: negro,
      });

      // 3) Nombre del maestro (derecha)
      const textoMaestro = nombreMaestro || '';
      const textWidthMaestro = fontItalica.widthOfTextAtSize(
        textoMaestro,
        fontSizeTexto
      );
      const xMaestro = width - 180;
      const yMaestro = 220;

      page.drawText(textoMaestro, {
        x: xMaestro - textWidthMaestro / 2,
        y: yMaestro,
        size: fontSizeTexto,
        font: fontItalica,
        color: negro,
      });

      // 4) Ciclo escolar (abajo al centro)
      const textoCiclo = cicloEscolar;
      const textWidthCiclo = fontItalica.widthOfTextAtSize(
        textoCiclo,
        fontSizeTexto
      );
      const yCiclo = 140;
      const xCiclo = centerX - textWidthCiclo / 2 + 110;

      page.drawText(textoCiclo, {
        x: xCiclo,
        y: yCiclo,
        size: fontSizeTexto,
        font: fontItalica,
        color: negro,
      });

      // 5) Información de la escuela (opcional)
      if (this.settings.escuela) {
        const textoEscuela = this.settings.escuela;
        const textWidthEscuela = fontItalica.widthOfTextAtSize(
          textoEscuela,
          fontSizeTexto - 2
        );
        const xEscuela = centerX - textWidthEscuela / 2;
        const yEscuela = 50;

        page.drawText(textoEscuela, {
          x: xEscuela,
          y: yEscuela,
          size: fontSizeTexto - 2,
          font: fontItalica,
          color: negro,
        });
      }

      // 6) Guardar y descargar
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: 'application/pdf',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado_${(nombreAlumno || 'alumno').replace(
        /\s+/g,
        '_'
      )}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar PDF con pdf-lib:', error);
      alert('Error al generar el PDF. Asegúrate de que el archivo plantilla existe en assets/');
    }
  }

  // =======================================
  // UTILIDADES
  // =======================================
  recargarDatos() {
    console.log('🔄 Recargando datos...');
    this.cargarAlumnos();
    this.cargarCertificados();
  }

  limpiarFiltros() {
    this.filtros.tipo = 'todos';
    this.filtros.estado = 'todos';
    this.filtros.alumnoId = 0;
    console.log('🧹 Filtros limpiados');
    this.cargarCertificados();
  }

  // Para mostrar la imagen del logo en la interfaz
  getLogoUrl(): string {
    if (!this.settings.logoUrl) return '';
    return `http://localhost:3000/${this.settings.logoUrl}`;
  }

  // Formatear fecha
  fechaBonita(fecha: string): string {
    try {
      return new Date(fecha).toLocaleDateString('es-MX');
    } catch {
      return fecha;
    }
  }

  // Obtener color según estado
  getColorEstado(estado: string): string {
    switch (estado) {
      case 'enviado': return '#10b981'; // verde
      case 'pendiente': return '#f59e0b'; // amarillo
      case 'cancelado': return '#ef4444'; // rojo
      default: return '#6b7280'; // gris
    }
  }
}