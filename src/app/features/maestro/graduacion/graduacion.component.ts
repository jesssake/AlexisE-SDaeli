import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CertificadoService } from './certificado.service';

interface Certificado {
  id: number;
  alumno_id: number;
  tipo: string;
  ciclo: string;
  fecha: string;
  enviado: number;
}

interface Estudiante {
  id: number;
  nombre: string;
  promedio?: number;
}

@Component({
  selector: 'app-graduacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './graduacion.component.html',
  styleUrls: ['./graduacion.component.scss']
})
export class GraduacionComponent implements OnInit {
  // =====================
  // Estado UI
  // =====================
  cargando = false;
  enviando = false;
  mostrarFormularioCertificado = false;

  okMsg: string | null = null;
  errorMsg: string | null = null;

  // =====================
  // Datos
  // =====================
  certificados: Certificado[] = [];
  estudiantes: Estudiante[] = [];

  // =====================
  // Modal nuevo certificado
  // =====================
  modalForm = {
    nombre: '',
    ciclo: '',
  };

  modalBrand = {
    teacherName: '',
    logoDataUrl: ''
  };

  // =====================
  // Filtros
  // =====================
  filtroTipo = signal<string>('todos');
  filtroEstado = signal<string>('todos');
  filtroAlumnoId = signal<number | 'todos'>('todos');

  constructor(private certificadoService: CertificadoService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // =====================
  // Carga inicial
  // =====================
  async cargarDatos() {
    this.cargando = true;

    // Simulación de carga de datos
    this.certificados = [
      { id: 1, alumno_id: 1, tipo: 'excelencia', ciclo: '2024-2025', fecha: '2025-06-20', enviado: 0 },
      { id: 2, alumno_id: 2, tipo: 'cierre', ciclo: '2024-2025', fecha: '2025-06-20', enviado: 1 },
    ];

    this.estudiantes = [
      { id: 1, nombre: 'Luis Pérez', promedio: 9.8 },
      { id: 2, nombre: 'Ana Díaz', promedio: 8.5 },
    ];

    this.cargando = false;
  }

  alumnosIndex() {
    return new Map(this.estudiantes.map((a) => [a.id, a]));
  }

  certificadosFiltrados() {
    return this.certificados.filter((c) => {
      if (this.filtroTipo() !== 'todos' && c.tipo !== this.filtroTipo()) return false;
      if (this.filtroEstado() !== 'todos') {
        const esEnviado = c.enviado === 1;
        if (this.filtroEstado() === 'enviados' && !esEnviado) return false;
        if (this.filtroEstado() === 'pendientes' && esEnviado) return false;
      }
      if (this.filtroAlumnoId() !== 'todos' && c.alumno_id !== this.filtroAlumnoId()) return false;
      return true;
    });
  }

  // =====================
  // Estadísticas
  // =====================
  obtenerTotalCertificados(): number {
    return this.certificados.length;
  }

  obtenerCertificadosExcelencia(): number {
    return this.certificados.filter(c => c.tipo === 'excelencia').length;
  }

  obtenerCertificadosCierre(): number {
    return this.certificados.filter(c => c.tipo === 'cierre').length;
  }

  obtenerCertificadosEnviados(): number {
    return this.certificados.filter(c => c.enviado === 1).length;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-MX');
  }

  setFiltroAlumno(event: any) {
    this.filtroAlumnoId.set(event);
  }

  // =====================
  // Modal
  // =====================
  abrirModalNuevo() {
    this.mostrarFormularioCertificado = true;
    this.modalForm = { nombre: '', ciclo: '' };
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

  // =====================
  // Generación de PDF
  // =====================
  async generarPdfDesdeModal() {
    const nombre = this.modalForm.nombre.trim();
    if (!nombre) return;

    const pdfBytes = await this.certificadoService.generarPDFConNombre(nombre);
    this.certificadoService.descargarPDF(pdfBytes, `Certificado_${nombre}.pdf`);
    this.cerrarModal();
  }

  descargarCertificado(c: Certificado) {
    // Simulación temporal
    this.certificadoService.generarPDFConNombre('Simulado').then(bytes => {
      this.certificadoService.descargarPDF(bytes, `Certificado_${c.id}.pdf`);
    });
  }

  // =====================
  // Acciones sobre certificados
  // =====================
  enviarCertificado(c: Certificado) {
    this.enviando = true;
    setTimeout(() => {
      c.enviado = 1;
      this.enviando = false;
    }, 1500);
  }

  eliminarCertificado(id: number) {
    this.certificados = this.certificados.filter(c => c.id !== id);
  }
}
