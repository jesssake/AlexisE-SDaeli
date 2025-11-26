import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Certificado {
  id: number;
  tipo: string;
  ciclo: string;
  promedio: string | null;
  estado: string;
  fecha_emision: string;
  archivo_path: string | null;
  nombre_archivo: string | null;
  alumno: string;
}

@Component({
  selector: 'app-graduacion-estudiante',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './graduacion.component.html',
  styleUrls: ['./graduacion.component.scss'],
})
export class GraduacionComponent implements OnInit {
  private apiBase = environment.apiBase + '/Certificados';

  cargando = signal(false);
  errorMsg = signal<string | null>(null);
  certificados = signal<Certificado[]>([]);

  // Por ahora fijo al id del niño que probaste (Pedro = 3)
  alumnoId = 3;

  tieneCertificados = computed(() => this.certificados().length > 0);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarCertificados();
  }

  cargarCertificados(): void {
    this.cargando.set(true);
    this.errorMsg.set(null);

    const url = `${this.apiBase}/certificados_estudiante.php`;
    const params = { alumnoId: this.alumnoId.toString() };

    this.http
      .get<{ success: boolean; data: Certificado[]; message?: string }>(url, { params })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.certificados.set(res.data ?? []);
          } else {
            this.errorMsg.set(res.message || 'No se pudieron cargar los certificados.');
          }
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error al cargar certificados', err);
          this.errorMsg.set('Ocurrió un error al cargar los certificados.');
          this.cargando.set(false);
        },
      });
  }

  abrirCertificado(ruta: string | null): void {
    if (!ruta) return;
    window.open(ruta, '_blank');
  }
}
