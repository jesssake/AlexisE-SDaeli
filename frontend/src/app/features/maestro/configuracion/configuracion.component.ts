// configuracion.component.ts
import { Component, OnInit, Renderer2 } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface RegistroAuditoria {
  id: number;
  accion: string;
  usuario: string;
  realizada_en: string;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent implements OnInit {
  modoOscuro = false;
  mensaje = '';
  respaldoHecho = false;

  // Campos del usuario actual
  nuevoCorreo = '';
  contrasenaActual = '';
  contrasenaNueva = '';

  // Auditoría
  historial: RegistroAuditoria[] = [];

  constructor(private http: HttpClient, private renderer: Renderer2) {}

  ngOnInit(): void {
    const darkStored = localStorage.getItem('modoOscuro');
    if (darkStored === 'true') {
      this.modoOscuro = true;
      this.renderer.addClass(document.body, 'dark-mode');
    }

    this.obtenerHistorial();
  }

  activarModoOscuro(): void {
    this.modoOscuro = !this.modoOscuro;
    if (this.modoOscuro) {
      this.renderer.addClass(document.body, 'dark-mode');
    } else {
      this.renderer.removeClass(document.body, 'dark-mode');
    }
    localStorage.setItem('modoOscuro', this.modoOscuro.toString());
    this.registrarAuditoria(`El usuario activó el modo ${this.modoOscuro ? 'oscuro' : 'claro'}`);
  }

  hacerRespaldo(): void {
    this.respaldoHecho = true;
    this.registrarAuditoria('Se realizó un respaldo de la base de datos');
  }

  guardarCambiosUsuario(): void {
    if (!this.nuevoCorreo && !this.contrasenaActual && !this.contrasenaNueva) {
      this.mensaje = 'Completa al menos un campo para actualizar';
      return;
    }

    this.http.post<any>('http://localhost/gestion_e/Usuarios/actualizar_usuario.php', {
      nuevoCorreo: this.nuevoCorreo,
      contrasenaActual: this.contrasenaActual,
      contrasenaNueva: this.contrasenaNueva
    }).subscribe({
      next: res => {
        this.mensaje = res.mensaje || 'Datos actualizados';
        this.registrarAuditoria('El usuario actualizó sus datos');
        this.nuevoCorreo = '';
        this.contrasenaActual = '';
        this.contrasenaNueva = '';
      },
      error: () => {
        this.mensaje = 'Error al actualizar tus datos';
      }
    });
  }

  registrarAuditoria(accion: string): void {
    this.http.post('http://localhost/gestion_e/Auditorias/insertar_auditoria.php', { accion })
      .subscribe({
        next: () => this.mensaje = 'Acción registrada correctamente',
        error: () => this.mensaje = 'Error al registrar auditoría'
      });
  }

  obtenerHistorial(): void {
    this.http.get<RegistroAuditoria[]>('http://localhost/gestion_e/Auditorias/historial_api.php')
      .subscribe({
        next: data => this.historial = data,
        error: () => this.historial = []
      });
  }
}
