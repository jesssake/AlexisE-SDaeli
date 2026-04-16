// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\maestro\graduacion\graduacion.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { LoggingService } from '../../../services/logging.service';

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
  tipo: string;
  ciclo: string;
  creado_en: string;
  estado: string;
  archivo_path: string | null;
  nombre_archivo: string | null;
}

// Interfaz para la tabla con ID visual
interface CertificadoConIdVisual extends Certificado {
  idVisual: number;
}

@Component({
  selector: 'app-graduacion',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './graduacion.component.html',
  styleUrls: ['./graduacion.component.scss'],
})
export class GraduacionComponent implements OnInit {
  private apiBase = 'http://localhost:3000/api/maestro/graduacion/';
  maestroId = 1;
  cargando = false;
  descargando = false;

  alumnos: Alumno[] = [];
  certificados: Certificado[] = [];
  certificadosConIdVisual: CertificadoConIdVisual[] = [];

  stats = {
    total: 0,
    excelencia: 0,
    cierre: 0,
    enviados: 0,
    pendientes: 0
  };

  filtros = {
    tipo: 'todos',
    estado: 'todos',
    alumnoId: 0,
  };

  mostrarFormularioCertificado = false;
  usarUltimo = true;

  form = {
    alumnoId: 0,
    nombreAlumno: '',
    promedio: 10,
    cicloEscolar: '2025-2026',
    tipo: 'excelencia' as TipoCertificado,
    teacherName: '',
  };

  settings = {
    escuela: 'COLEGIO NUEVOS HORIZONTES',
    direccion: 'Calle Ejemplo #123, Col. Centro, C.P. 00000',
    telefono: '(000) 000 00 00',
    maestro: 'Juan Pérez',
    grupo: '3° A',
    logoUrl: '',
    folioActual: 1,
  };

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  private getUploadHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  constructor(private http: HttpClient, private logger: LoggingService) {}

  ngOnInit(): void {
    this.cargarSettings();
    this.cargarAlumnos();
    this.cargarCertificados();
    this.cargarFolio();
    this.cargarConfiguracionBackend();
    this.getEstadisticas();
  }

  private SETTINGS_KEY = 'graduacion.settings.v1';
  private FOLIO_KEY = 'graduacion.folio.v1';

