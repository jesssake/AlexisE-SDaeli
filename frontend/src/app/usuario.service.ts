import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'  // Esto asegura que el servicio esté disponible globalmente
})
export class UsuarioService {

  private apiUrl = 'http://localhost/mi_backend/api.php';  // Cambia la URL según tu API

  constructor(private http: HttpClient) {}

  // Método para obtener los usuarios
  getUsuarios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}
