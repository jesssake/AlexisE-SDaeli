import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Asegúrate de importar FormsModule

import { AppComponent } from './app.component'; // Si es un standalone, no lo declaras en NgModule
import { GraduacionComponent } from './features/Estudiantes/graduacion/graduacion.component';

@NgModule({
  declarations: [
    // No declaras AppComponent aquí, solo lo importas si es necesario
  ],
  imports: [
    BrowserModule,
    FormsModule,  // Asegúrate de agregar FormsModule aquí
    GraduacionComponent, // Si es standalone, solo lo importas
  ],
  providers: [],
})
export class AppModule { }
