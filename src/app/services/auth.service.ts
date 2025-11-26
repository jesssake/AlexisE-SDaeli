import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment'; // Asegúrate de importar solo una vez el archivo de entorno
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private httpClient: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    const loginData = { email, password };

    return this.httpClient.post(`${environment.apiBase}/login.php`, loginData)
      .pipe(
        map(response => {
          if (response) {
            // Si el login es exitoso, redirige al dashboard
            this.router.navigate(['/dashboard']);
          }
        }),
        catchError(error => {
          console.error('Error de login', error);
          return throwError('Error al intentar iniciar sesión');
        })
      );
  }
}
