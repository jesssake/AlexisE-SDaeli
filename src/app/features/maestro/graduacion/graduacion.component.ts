// src/app/features/maestro/graduacion/graduacion.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
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

  // Base para tus endpoints PHP usando el proxy /api
  private apiBase = '/api/Certificados/';

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
    tipo: 'cierre' as TipoCertificado,
    teacherName: '',
  };

  // Logo en memoria
  logoFile: File | null = null;
  logoPreview: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarAlumnos();
    this.cargarCertificados();
  }

  // =======================================
  // CARGAR ALUMNOS (para selects)
  // =======================================
  cargarAlumnos(): void {
    const url = `${this.apiBase}alumnos_listar.php`;
    this.http.get<any>(url).subscribe({
      next: (resp) => {
        console.log('Respuesta cargar alumnos:', resp);

        if (resp && resp.ok && Array.isArray(resp.data)) {
          this.alumnos = resp.data as Alumno[];
        } else {
          console.warn('Formato inesperado al cargar alumnos', resp);
          this.alumnos = [];
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP al cargar alumnos:', err);
        this.alumnos = [];
      }
    });
  }

  // =======================================
  // CARGAR CERTIFICADOS (tabla principal)
  // =======================================
  cargarCertificados(): void {
    const url = `${this.apiBase}certificados_listar.php`;
    this.cargando = true;

    let params = new HttpParams();
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
              alumno: c.alumno ?? null,
              promedio: isNaN(promedioNum) ? 0 : promedioNum,
              tipo: c.tipo ?? 'cierre',
              ciclo: c.ciclo ?? '',
              creado_en: c.creado_en ?? '',
              estado: c.estado ?? 'pendiente',
              archivo_path: c.archivo_path ?? null,
              nombre_archivo: c.nombre_archivo ?? null,
            } as Certificado;
          });
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
      }
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
      tipo: 'cierre',
      teacherName: '',
    };
    this.logoFile = null;
    this.logoPreview = null;
  }

  cerrarModal(): void {
    this.mostrarFormularioCertificado = false;
  }

  cambiarCheckUsarUltimo(): void {
    console.log('usarUltimo:', this.usarUltimo);
    // Aquí podrías cargar del backend la última config (ciclo, maestro, logo), etc.
  }

  // Cuando eliges un alumno del select
  cuandoSeleccionaAlumno(): void {
    const seleccionado = this.alumnos.find(a => a.id === this.form.alumnoId);
    this.form.nombreAlumno = seleccionado ? seleccionado.nombre : '';
  }

  // Cargar logo localmente para previsualizarlo
  cargarLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.logoFile = null;
      this.logoPreview = null;
      return;
    }

    this.logoFile = input.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
    };
    reader.readAsDataURL(this.logoFile);
  }

  // =======================================
  // GENERAR CERTIFICADO (llama a PHP y genera PDF con pdf-lib)
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

    const url = `${this.apiBase}generar_certificado.php`;

    // Enviamos todo con FormData (incluye el logo si hay)
    const fd = new FormData();
    fd.append('alumnoId', String(this.form.alumnoId));
    fd.append('promedio', String(this.form.promedio));
    fd.append('cicloEscolar', this.form.cicloEscolar.trim());
    fd.append('tipo', this.form.tipo);
    fd.append('teacherName', this.form.teacherName.trim());

    if (this.logoFile) {
      fd.append('logo', this.logoFile, this.logoFile.name);
    }

    this.cargando = true;

    this.http.post<any>(url, fd).subscribe({
      next: async (resp) => {
        console.log('Respuesta generar_certificado:', resp);

        if (resp && resp.ok) {
          alert('✅ Certificado generado correctamente.');

          // Generar y descargar el PDF personalizado con pdf-lib
          await this.crearYDescargarPdfCertificado(
            this.form.nombreAlumno,
            this.form.promedio,
            this.form.cicloEscolar,
            this.form.teacherName
          );

          this.cerrarModal();
          this.cargarCertificados();   // refresca la tabla
        } else {
          alert(resp?.message || 'No se pudo generar el certificado (revisa el backend).');
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error HTTP al generar certificado:', err);
        alert('Error HTTP al generar el certificado.');
        this.cargando = false;
      }
    });
  }

  // =======================================
  // ACCIONES DE LA TABLA
  // =======================================
  descargar(id: number): void {
    const url = `${this.apiBase}descargar.php?id=${id}`;
    window.open(url, '_blank');
  }

  enviar(id: number): void {
    const confirmado = confirm('¿Marcar este certificado como ENVIADO?');
    if (!confirmado) return;

    const url = `${this.apiBase}certificados_cambiar_estado.php`;

    let body = new HttpParams()
      .set('id', String(id))
      .set('estado', 'enviado');

    this.http.post<any>(url, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).subscribe({
      next: (resp) => {
        console.log('Respuesta cambiar estado:', resp);

        if (resp && resp.ok) {
          const cert = this.certificados.find(c => c.id === id);
          if (cert) {
            cert.estado = 'enviado';
          }
          this.actualizarStats();
        } else {
          alert(resp?.message || 'No se pudo cambiar el estado (revisa el backend).');
        }
      },
      error: (err) => {
        console.error('❌ Error HTTP al cambiar estado:', err);
        alert('Error HTTP al cambiar el estado del certificado.');
      }
    });
  }

  eliminar(id: number): void {
  const confirmado = confirm('¿Seguro que quieres eliminar este certificado?');
  if (!confirmado) return;

  const url = `${this.apiBase}certificados_eliminar.php`;

  const body = new HttpParams().set('id', String(id));

  this.http.post<string>(url, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    // truco: pedimos 'text' pero se lo declaramos como 'json' para que compile
    responseType: 'text' as 'json',
  }).subscribe({
    next: (raw) => {
      console.log('Respuesta cruda eliminar certificado:', raw);

      let resp: any;
      try {
        resp = JSON.parse(raw as unknown as string);
      } catch (e) {
        console.error('No se pudo parsear el JSON de certificados_eliminar.php:', e);
        alert('Respuesta no válida del servidor al eliminar el certificado.');
        return;
      }

      console.log('Respuesta parseada eliminar certificado:', resp);

      if (resp && resp.success) {
        this.certificados = this.certificados.filter(c => c.id !== id);
        this.actualizarStats();
      } else {
        alert(resp?.message || 'No se pudo eliminar el certificado (revisa el backend).');
      }
    },
    error: (err) => {
      console.error(
        '❌ Error HTTP al eliminar certificado:',
        'status=', err.status,
        'url=', err.url,
        'message=', err.message,
        'body=', err.error
      );
      alert('Error HTTP al eliminar el certificado.');
    }
  });
}


  // =======================================
  // EXPORTAR (opcional)
  // =======================================
  exportarCertificados(): void {
    const url = `${this.apiBase}exportar.php`;
    window.open(url, '_blank');
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
      this.http.get(templateUrl, { responseType: 'arraybuffer' as 'json' })
    );
    const arrayBuffer = response as ArrayBuffer;

    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const page = pages[0];

    const { width } = page.getSize();
    const centerX = width / 2;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSizeNombre = 22;
    const fontSizeTexto = 12;

    // =============================
    // 1) Nombre del alumno
    //    (bajarlo un poco para que quede sobre la línea)
    // =============================
    const textNombre = nombreAlumno || 'Alumno';
    const textWidthNombre = fontBold.widthOfTextAtSize(
      textNombre,
      fontSizeNombre
    );

    // Antes ~340 → lo bajamos un poco
    const yNombre = 325;

    page.drawText(textNombre, {
      x: centerX - textWidthNombre / 2,
      y: yNombre,
      size: fontSizeNombre,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // =============================
    // 2) Promedio (solo número)
    //    moverlo a la derecha, sobre la línea izquierda
    // =============================
    const textoPromedio = promedio.toFixed(1);
    const textWidthPromedio = font.widthOfTextAtSize(
      textoPromedio,
      fontSizeTexto
    );

    // Antes x=210 → muy sobre la foto.
    // Lo movemos hacia el centro del certificado.
    const xPromedio = 380;
    const yPromedio = 225; // misma altura que el maestro

    page.drawText(textoPromedio, {
      x: xPromedio - textWidthPromedio / 2,
      y: yPromedio,
      size: fontSizeTexto,
      font,
      color: rgb(0, 0, 0),
    });

    // =============================
    // 3) Nombre del maestro
    //    (esto ya estaba bien, lo dejamos igual)
    // =============================
    const textoMaestro = nombreMaestro || '';
    const textWidthMaestro = font.widthOfTextAtSize(
      textoMaestro,
      fontSizeTexto
    );

    const xMaestro = width - 210; // línea derecha
    const yMaestro = 225;

    page.drawText(textoMaestro, {
      x: xMaestro - textWidthMaestro / 2,
      y: yMaestro,
      size: fontSizeTexto,
      font,
      color: rgb(0, 0, 0),
    });

    // =============================
    // 4) Ciclo escolar
    //    bajarlo para que quede en la línea encima de "Ciclo escolar"
    // =============================
    const textoCiclo = cicloEscolar;
    const textWidthCiclo = font.widthOfTextAtSize(
      textoCiclo,
      fontSizeTexto
    );

    // Antes 165 → estaba sobre los birretes
    const yCiclo = 135;

    page.drawText(textoCiclo, {
      x: centerX - textWidthCiclo / 2,
      y: yCiclo,
      size: fontSizeTexto,
      font,
      color: rgb(0, 0, 0),
    });

    // =============================
    // 5) Guardar y descargar
    // =============================
    const pdfBytes = await pdfDoc.save();

    const blob = new Blob(
      [pdfBytes as unknown as BlobPart],
      { type: 'application/pdf' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificado_${(nombreAlumno || 'alumno').replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al generar PDF con pdf-lib:', error);
  }
}

}
