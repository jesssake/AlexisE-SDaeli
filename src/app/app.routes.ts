// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, canMatchAuth } from './core/guards/auth-guard';

// Auth
import { RegistroComponent } from './features/auth/registro/registro.component';

// Maestro
import { MaestroComponent } from './features/maestro/menu-maestro/maestro.component';
import { DashboardComponent } from './features/maestro/dashboard/dashboard.component';
import { EstudiantesComponent } from './features/maestro/estudiantes/estudiantes.component';
import { TareasComponent } from './features/maestro/tareas/tareas.component';
import { AsistenciaComponent } from './features/maestro/asistencia/asistencia.component';
import { CalificacionesComponent } from './features/maestro/calificaciones/calificaciones.component';
import { ReportesComponent } from './features/maestro/reportes/reportes.component';
import { PadresComponent } from './features/maestro/padres/padres.component';
import { GraduacionComponent } from './features/maestro/graduacion/graduacion.component';
import { ManualComponent } from './features/maestro/manual/manual.component';
import { ConfiguracionComponent } from './features/maestro/configuracion/configuracion.component';

// Estudiante
import { MenuAlumnoComponent } from './features/Estudiantes/menu-alumno/menu-alumno.component';
import { DashboardComponent as DashboardAlumnoComponent } from './features/Estudiantes/dashboard/dashboard.component';
import { TareasComponent as TareasAlumnoComponent } from './features/Estudiantes/tareas/tareas.component';
import { EstudianteAsistenciaComponent as AsistenciaAlumnoComponent } from './features/Estudiantes/asistencia/asistencia.component';
import { CalificacionesComponent as CalificacionesAlumnoComponent } from './features/Estudiantes/calificaciones/calificaciones.component';
import { ReportesAlumnoComponent } from './features/Estudiantes/reportes/reportes.component';
import { GraduacionComponent as GraduacionAlumnoComponent } from './features/Estudiantes/graduacion/graduacion.component';
import { ManualComponent as ManualAlumnoComponent } from './features/Estudiantes/manual/manual.component';
import { ConfiguracionComponent as ConfiguracionAlumnoComponent } from './features/Estudiantes/configuracion/configuracion.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  // Auth
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canMatch: [canMatchAuth],
  },
  { path: 'auth/registro', component: RegistroComponent, canMatch: [canMatchAuth] },

  // Maestro
  {
    path: 'maestro',
    canActivate: [authGuard],
    component: MaestroComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'estudiantes', component: EstudiantesComponent },
      { path: 'tareas', component: TareasComponent },
      { path: 'asistencia', component: AsistenciaComponent },
      { path: 'calificaciones', component: CalificacionesComponent },
      { path: 'reportes', component: ReportesComponent },
      { path: 'padres', component: PadresComponent },
      { path: 'graduacion', component: GraduacionComponent },
      { path: 'manual', component: ManualComponent },
      { path: 'configuracion', component: ConfiguracionComponent },
    ],
  },

  // Estudiante
  {
    path: 'estudiante',
    canActivate: [authGuard],
    component: MenuAlumnoComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardAlumnoComponent },
      { path: 'tareas', component: TareasAlumnoComponent },
      { path: 'asistencia', component: AsistenciaAlumnoComponent },
      { path: 'calificaciones', component: CalificacionesAlumnoComponent },

      // ✅ Chat de padres para el alumno (lazy load del componente de Estudiantes)
      {
        path: 'padres',
        loadComponent: () =>
          import('./features/Estudiantes/padres/padres.component')
            .then(m => m.PadresComponent),
      },

      { path: 'reportes', component: ReportesAlumnoComponent },
      { path: 'graduacion', component: GraduacionAlumnoComponent },
      { path: 'manual', component: ManualAlumnoComponent },
      { path: 'configuracion', component: ConfiguracionAlumnoComponent },
    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];
