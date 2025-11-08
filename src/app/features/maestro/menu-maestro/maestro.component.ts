import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-maestro',
  templateUrl: './maestro.component.html',
  styleUrls: ['./maestro.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class MaestroComponent implements OnInit {
  nombreUsuario = 'Maestro Juan';
  menuAbierto = false;
  seccionActual = 'Dashboard';

  // Mapa "segmento -> TÃ­tulo bonito"
  private readonly TITULOS: Record<string, string> = {
    '': 'Dashboard',
    'dashboard': 'Dashboard',
    'estudiantes': 'Estudiantes',
    'tareas': 'Tareas',
    'asistencia': 'Asistencia',
    'calificaciones': 'Calificaciones',
    'reportes': 'Reportes',
    'padres': 'Padres',
    'graduacion': 'GraduaciÃ³n',
    'manual': 'Manual',
    'configuracion': 'ConfiguraciÃ³n'
  };

  constructor(public router: Router) {}

  ngOnInit(): void {
        try { document?.body?.classList?.remove("dark","dark-mode"); } catch {}this.verificarAnchoPantalla();
    this.actualizarSeccionActual();

    // Escuchar cambios de navegaciÃ³n
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.actualizarSeccionActual());
  }

  private actualizarSeccionActual(): void {
    // Quitar query/hash y quedarnos con la ruta
    const url = this.router.url.split('?')[0].split('#')[0];

    // Tomar lo que viene despuÃ©s de /maestro/
    // /maestro -> ''  |  /maestro/tareas/123 -> 'tareas'
    const after = url.replace(/^\/maestro\/?/, '');
    const primerSegmento = after.split('/')[0]; // puede ser '' si es /maestro

    this.seccionActual = this.TITULOS[primerSegmento] ?? 'Dashboard';
  }

  @HostListener('window:resize')
  onResize() {
    this.verificarAnchoPantalla();
  }

  private verificarAnchoPantalla(): void {
    if (window.innerWidth > 768) {
      this.menuAbierto = false; // evita que quede abierto en escritorio
    }
  }

  cambiarSeccion(seccion: string): void {
    // SecciÃ³n = primer segmento (ej. 'tareas', 'asistencia', etc.)
    this.router.navigate(['/maestro', seccion]);

    if (window.innerWidth <= 768) this.cerrarMenu();
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  cerrarSesion(): void {
    this.router.navigate(['/login']);
  }

  obtenerIniciales(): string {
    return this.nombreUsuario.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