  cargarSettings() {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (raw) {
        this.settings = { ...this.settings, ...JSON.parse(raw) };
        this.logger.log('⚙️ Configuración cargada:', this.settings);
      }
    } catch (e) {
      this.logger.error('❌ Error cargando settings:', e);
    }
  }

  guardarSettings() {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    this.logger.log('💾 Configuración guardada:', this.settings);
    alert('Encabezado guardado ✅');
  }

  cargarFolio() {
    const n = Number(localStorage.getItem(this.FOLIO_KEY) || '1');
    this.settings.folioActual = isNaN(n) || n < 1 ? 1 : n;
    this.logger.log('📄 Folio cargado:', this.settings.folioActual);
  }

  private incrementarFolio() {
    this.settings.folioActual = (this.settings.folioActual || 1) + 1;
    localStorage.setItem(this.FOLIO_KEY, String(this.settings.folioActual));
    this.logger.log('📈 Folio incrementado a:', this.settings.folioActual);
  }

  reiniciarFolio() {
    if (!confirm('¿Está seguro de reiniciar el folio a 1?')) return;
    this.settings.folioActual = 1;
    localStorage.setItem(this.FOLIO_KEY, '1');
    this.logger.log('🔄 Folio reiniciado a 1');
    alert('Folio reiniciado a 1');
  }

  folioEtiquetaSimple() {
    return `CERT-${String(this.settings.folioActual).padStart(4, '0')}`;
  }

  cargarConfiguracionBackend(): void {
    const url = `${this.apiBase}${this.maestroId}/config`;
    
    this.logger.log('🔗 URL configuración:', url);
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        this.logger.log('✅ Configuración del backend:', resp);
        if (resp) {
          if (resp.ciclo_actual) {
            this.form.cicloEscolar = resp.ciclo_actual;
          }
          if (resp.nombre_maestro_firma) {
            this.settings.maestro = resp.nombre_maestro_firma;
            this.form.teacherName = resp.nombre_maestro_firma;
          }
        }
      },
      error: (err) => {
        this.logger.error('❌ Error cargando configuración del backend:', err);
      }
    });
  }

  cargarAlumnos(): void {
    const url = `${this.apiBase}${this.maestroId}/alumnos`;
    
    this.logger.log('🔗 URL alumnos:', url);
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        this.logger.log('✅ Respuesta cargar alumnos:', resp);

        if (Array.isArray(resp)) {
          this.alumnos = resp as Alumno[];
          this.logger.log(`✅ Alumnos cargados: ${this.alumnos.length}`);
        } else {
          this.logger.warn('⚠️ Formato inesperado al cargar alumnos', resp);
          this.alumnos = [];
        }
      },
      error: (err) => {
        this.logger.error('❌ Error HTTP al cargar alumnos:', err);
        this.alumnos = [];
      },
    });
  }

  private actualizarIdsVisuales(): void {
    this.certificadosConIdVisual = this.certificados.map((cert, index) => ({
      ...cert,
      idVisual: index + 1
    }));
    // ✅ CORREGIDO: Quitado punto y coma dentro del map
    const idsMapeados = this.certificadosConIdVisual.map(c => ({ real: c.id, visual: c.idVisual }));
    this.logger.log('🆔 IDs visuales actualizados:', idsMapeados);
  }

  cargarCertificados(): void {
    const url = `${this.apiBase}${this.maestroId}/certificados`;
    this.cargando = true;

    this.logger.log('🔗 URL certificados:', url);
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        this.logger.log('✅ Respuesta cargar certificados:', resp);

        if (Array.isArray(resp)) {
          this.certificados = resp.map((c: any) => {
            const certificadoMapeado = {
              id: Number(c.id),
              id_nino: Number(c.alumno_id),
              alumno: c.alumno_nombre || 'Sin nombre',
              promedio: Number(c.promedio) || 0,
              tipo: 'excelencia',
              ciclo: c.ciclo || '',
              creado_en: c.fecha_creacion || '',
              estado: c.estado || 'pendiente',
              archivo_path: c.archivo_pdf || null,
              nombre_archivo: null,
            } as Certificado;
            
            return certificadoMapeado;
          });
          
          this.actualizarIdsVisuales();
          
          this.logger.log(`✅ Certificados cargados: ${this.certificados.length}`);
          // ✅ CORREGIDO: Quitado punto y coma dentro del map
          const idsReales = this.certificados.map(c => c.id);
          this.logger.log('📊 IDs reales:', idsReales);
        } else {
          this.logger.warn('⚠️ Formato inesperado al cargar certificados', resp);
          this.certificados = [];
          this.certificadosConIdVisual = [];
        }

        this.actualizarStats();
        this.cargando = false;
      },
      error: (err) => {
        this.logger.error('❌ Error HTTP al cargar certificados:', err);
        this.certificados = [];
        this.certificadosConIdVisual = [];
        this.actualizarStats();
        this.cargando = false;
      },
    });
  }

  getEstadisticas(): void {
    const url = `${this.apiBase}${this.maestroId}/estadisticas`;
    
    this.logger.log('🔗 URL estadísticas:', url);
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        this.logger.log('✅ Estadísticas del backend:', resp);
        if (resp) {
          this.stats.total = resp.total || 0;
          this.stats.enviados = resp.enviados || 0;
          this.stats.pendientes = (resp.total || 0) - (resp.enviados || 0);
          
          if (resp.excelencia !== undefined) {
            this.stats.excelencia = resp.excelencia;
          }
          if (resp.cierre !== undefined) {
            this.stats.cierre = resp.cierre;
          }
        }
      },
      error: (err) => {
        this.logger.error('❌ Error cargando estadísticas:', err);
        this.actualizarStats();
      }
    });
  }

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
    this.stats.pendientes = this.stats.total - this.stats.enviados;
  }

  abrirModalNuevo(): void {
    this.mostrarFormularioCertificado = true;

    this.form = {
      alumnoId: 0,
      nombreAlumno: '',
      promedio: 10,
      cicloEscolar: this.form.cicloEscolar || '2025-2026',
      tipo: 'excelencia',
      teacherName: this.settings.maestro,
    };
  }

  cerrarModal(): void {
    this.mostrarFormularioCertificado = false;
  }

  cambiarCheckUsarUltimo(): void {
    this.logger.log('usarUltimo:', this.usarUltimo);
  }

  cuandoSeleccionaAlumno(): void {
    const seleccionado = this.alumnos.find(
      (a) => a.id === this.form.alumnoId
    );
    this.form.nombreAlumno = seleccionado ? seleccionado.nombre : '';
  }

  // ========================================
  // GENERAR CERTIFICADO CON GUARDADO DE PDF
  // ========================================
  async generarCertificado(): Promise<void> {
    if (this.cargando) return;

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

    this.cargando = true;
    this.descargando = true;

    try {
      const pdfBytes = await this.generarPDFCompletoCorregido(
        this.form.nombreAlumno,
        this.form.promedio,
        this.form.cicloEscolar,
        this.form.teacherName,
        this.settings.logoUrl
      );

      const response = await this.guardarCertificadoConPDF(
        this.maestroId,
        this.form.alumnoId,
        this.form.promedio,
        this.form.cicloEscolar,
        this.form.teacherName,
        pdfBytes
      );

      if (response && response.success) {
        alert('✅ Certificado creado y guardado exitosamente.');
        
        this.descargarPDFLocal(pdfBytes, this.form.nombreAlumno);
        
        this.incrementarFolio();
        this.cerrarModal();
        this.cargarCertificados();
        this.getEstadisticas();
      } else {
        alert(response?.message || 'No se pudo crear el certificado.');
      }
    } catch (error) {
      this.logger.error('❌ Error:', error);
      alert('Error al generar el certificado: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      this.cargando = false;
      this.descargando = false;
    }
  }

  // ========================================
  // GUARDAR CERTIFICADO CON PDF EN EL SERVIDOR
  // ========================================
  private async guardarCertificadoConPDF(
    maestroId: number,
    alumnoId: number,
    promedio: number,
    ciclo: string,
    maestroFirma: string,
    pdfBytes: Uint8Array
  ): Promise<any> {
    const url = `${this.apiBase}${maestroId}/certificados-con-pdf`;
    
    const safeBytes = new Uint8Array(pdfBytes);
    const pdfBlob = new Blob([safeBytes], { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('alumno_id', alumnoId.toString());
    formData.append('promedio', promedio.toString());
    formData.append('ciclo', ciclo);
    formData.append('maestro_firma', maestroFirma);
    formData.append('pdf', pdfBlob, `certificado_${Date.now()}.pdf`);

    try {
      const response = await firstValueFrom(
        this.http.post<any>(url, formData, {
          headers: this.getUploadHeaders()
        })
      );
      return response;
    } catch (error) {
      this.logger.error('Error guardando certificado con PDF:', error);
      throw error;
    }
  }

  // ========================================
  // GENERAR PDF COMPLETO
  // ========================================
  private async generarPDFCompletoCorregido(
    nombreAlumno: string,
    promedio: number,
    cicloEscolar: string,
    nombreMaestro: string,
    logoUrl?: string
  ): Promise<Uint8Array> {
    try {
      const templateUrl = 'assets/certificado-graduacion.pdf';
      
      const response = await firstValueFrom(
        this.http.get(templateUrl, {
          responseType: 'arraybuffer' as 'json',
        })
      );
      const arrayBuffer = response as ArrayBuffer;
      
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();
      const centerX = width / 2;

      const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const negro = rgb(0, 0, 0);
      const azul = rgb(0.2, 0.3, 0.8);
      const gris = rgb(0.5, 0.5, 0.5);

      // Limpiar textos
      const nombreLimpio = this.limpiarTextoParaPDF(nombreAlumno.toUpperCase());
      const cicloLimpio = this.limpiarCicloEscolar(cicloEscolar);
      const maestroLimpio = this.limpiarTextoParaPDF(nombreMaestro);

      this.logger.log('📏 Dimensiones PDF:', { width, height });

      // ========================================
      // NOMBRE DEL ALUMNO
      // ========================================
      if (nombreLimpio && nombreLimpio.trim()) {
        const nombreWidth = fontItalic.widthOfTextAtSize(nombreLimpio, 32);
        page.drawText(nombreLimpio, {
          x: centerX - nombreWidth / 2 + 80,
          y: height - 330,
          size: 32,
          font: fontItalic,
          color: negro
        });
      }

      // ========================================
      // CICLO ESCOLAR
      // ========================================
      if (cicloLimpio && cicloLimpio.trim()) {
        const cicloWidth = fontBold.widthOfTextAtSize(cicloLimpio, 18);
        page.drawText(cicloLimpio, {
          x: centerX - cicloWidth / 2 + 90,
          y: height - 460,
          size: 18,
          font: fontBold,
          color: negro
        });
      }

      // ========================================
      // PROMEDIO
      // ========================================
      const promedioTexto = ` ${promedio.toFixed(2)}`;
      page.drawText(promedioTexto, {
        x: 370,
        y: height - 377,
        size: 18,
        font: fontNormal,
        color: negro
      });

      // ========================================
      // NOMBRE DEL MAESTRO
      // ========================================
      const maestroTexto = `${maestroLimpio || 'Director(a)'}`;
      const maestroWidth = fontNormal.widthOfTextAtSize(maestroTexto, 12);
      page.drawText(maestroTexto, {
        x: width - 150 - maestroWidth,
        y: height - 375,
        size: 12,
        font: fontNormal,
        color: negro
      });

      // ========================================
      // FECHA
      // ========================================
      const fecha = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      page.drawText(`Expedido: ${fecha}`, {
        x: 50,
        y: 35,
        size: 9,
        font: fontItalic,
        color: gris
      });

      // ========================================
      // FOLIO
      // ========================================
      const folioTexto = `FOLIO: CERT-${String(this.settings.folioActual).padStart(4, '0')}`;
      const folioWidth = fontItalic.widthOfTextAtSize(folioTexto, 9);
      page.drawText(folioTexto, {
        x: width - 50 - folioWidth,
        y: 35,
        size: 9,
        font: fontItalic,
        color: gris
      });

      // ========================================
      // LOGO
      // ========================================
      if (logoUrl) {
        try {
          const imgResponse = await fetch(logoUrl);
          const imgBlob = await imgResponse.blob();
          const imgBuffer = await imgBlob.arrayBuffer();
          let img;
          try {
            img = await pdfDoc.embedPng(imgBuffer);
          } catch {
            img = await pdfDoc.embedJpg(imgBuffer);
          }
          const scaled = img.scale(0.12);
          page.drawImage(img, {
            x: 40,
            y: height - 95,
            width: scaled.width,
            height: scaled.height,
          });
        } catch (e) {
          this.logger.warn('No se pudo incrustar el logo', e);
        }
      }

      return await pdfDoc.save();
      
    } catch (error) {
      this.logger.error('Error generando PDF:', error);
      throw error;
    }
  }

  // ========================================
  // UTILIDADES DE LIMPIEZA
  // ========================================
  private limpiarTextoParaPDF(texto: string): string {
    if (!texto) return '';
    let resultado = '';
    for (let i = 0; i < texto.length; i++) {
      const char = texto[i];
      const codigo = char.charCodeAt(0);
      
      if ((codigo >= 65 && codigo <= 90) || (codigo >= 97 && codigo <= 122)) {
        resultado += char.toUpperCase();
      } else if (char === ' ') {
        resultado += ' ';
      } else {
        switch (char) {
          case 'á': case 'ä': case 'â': case 'à': resultado += 'A'; break;
          case 'é': case 'ë': case 'ê': case 'è': resultado += 'E'; break;
          case 'í': case 'ï': case 'î': case 'ì': resultado += 'I'; break;
          case 'ó': case 'ö': case 'ô': case 'ò': resultado += 'O'; break;
          case 'ú': case 'ü': case 'û': case 'ù': resultado += 'U'; break;
          case 'ñ': resultado += 'N'; break;
          case 'Ñ': resultado += 'N'; break;
          default: // ignorar
        }
      }
    }
    return resultado;
  }

  private limpiarCicloEscolar(ciclo: string): string {
    if (!ciclo) return '2025-2026';
    let resultado = '';
    for (let i = 0; i < ciclo.length; i++) {
      const char = ciclo[i];
      if ('0123456789-'.includes(char)) {
        resultado += char;
      }
    }
    return resultado || '2025-2026';
  }

  // ========================================
  // DESCARGAR PDF LOCAL
  // ========================================
  private descargarPDFLocal(pdfBytes: Uint8Array, nombreAlumno: string): void {
    const safeBytes = new Uint8Array(pdfBytes);
    const blob = new Blob([safeBytes], { type: 'application/pdf' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificado_${nombreAlumno.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // ========================================
  // DESCARGAR CERTIFICADO EXISTENTE
  // ========================================
  descargar(id: number): void {
    const certificado = this.certificados.find(c => c.id === id);
    
    if (!certificado) {
      alert('❌ Certificado no encontrado');
      return;
    }

    if (!confirm(`¿Descargar certificado de ${certificado.alumno}?`)) {
      return;
    }

    this.descargando = true;
    this.logger.log('📥 Descargando certificado ID:', id, 'de:', certificado.alumno);

    if (certificado.archivo_path) {
      const pdfUrl = `http://localhost:3000/uploads/certificados/${certificado.archivo_path}`;
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `certificado_${certificado.alumno?.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.descargando = false;
      this.logger.log('✅ PDF descargado desde servidor');
    } else {
      this.generarPDFCompletoCorregido(
        certificado.alumno || 'Alumno',
        certificado.promedio,
        certificado.ciclo,
        this.settings.maestro,
        this.settings.logoUrl
      ).then(pdfBytes => {
        this.descargarPDFLocal(pdfBytes, certificado.alumno || 'certificado');
        this.descargando = false;
      }).catch(error => {
        this.logger.error('❌ Error en descarga:', error);
        alert('Error al descargar el certificado.');
        this.descargando = false;
      });
    }
  }

  // ========================================
  // VER CERTIFICADO
  // ========================================
  ver(certificado: Certificado): void {
    this.logger.log('👁️ Ver certificado:', certificado);
    
    const estadoEmoji = certificado.estado === 'enviado' ? '✅' : '⏳';
    
    const detalles = `
📋 DETALLES DEL CERTIFICADO
-------------------------
ID Real: ${certificado.id}
ID Visual: ${this.certificadosConIdVisual.find(c => c.id === certificado.id)?.idVisual || 'N/A'}
Alumno: ${certificado.alumno}
Promedio: ${certificado.promedio.toFixed(2)}
Ciclo: ${certificado.ciclo}
Estado: ${estadoEmoji} ${certificado.estado.toUpperCase()}
Archivo PDF: ${certificado.archivo_path || 'No guardado'}
Fecha: ${this.fechaBonita(certificado.creado_en)}
-------------------------
${certificado.estado === 'enviado' ? 
  '✅ Puedes descargar este certificado' : 
  '⏳ Pendiente de envío al estudiante'}
    `;
    
    alert(detalles);
  }

  // ========================================
  // ENVIAR CERTIFICADO
  // ========================================
  enviar(id: number): void {
    const certificado = this.certificados.find(c => c.id === id);
    const idVisual = this.certificadosConIdVisual.find(c => c.id === id)?.idVisual;
    
    const confirmado = confirm(`¿Marcar el certificado #${idVisual} como ENVIADO?\n\nEsto permitirá que el estudiante pueda descargarlo.`);
    if (!confirmado) return;

    const url = `${this.apiBase}certificados/${id}/estado`;
    
    this.logger.log('🔗 URL cambiar estado:', url);

    const payload = { estado: 'enviado' };

    this.http.put<any>(url, payload, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        this.logger.log('✅ Respuesta cambiar estado:', resp);

        if (resp && resp.success) {
          const cert = this.certificados.find((c) => c.id === id);
          if (cert) {
            cert.estado = 'enviado';
          }
          this.actualizarIdsVisuales();
          this.actualizarStats();
          alert('✅ Certificado marcado como enviado.\nEl estudiante ya puede descargarlo.');
        } else {
          alert(resp?.message || 'No se pudo cambiar el estado.');
        }
      },
      error: (err) => {
        this.logger.error('❌ Error HTTP al cambiar estado:', err);
        alert('Error HTTP al cambiar el estado del certificado.');
      },
    });
  }

  // ========================================
  // ELIMINAR CERTIFICADO
  // ========================================
  eliminar(id: number): void {
    const certificado = this.certificados.find(c => c.id === id);
    const idVisual = this.certificadosConIdVisual.find(c => c.id === id)?.idVisual;
    
    const confirmado = confirm(`¿Seguro que quieres eliminar el certificado #${idVisual}?\n\nEsta acción no se puede deshacer.`);
    if (!confirmado) return;

    const url = `${this.apiBase}certificados/${id}`;
    
    this.logger.log('🔗 URL eliminar:', url);

    this.http.delete<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        this.logger.log('✅ Respuesta eliminar certificado:', resp);

        if (resp && resp.success) {
          this.certificados = this.certificados.filter(
            (c) => c.id !== id
          );
          this.actualizarIdsVisuales();
          this.actualizarStats();
          alert('✅ Certificado eliminado exitosamente.');
        } else {
          alert(resp?.message || 'No se pudo eliminar el certificado.');
        }
      },
      error: (err) => {
        this.logger.error('❌ Error HTTP al eliminar certificado:', err);
        alert('Error HTTP al eliminar el certificado.');
      },
    });
  }

  // ========================================
  // LOGO
  // ========================================
  logoSubiendo = false;

  async onLogoSelected(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('El logo no puede ser mayor a 5MB');
      return;
    }
    
    this.logger.log('🖼️ Subiendo logo:', file.name);
    
    const fd = new FormData();
    fd.append('logo', file);
    this.logoSubiendo = true;
    
    try {
      const url = `http://localhost:3000/api/maestro/graduacion/${this.maestroId}/upload-logo`;
      this.logger.log('🔗 URL upload logo:', url);
      
      const resp = await fetch(url, {
        method: 'POST',
        body: fd
      });
      
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const json = await resp.json();
      
      if (!json.success) throw new Error(json.message || 'Error subiendo logo');
      
      this.settings.logoUrl = json.url;
      this.guardarSettings();
      this.logger.log('✅ Logo subido exitosamente:', json.url);
      alert('✅ Logo subido correctamente.');
      
    } catch (e: any) {
      this.logger.error('❌ Error subiendo logo:', e);
      alert('No se pudo subir el logo: ' + (e?.message || e));
    } finally {
      this.logoSubiendo = false;
    }
  }

  // ========================================
  // UTILIDADES
  // ========================================
  recargarDatos() {
    this.logger.log('🔄 Recargando datos...');
    this.cargando = true;
    Promise.all([
      this.cargarAlumnos(),
      this.cargarCertificados(),
      this.getEstadisticas()
    ]).then(() => {
      this.cargando = false;
      alert('✅ Datos recargados correctamente');
    }).catch(() => {
      this.cargando = false;
    });
  }

  limpiarFiltros() {
    this.filtros.tipo = 'todos';
    this.filtros.estado = 'todos';
    this.filtros.alumnoId = 0;
    this.logger.log('🧹 Filtros limpiados');
    this.cargarCertificados();
  }

  getLogoUrl(): string {
    if (!this.settings.logoUrl) return '';
    return this.settings.logoUrl.startsWith('http') ? 
      this.settings.logoUrl : 
      `http://localhost:3000/${this.settings.logoUrl}`;
  }

  fechaBonita(fecha: string): string {
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return fecha;
      return fechaObj.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'enviado': return '#10b981';
      case 'pendiente': return '#f59e0b';
      case 'cancelado': return '#ef4444';
      default: return '#6b7280';
    }
  }

  verificarDatosCertificados() {
    this.logger.log('🔍 VERIFICANDO DATOS DE CERTIFICADOS:');
    this.logger.log('📊 Número de certificados:', this.certificados.length);
    // ✅ CORREGIDO: Quitado punto y coma dentro del map
    const idsReales = this.certificados.map(c => c.id);
    this.logger.log('📊 IDs reales:', idsReales);
    // ✅ CORREGIDO: Quitado punto y coma dentro del map
    const idsVisuales = this.certificadosConIdVisual.map(c => ({ real: c.id, visual: c.idVisual }));
    this.logger.log('📊 IDs visuales:', idsVisuales);
    
    if (this.certificados.length === 0) {
      this.logger.log('⚠️ No hay certificados cargados');
      return;
    }
  }

  testBackend(): void {
    const testUrl = `${this.apiBase}test`;
    this.logger.log('🧪 Probando conexión backend:', testUrl);
    
    this.http.get(testUrl).subscribe({
      next: (response) => {
        this.logger.log('✅ Backend respondió:', response);
        alert('✅ Conexión con el backend exitosa');
      },
      error: (err) => {
        this.logger.error('❌ Error conectando al backend:', err);
        alert('❌ No se pudo conectar al backend. Verifica que el servidor esté corriendo en http://localhost:3000');
      }
    });
  }

  async ajustarCoordenadas(): Promise<void> {
    try {
      const templateUrl = 'assets/certificado-graduacion.pdf';
      const response = await firstValueFrom(
        this.http.get(templateUrl, { responseType: 'arraybuffer' as 'json' })
      );
      const pdfDoc = await PDFDocument.load(response as ArrayBuffer);
      const page = pdfDoc.getPages()[0];
      const { height } = page.getSize();
      
      this.logger.log('📏 Altura total de la página:', height);
      alert(`Altura de página: ${height}. Revisa la consola para más detalles.`);
      
    } catch (error) {
      this.logger.error('Error:', error);
    }
  }
}