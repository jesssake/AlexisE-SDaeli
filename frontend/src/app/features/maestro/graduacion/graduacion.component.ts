// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\maestro\graduacion\graduacion.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
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
  // ✅ URL completa del backend Node.js
  private apiBase = 'http://localhost:3000/api/maestro/graduacion/';

  // ID del maestro (debería venir del login)
  maestroId = 16;

  cargando = false;

  alumnos: Alumno[] = [];
  certificados: Certificado[] = [];

  // ✅ Totales para las tarjetas
  stats = {
    total: 0,
    excelencia: 0,
    cierre: 0,
    enviados: 0,
    pendientes: 0
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

  // Headers para incluir token si es necesario
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarSettings();
    this.cargarAlumnos();
    this.cargarCertificados();
    this.cargarFolio();
    this.cargarConfiguracionBackend();
    this.getEstadisticas();
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

  // ✅ Cargar configuración desde el backend
  cargarConfiguracionBackend(): void {
    const url = `${this.apiBase}${this.maestroId}/config`;
    
    console.log('🔗 URL configuración:', url);
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        console.log('✅ Configuración del backend:', resp);
        if (resp) {
          // Actualizar el ciclo y nombre del maestro desde el backend
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
        console.error('❌ Error cargando configuración del backend:', err);
        console.error('Detalles:', err.message);
      }
    });
  }

  // =======================================
  // CARGAR ALUMNOS (para selects)
  // =======================================
  cargarAlumnos(): void {
    const url = `${this.apiBase}${this.maestroId}/alumnos`;
    
    console.log('🔗 URL alumnos:', url);
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        console.log('✅ Respuesta cargar alumnos:', resp);

        if (Array.isArray(resp)) {
          this.alumnos = resp as Alumno[];
          console.log(`✅ Alumnos cargados: ${this.alumnos.length}`);
        } else {
          console.warn('⚠️ Formato inesperado al cargar alumnos', resp);
          this.alumnos = [];
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP al cargar alumnos:', err);
        console.error('URL que falló:', url);
        console.error('Status:', err.status);
        console.error('Error completo:', err);
        this.alumnos = [];
      },
    });
  }

  // =======================================
  // CARGAR CERTIFICADOS (tabla principal) - ✅ CORREGIDO
  // =======================================
  cargarCertificados(): void {
    const url = `${this.apiBase}${this.maestroId}/certificados`;
    this.cargando = true;

    console.log('🔗 URL certificados:', url);
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        console.log('✅ Respuesta cargar certificados:', resp);
        console.log('🔍 Detalle de la respuesta:', JSON.stringify(resp, null, 2));

        if (Array.isArray(resp)) {
          this.certificados = resp.map((c: any) => {
            console.log('📊 Procesando certificado RAW:', c);
            
            const certificadoMapeado = {
              id: Number(c.id),
              id_nino: Number(c.alumno_id),
              // ✅ CORREGIDO: Usar alumno_nombre directamente del backend
              alumno: c.alumno_nombre || 'Sin nombre',
              promedio: Number(c.promedio) || 0,
              tipo: 'excelencia',
              ciclo: c.ciclo || '',
              creado_en: c.fecha_creacion || '',
              estado: c.estado || 'pendiente',
              archivo_path: null,
              nombre_archivo: null,
            } as Certificado;
            
            console.log('📊 Certificado mapeado:', certificadoMapeado);
            return certificadoMapeado;
          });
          console.log(`✅ Certificados cargados: ${this.certificados.length}`);
          
          // Verificar que el nombre del alumno se cargó correctamente
          if (this.certificados.length > 0) {
            console.log('🔍 Verificación - Primer certificado:');
            console.log('  ID:', this.certificados[0].id);
            console.log('  Alumno:', this.certificados[0].alumno);
            console.log('  Alumno ID:', this.certificados[0].id_nino);
            console.log('  Promedio:', this.certificados[0].promedio);
          }
        } else {
          console.warn('⚠️ Formato inesperado al cargar certificados', resp);
          this.certificados = [];
        }

        this.actualizarStats();
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error HTTP al cargar certificados:', err);
        console.error('URL que falló:', url);
        console.error('Status:', err.status);
        this.certificados = [];
        this.actualizarStats();
        this.cargando = false;
      },
    });
  }

  // =======================================
  // GET ESTADÍSTICAS
  // =======================================
  getEstadisticas(): void {
    const url = `${this.apiBase}${this.maestroId}/estadisticas`;
    
    console.log('🔗 URL estadísticas:', url);
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        console.log('✅ Estadísticas del backend:', resp);
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
        console.error('❌ Error cargando estadísticas:', err);
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
      cicloEscolar: this.form.cicloEscolar || '2025-2026',
      tipo: 'excelencia',
      teacherName: this.settings.maestro,
    };
  }

  cerrarModal(): void {
    this.mostrarFormularioCertificado = false;
  }

  cambiarCheckUsarUltimo(): void {
    console.log('usarUltimo:', this.usarUltimo);
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

    const url = `${this.apiBase}${this.maestroId}/certificados`;

    // Enviamos los datos según espera el backend
    const payload = {
      alumno_id: this.form.alumnoId,
      promedio: this.form.promedio,
      ciclo: this.form.cicloEscolar.trim(),
      maestro_firma: this.form.teacherName.trim()
    };

    console.log('🔗 URL crear certificado:', url);
    console.log('📦 Payload:', payload);

    this.cargando = true;

    this.http.post<any>(url, payload, { headers: this.getHeaders() }).subscribe({
      next: async (resp) => {
        console.log('✅ Respuesta crear certificado:', resp);

        if (resp && resp.success) {
          alert('✅ Certificado creado exitosamente.');

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
          this.getEstadisticas(); // actualiza estadísticas
        } else {
          alert(resp?.message || 'No se pudo crear el certificado.');
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error HTTP al crear certificado:', err);
        alert('Error HTTP al crear el certificado: ' + err.message);
        this.cargando = false;
      },
    });
  }

  // =======================================
  // ACCIONES DE LA TABLA
  // =======================================
  descargar(id: number): void {
    // TODO: Implementar cuando el backend tenga este endpoint
    console.log('Descargar certificado ID:', id);
    alert('Función de descarga pendiente de implementar en el backend');
  }

  ver(certificado: Certificado): void {
    console.log('👁️ Ver certificado:', certificado);
    alert(`Detalles del certificado:\nAlumno: ${certificado.alumno}\nPromedio: ${certificado.promedio}\nCiclo: ${certificado.ciclo}\nEstado: ${certificado.estado}`);
  }

  enviar(id: number): void {
    const confirmado = confirm('¿Marcar este certificado como ENVIADO?');
    if (!confirmado) return;

    const url = `${this.apiBase}certificados/${id}/estado`;
    
    console.log('🔗 URL cambiar estado:', url);

    const payload = { estado: 'enviado' };

    this.http.put<any>(url, payload, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        console.log('✅ Respuesta cambiar estado:', resp);

        if (resp && resp.success) {
          const cert = this.certificados.find((c) => c.id === id);
          if (cert) {
            cert.estado = 'enviado';
          }
          this.actualizarStats();
          alert('✅ Certificado marcado como enviado.');
        } else {
          alert(resp?.message || 'No se pudo cambiar el estado.');
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

    const url = `${this.apiBase}certificados/${id}`;
    
    console.log('🔗 URL eliminar:', url);

    this.http.delete<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        console.log('✅ Respuesta eliminar certificado:', resp);

        if (resp && resp.success) {
          this.certificados = this.certificados.filter(
            (c) => c.id !== id
          );
          this.actualizarStats();
          alert('✅ Certificado eliminado exitosamente.');
        } else {
          alert(resp?.message || 'No se pudo eliminar el certificado.');
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
      const url = `http://localhost:3000/api/maestro/graduacion/${this.maestroId}/upload-logo`;
      console.log('🔗 URL upload logo:', url);
      
      const resp = await fetch(url, {
        method: 'POST',
        body: fd
      });
      
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const json = await resp.json();
      
      if (!json.success) throw new Error(json.message || 'Error subiendo logo');
      
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
    this.getEstadisticas();
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
    return this.settings.logoUrl.startsWith('http') ? 
      this.settings.logoUrl : 
      `http://localhost:3000/${this.settings.logoUrl}`;
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

  // =======================================
  // MÉTODO PARA VERIFICAR DATOS - NUEVO
  // =======================================
  verificarDatosCertificados() {
    console.log('🔍 VERIFICANDO DATOS DE CERTIFICADOS:');
    console.log('📊 Número de certificados:', this.certificados.length);
    
    if (this.certificados.length === 0) {
      console.log('⚠️ No hay certificados cargados');
      return;
    }
    
    this.certificados.forEach((cert, index) => {
      console.log(`📄 Certificado ${index + 1} (ID: ${cert.id}):`, {
        id: cert.id,
        alumno: cert.alumno,
        '¿Tiene valor?': cert.alumno ? 'SÍ' : 'NO',
        'Valor exacto': `"${cert.alumno}"`,
        id_nino: cert.id_nino,
        promedio: cert.promedio,
        ciclo: cert.ciclo,
        estado: cert.estado,
        creado_en: cert.creado_en
      });
    });
    
    // Verificar también los datos crudos del backend
    console.log('🔍 SOLICITANDO DATOS CRUDOS DEL BACKEND...');
    const url = `${this.apiBase}${this.maestroId}/certificados`;
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (resp) => {
        console.log('🔍 DATOS CRUDOS DEL BACKEND:', resp);
        if (Array.isArray(resp) && resp.length > 0) {
          console.log('🔍 Primer objeto crudo completo:', resp[0]);
          console.log('🔍 Todas las propiedades del objeto crudo:', Object.keys(resp[0]));
          console.log('🔍 Valor de alumno_nombre crudo:', resp[0].alumno_nombre);
          console.log('🔍 Tipo de alumno_nombre:', typeof resp[0].alumno_nombre);
        }
      },
      error: (err) => {
        console.error('❌ Error al obtener datos crudos:', err);
      }
    });
  }
}