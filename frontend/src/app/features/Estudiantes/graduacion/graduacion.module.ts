// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\Estudiantes\graduacion\graduacion.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { EstudianteGraduacionComponent } from './graduacion.component';

const routes: Routes = [
  {
    path: '',
    component: EstudianteGraduacionComponent
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class GraduacionEstudianteModule { }