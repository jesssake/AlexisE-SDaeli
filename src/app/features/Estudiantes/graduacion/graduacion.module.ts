import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';  // Necesario para *ngFor
import { FormsModule } from '@angular/forms';    // Necesario para ngModel
import { GraduacionComponent } from './graduacion.component';  // Importa el componente correctamente

@NgModule({
  declarations: [
    // No es necesario declarar GraduacionComponent aquí porque es standalone
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: []  // No necesitas declarar el componente aquí
})
export class GraduacionModule {}
