// app.routes.ts
import { Routes, CanMatchFn } from '@angular/router';
import { RegistroComponent } from './features/auth/registro/registro.component';

// Guard temporal: permite acceso
export const canMatchAuth: CanMatchFn = () => {
  console.log('✅ canMatchAuth ejecutado - permitiendo acceso');
  return true;
};

export const routes: Routes = [
  // Ruta raíz -> login
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  // ======================
  // AUTH
  // ======================
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent),
    canMatch: [canMatchAuth]
  },
  {
    path: 'auth/registro',
    component: RegistroComponent,
    canMatch: [canMatchAuth]
  },

  // ======================
  // MAESTRO
  // ======================
  {
    path: 'maestro',
    loadComponent: () =>
      import('./features/maestro/menu-maestro/maestro.component')
        .then(m => m.MaestroComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/maestro/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'estudiantes',
        loadComponent: () =>
          import('./features/maestro/estudiantes/estudiantes.component')
            .then(m => m.EstudiantesComponent)
      },
      {
        path: 'asistencia',
        loadComponent: () =>
          import('./features/maestro/asistencia/asistencia.component')
            .then(m => m.AsistenciaComponent)
      },
      {
        path: 'padres',
        loadComponent: () =>
          import('./features/maestro/padres/padres.component')
            .then(m => m.PadresComponent)
      },
      {
        path: 'tareas',
        loadComponent: () =>
          import('./features/maestro/tareas/tareas.component')
            .then(m => m.TareasComponent)
      },
      {
        path: 'calificaciones',
        loadComponent: () =>
          import('./features/maestro/calificaciones/calificaciones.component')
            .then(m => m.CalificacionesComponent)
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/maestro/reportes/reportes.component')
            .then(m => m.ReportesComponent)
      },
      {
        path: 'graduacion',
        loadComponent: () =>
          import('./features/maestro/graduacion/graduacion.component')
            .then(m => m.GraduacionComponent)
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/maestro/configuracion/configuracion.component')
            .then(m => m.ConfiguracionComponent)
      },
      {
        path: 'manual',
        loadComponent: () =>
          import('./features/maestro/manual/manual.component')
            .then(m => m.ManualComponent)
      }
    ]
  },

  // ======================
  // ESTUDIANTE
  // ======================
  {
    path: 'estudiante',
    loadComponent: () =>
      import('./features/Estudiantes/menu-alumno/menu-alumno.component')
        .then(m => m.MenuAlumnoComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/Estudiantes/dashboard/dashboard.component')
            .then(m => m.DashboardEstudianteComponent)
      },
      {
        path: 'asistencia',
        loadComponent: () =>
          import('./features/Estudiantes/asistencia/asistencia.component')
            .then(m => m.EstudianteAsistenciaComponent)
      },
      {
        path: 'tareas',
        loadComponent: () =>
          import('./features/Estudiantes/tareas/tareas.component')
            .then(m => m.TareasEstudianteComponent)
      },
      {
        path: 'calificaciones',
        loadComponent: () =>
          import('./features/Estudiantes/calificaciones/calificaciones.component')
            .then(m => m.CalificacionesComponent)
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/Estudiantes/padres/padres.component')
            .then(m => m.PadresEstudianteComponent)
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/Estudiantes/reportes/reportes.component')
            .then(m => m.ReportesAlumnoComponent)
      },

      // ✅ GRADUACIÓN ESTUDIANTE (CORRECTO)
      {
        path: 'graduacion',
        loadComponent: () =>
          import('./features/Estudiantes/graduacion/graduacion.component')
            .then(m => m.EstudianteGraduacionComponent)
      }
    ]
  },

  // Wildcard -> login
  { path: '**', redirectTo: 'auth/login' }
];
