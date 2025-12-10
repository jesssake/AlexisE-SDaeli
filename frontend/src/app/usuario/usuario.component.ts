import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../usuario.service';
import { CommonModule } from '@angular/common';  // Asegúrate de importar CommonModule

@Component({
  selector: 'app-usuario',
  standalone: true,  // Asegúrate de que esté como standalone
  imports: [CommonModule],  // Importa CommonModule aquí
  template: `
    <ul>
      <li *ngFor="let usuario of usuarios">
        {{ usuario.nombre }} ({{ usuario.tipo_usuario }})
      </li>
    </ul>
  `
})
export class UsuarioComponent implements OnInit {
  usuarios: any[] = [];

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.usuarioService.getUsuarios().subscribe(data => {
      this.usuarios = data;
    });
  }
}
