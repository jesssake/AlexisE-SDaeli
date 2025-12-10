import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent implements OnInit {

  // ================================
  // VARIABLES
  // ================================
  apiConfig = environment.apiBase + '/configuracion';

  cargando = false;
  errorMsg = '';
  rol = 'ALUMNO';

  alumnoId: number | null = null;
  usuarioNombre = '';
  usuarioEmail = '';
  usuarioRol = '';

  listaNinos: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  // ================================
  // INICIO
  // ================================
  ngOnInit(): void {
    console.log('🎯 Iniciando componente CONFIGURACIÓN DUAL...');
    console.log('API CONFIGURACIÓN →', this.apiConfig);

    this.cargarSesion();
  }

  // ================================
  // CARGAR SESIÓN
  // ================================
  cargarSesion() {
    try {
      const data = localStorage.getItem('userData');
      if (!data) {
        this.errorMsg = 'No se encontró la sesión del estudiante.';
        return;
      }

      const user = JSON.parse(data);

      this.usuarioNombre = user.nombre;
      this.usuarioEmail = user.email;
      this.usuarioRol = user.rol?.toUpperCase() ?? 'ALUMNO';
      this.alumnoId = user.alumno_id ?? null;

      console.log('🔍 Rol detectado:', this.usuarioRol);

      if (this.usuarioRol === 'TUTOR') {
        this.cargarNinos(user.id);
      }
    } catch (err) {
      console.error('Error leyendo sesión:', err);
    }
  }

  // ================================
  // CARGAR NIÑOS DEL TUTOR
  // ================================
  cargarNinos(tutor_id: number) {
    this.cargando = true;
    this.errorMsg = '';

    const url = `${this.apiConfig}/ninos_tutor.php?tutor_id=${tutor_id}`;
    console.log('➡️ Solicitando alumnos a:', url);

    this.http.get(url).subscribe({
      next: (res: any) => {
        console.log('📥 Respuesta de ninos_tutor:', res);

        if (!res.ok) {
          this.errorMsg = 'Error en la respuesta del servidor.';
          this.listaNinos = [];
        } else {
          this.listaNinos = res.ninos || [];
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando alumnos:', err);
        this.errorMsg = 'Error al cargar los alumnos.';
        this.cargando = false;
      }
    });
  }

  // ================================
  // DEBUG
  // ================================
  debug() {
    console.table(this.listaNinos);
  }
}
