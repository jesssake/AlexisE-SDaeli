import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CertificadoService } from './certificado.service';

interface Certificado {
  id: number;
  alumno_id: number;
  tipo: 'excelencia' | 'cierre';
  ciclo: string;
  fecha: string;
  enviado: number;
}

interface Estudiante {
  id: number;
  nombre: string;
  promedio: number;
}

@Component({
  selector: 'app-graduacion',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './graduacion.component.html',
  styleUrls: ['./graduacion.component.scss'],
})
export class GraduacionComponent implements OnInit {
  cargando = false;
  enviando = false;
  mostrarFormularioCertificado = false;

  okMsg: string | null = null;
  errorMsg: string | null = null;

  certificados: Certificado[] = [];
  estudiantes: Estudiante[] = [];

  // 👇 datos del formulario del modal
  modalForm = {
    alumnoId: null as number | null,
    nombre: '',
    ciclo: '',
    promedio: 0,
  };

  modalBrand = {
    teacherName: '',
    logoDataUrl: '',
  };

  // filtros
  filtroTipo: 'todos' | 'excelencia' | 'cierre' = 'todos';  // Se cambia a variable
  filtroEstado: 'todos' | 'enviados' | 'pendientes' = 'todos';  // Se cambia a variable
  filtroAlumnoId: 'todos' | number = 'todos';  // Se cambia a variable

  // URL ABSOLUTA (CORS habilitado en certificados.php)
  private apiCertificados =
    'http://localhost/gestion_e/Certificados/certificados.php';

  constructor(
    private certificadoService: CertificadoService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // =====================
  // CARGA INICIAL DESDE PHP
  // =====================
  cargarDatos() {
    this.cargando = true;

    this.http
      .get<{ success: boolean; data: any[] }>(this.apiCertificados)
      .subscribe({
        next: (resp) => {
          console.log('certificados.php resp =>', resp);

          if (!resp.success) {
            this.mostrarError('No se pudieron cargar los alumnos.');
            this.cargando = false;
            return;
          }

          // alumnos
          this.estudiantes = resp.data.map((row) => ({
            id: Number(row.estudianteId),
            nombre: String(row.nombre),
            promedio: Number(row.promedio ?? 0),
          }));

          // certificados base (uno por alumno)
          this.certificados = resp.data.map((row, index) => ({
            id: index + 1,
            alumno_id: Number(row.estudianteId),
            tipo: (row.tipo ?? 'cierre') as 'excelencia' | 'cierre',
            ciclo: String(row.cicloEscolar ?? ''),
            fecha: new Date().toISOString().substring(0, 10),
            enviado: row.estado === 'enviado' ? 1 : 0,
          }));

          this.cargando = false;
        },
        error: (err) => {
          console.error('Error HTTP certificados.php =>', err);
          this.mostrarError('Error de conexión al cargar datos.');
          this.cargando = false;
        },
      });
  }

  // índice rápido por id
  alumnosIndex() {
    return new Map(this.estudiantes.map((a) => [a.id, a]));
  }

  // =====================
  // FILTROS
  // =====================
  certificadosFiltrados() {
    return this.certificados.filter((c) => {
      if (this.filtroTipo !== 'todos' && c.tipo !== this.filtroTipo) {
        return false;
      }

      if (this.filtroEstado !== 'todos') {
        const esEnviado = c.enviado === 1;
        if (this.filtroEstado === 'enviados' && !esEnviado) return false;
        if (this.filtroEstado === 'pendientes' && esEnviado) return false;
      }

      if (
        this.filtroAlumnoId !== 'todos' &&
        c.alumno_id !== Number(this.filtroAlumnoId)
      ) {
        return false;
      }

      return true;
    });
  }

  obtenerTotalCertificados() {
    return this.certificados.length;
  }
  obtenerCertificadosExcelencia() {
    return this.certificados.filter((c) => c.tipo === 'excelencia').length;
  }
  obtenerCertificadosCierre() {
    return this.certificados.filter((c) => c.tipo === 'cierre').length;
  }
  obtenerCertificadosEnviados() {
    return this.certificados.filter((c) => c.enviado === 1).length;
  }

  formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-MX');
  }

  setFiltroAlumno(event: any) {
    this.filtroAlumnoId = event;
  }

  // =====================
  // MODAL
  // =====================
  abrirModalNuevo() {
    this.mostrarFormularioCertificado = true;
    this.modalForm = {
      alumnoId: null,
      nombre: '',
      ciclo: '',
      promedio: 0,
    };
    this.modalBrand = { teacherName: '', logoDataUrl: '' };
  }

  cerrarModal() {
    this.mostrarFormularioCertificado = false;
  }

  onLogoSelectedModal(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        this.modalBrand.logoDataUrl = reader.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  // cuando seleccionas un alumno en el modal
  onAlumnoSeleccionado(id: number | null) {
    this.modalForm.alumnoId = id;
    if (id == null) {
      this.modalForm.nombre = '';
      this.modalForm.promedio = 0;
      return;
    }

    const alumno = this.alumnosIndex().get(id);
    if (alumno) {
      this.modalForm.nombre = alumno.nombre;
      this.modalForm.promedio = alumno.promedio;
    }
  }

  // =====================
  // GENERAR PDF DESDE MODAL
  // =====================
  async generarPdfDesdeModal() {
    let nombre = this.modalForm.nombre.trim();
    let promedio = Number(this.modalForm.promedio);

    // si eligió un alumno, usamos sus datos de la BD
    if (this.modalForm.alumnoId != null) {
      const a = this.alumnosIndex().get(this.modalForm.alumnoId);
      if (a) {
        nombre = a.nombre;
        promedio = a.promedio;
      }
    }

    if (!nombre) {
      this.mostrarError('Selecciona un alumno o escribe un nombre.');
      return;
    }

    try {
      const bytes = await this.certificadoService.generarPDF(
        nombre,
        promedio || 0
      );
      this.certificadoService.descargarPDF(
        bytes,
        `Certificado_${nombre}.pdf`
      );
      this.mostrarOk('Certificado generado.');
      this.cerrarModal();
    } catch (e) {
      console.error(e);
      this.mostrarError('Error al generar el certificado.');
    }
  }

  // =====================
  // DESCARGAR DESDE LA TABLA
  // =====================
  async descargarCertificado(c: Certificado) {
    const alumno = this.alumnosIndex().get(c.alumno_id);
    if (!alumno) {
      this.mostrarError('No se encontró información del alumno.');
      return;
    }

    try {
      const bytes = await this.certificadoService.generarPDF(
        alumno.nombre,
        alumno.promedio
      );
      this.certificadoService.descargarPDF(
        bytes,
        `Certificado_${alumno.nombre}.pdf`
      );
      this.mostrarOk(`Certificado descargado para ${alumno.nombre}`);
    } catch (e) {
      console.error(e);
      this.mostrarError('Error al descargar el PDF.');
    }
  }

  enviarCertificado(c: Certificado) {
    this.enviando = true;
    setTimeout(() => {
      c.enviado = 1;
      this.enviando = false;
      this.mostrarOk('Certificado marcado como enviado.');
    }, 1200);
  }

  eliminarCertificado(id: number) {
    this.certificados = this.certificados.filter((c) => c.id !== id);
    this.mostrarOk('Certificado eliminado.');
  }

  // =====================
  // MENSAJES
  // =====================
  private mostrarOk(msg: string) {
    this.okMsg = msg;
    setTimeout(() => (this.okMsg = null), 2500);
  }

  private mostrarError(msg: string) {
    this.errorMsg = msg;
    setTimeout(() => (this.errorMsg = null), 3000);
  }
}
