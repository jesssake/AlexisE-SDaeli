import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = 'http://localhost/mi_backend/api.php';  // URL de la API PHP

  constructor(private http: HttpClient) {}

  // Método para enviar las credenciales y verificar el login
  login(email: string, password: string): Observable<any> {
    const loginData = { email, password };
    return this.http.post<any>(this.apiUrl, loginData);
  }
}
