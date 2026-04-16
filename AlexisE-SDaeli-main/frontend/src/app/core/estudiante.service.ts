import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AlumnoCompleto {
  id: number;
  nombre: string;
  email: string;
  grado: string;
  grupo: string;
  fecha_nacimiento: string;
}

@Injectable({ providedIn: 'root' })
export class EstudianteService {
  private http = inject(HttpClient);

  obtenerAlumno(id: number): Promise<AlumnoCompleto | undefined> {
    return this.http
      .get<AlumnoCompleto>(`/api/Estudiantes/detalles.php?id=${id}`)
      .toPromise()
      .catch(err => {
        console.error('Error obteniendo alumno:', err);
        return undefined;
      });
  }
}
