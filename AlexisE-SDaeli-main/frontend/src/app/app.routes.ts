// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { RoleGuard } from './core/guards/role.guard';

// Elimina este guard temporal:
// export const canMatchAuth: CanMatchFn = () => { return true; };

export const routes: Routes = [
  // Ruta raíz -> login
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  // ======================
  // AUTH (PÚBLICO - sin protección)
  // ======================
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'auth/registro',
    loadComponent: () =>
      import('./features/auth/registro/registro.component')
        .then(m => m.RegistroComponent)
  },
  {
    path: 'recuperar',
    loadComponent: () =>
      import('./features/auth/recuperar/recuperar.component')
        .then(m => m.RecuperarComponent)
  },
  {
    path: 'recuperar/:token',
    loadComponent: () =>
      import('./features/auth/recuperar/recuperar.component')
        .then(m => m.RecuperarComponent)
  },

  // ======================
  // MAESTRO (PROTEGIDO)
  // ======================
  {
    path: 'maestro',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['maestro', 'admin'] },
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
  // ESTUDIANTE (PROTEGIDO)
  // ======================
  {
    path: 'estudiante',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['estudiante', 'tutor'] },
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
      {
        path: 'graduacion',
        loadComponent: () =>
          import('./features/Estudiantes/graduacion/graduacion.component')
            .then(m => m.EstudianteGraduacionComponent)
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/Estudiantes/configuracion/configuracion.component')
            .then(m => m.ConfiguracionComponent)
      },
      {
        path: 'manual',
        loadComponent: () =>
          import('./features/Estudiantes/manual/manual.component')
            .then(m => m.ManualComponent)
      }
    ]
  },

  // Wildcard -> login
  { path: '**', redirectTo: 'auth/login' }
];