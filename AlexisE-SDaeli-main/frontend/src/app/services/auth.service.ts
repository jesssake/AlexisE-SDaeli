import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, fromEvent } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
    // Validar token al inicio de la aplicación
    this.validarTokenAlInicio();
    // Escuchar cambios en sessionStorage entre pestañas
    this.setupStorageListener();
  }

  // =====================================================
  // 🔐 LOGIN
  // =====================================================
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.success) {
          // Guardar token (viene del backend) - usando sessionStorage
          const token = response.token;
          if (token) {
            sessionStorage.setItem('authToken', token);
            sessionStorage.setItem('token', token);
          }
          
          // Guardar datos del usuario - usando sessionStorage
          if (response.id) sessionStorage.setItem('userId', response.id.toString());
          if (response.rol) sessionStorage.setItem('userRole', response.rol);
          if (response.nombre) sessionStorage.setItem('userNombre', response.nombre);
          if (response.email) sessionStorage.setItem('userEmail', response.email);
          
          // Guardar datos completos - usando sessionStorage
          sessionStorage.setItem('userData', JSON.stringify({
            id: response.id,
            email: response.email,
            nombre: response.nombre,
            rol: response.rol,
            tipo: response.tipo
          }));
          
          this.isAuthenticatedSubject.next(true);
          console.log('✅ Sesión guardada correctamente en sessionStorage');
          console.log('📝 Rol guardado:', response.rol);
        }
      })
    );
  }

  // =====================================================
  // ✅ VALIDAR TOKEN CON EL BACKEND
  // =====================================================
  validarToken(): Observable<boolean> {
    const token = this.getToken();
    
    if (!token) {
      console.log('❌ No hay token para validar');
      return of(false);
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    const url = `http://localhost:3000/api/auth/validar-token`;
    console.log('🔍 Validando token con backend:', url);
    
    return this.http.get(url, { headers }).pipe(
      map((response: any) => {
        const isValid = response.ok === true || response.success === true;
        if (isValid) {
          console.log('✅ Token válido');
          
          // 🔴 IMPORTANTE: NO sobreescribir el rol si ya existe
          // Solo actualizar si la respuesta tiene datos válidos
          if (response.user && response.user.id) {
            // Verificar que el rol no se sobreescriba incorrectamente
            const currentRole = this.getUserRole();
            console.log('🔍 Rol actual en sessionStorage:', currentRole);
            console.log('🔍 Rol recibido del backend:', response.user.rol);
            
            // Solo actualizar si el rol es consistente
            if (currentRole === 'tutor' && response.user.rol === 'maestro') {
              console.warn('⚠️ No se actualizará rol de tutor a maestro');
              // No actualizar userData para preservar el rol correcto
            } else {
              this.updateUserData(response.user);
            }
          }
          this.isAuthenticatedSubject.next(true);
        } else {
          console.log('❌ Token inválido');
          this.isAuthenticatedSubject.next(false);
        }
        return isValid;
      }),
      catchError((error) => {
        console.error('❌ Error validando token:', error.status, error.message);
        
        if (error.status === 404) {
          console.warn('⚠️ Endpoint de validación no encontrado, permitiendo acceso en desarrollo');
          this.isAuthenticatedSubject.next(true);
          return of(true);
        }
        
        this.isAuthenticatedSubject.next(false);
        return of(false);
      })
    );
  }

  // =====================================================
  // 🔄 VALIDAR TOKEN AL INICIO DE LA APLICACIÓN
  // =====================================================
  private validarTokenAlInicio(): void {
    const token = this.getToken();
    if (token) {
      this.validarToken().subscribe(isValid => {
        if (!isValid) {
          console.log('🔒 Token inválido al inicio, limpiando sesión');
          this.logout();
        } else {
          console.log('✅ Sesión válida al inicio');
        }
      });
    }
  }

  // =====================================================
  // 🔄 ESCUCHAR CAMBIOS ENTRE PESTAÑAS
  // =====================================================
  private setupStorageListener(): void {
    fromEvent<StorageEvent>(window, 'storage').subscribe((event: StorageEvent) => {
      if (event.key === 'authToken' && event.storageArea === sessionStorage) {
        if (!event.newValue) {
          console.log('🔒 Sesión cerrada');
          this.isAuthenticatedSubject.next(false);
        }
      }
    });
  }

  // =====================================================
  // 🔑 OBTENER TOKEN - usando sessionStorage
  // =====================================================
  getToken(): string | null {
    return sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
  }

  // =====================================================
  // 👤 OBTENER ID DEL USUARIO - usando sessionStorage
  // =====================================================
  getUserId(): string | null {
    const userId = sessionStorage.getItem('userId');
    if (userId) return userId;
    
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id?.toString();
      } catch {
        return null;
      }
    }
    return null;
  }

  // =====================================================
  // 🎭 OBTENER ROL DEL USUARIO - usando sessionStorage
  // =====================================================
  getUserRole(): string | null {
    // 🔴 PRIORIDAD: obtener directamente de userRole
    const userRole = sessionStorage.getItem('userRole');
    if (userRole) {
      console.log('📝 Rol obtenido de sessionStorage.userRole:', userRole);
      return userRole;
    }
    
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('📝 Rol obtenido de userData:', user.rol);
        return user.rol;
      } catch {
        return null;
      }
    }
    return null;
  }

  // =====================================================
  // ✅ VERIFICAR SI ESTÁ AUTENTICADO
  // =====================================================
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  // =====================================================
  // 🎯 VERIFICAR SI TIENE ALGUNO DE LOS ROLES PERMITIDOS
  // =====================================================
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    
    console.log('🎭 Verificando rol - Usuario:', userRole);
    console.log('🎭 Roles permitidos:', roles);
    
    if (!userRole) {
      console.log('❌ Usuario sin rol asignado');
      return false;
    }
    
    const normalizedUserRole = userRole.toLowerCase();
    const normalizedRoles = roles.map(r => r.toLowerCase());
    const hasRole = normalizedRoles.includes(normalizedUserRole);
    
    if (!hasRole) {
      console.log(`❌ Rol ${userRole} no permitido. Roles permitidos: ${roles.join(', ')}`);
    } else {
      console.log(`✅ Rol ${userRole} autorizado`);
    }
    
    return hasRole;
  }

  // =====================================================
  // 🎯 VERIFICAR SI TIENE UN ROL ESPECÍFICO
  // =====================================================
  hasRole(role: string): boolean {
    return this.hasAnyRole([role]);
  }

  // =====================================================
  // 📊 OBTENER DATOS COMPLETOS DEL USUARIO
  // =====================================================
  getUserData(): any {
    try {
      const userData = sessionStorage.getItem('userData');
      if (userData) {
        return JSON.parse(userData);
      }
      
      return {
        id: this.getUserId(),
        rol: this.getUserRole(),
        nombre: sessionStorage.getItem('userNombre') || 'Usuario',
        email: sessionStorage.getItem('userEmail')
      };
    } catch {
      return null;
    }
  }

  // =====================================================
  // 🔄 ACTUALIZAR DATOS DEL USUARIO EN sessionStorage
  // =====================================================
  updateUserData(userData: any): void {
    try {
      if (userData) {
        console.log('🔄 Actualizando userData:', userData);
        
        // Actualizar datos completos
        const currentData = this.getUserData() || {};
        const mergedData = { ...currentData, ...userData };
        sessionStorage.setItem('userData', JSON.stringify(mergedData));
        
        // Actualizar campos individuales
        if (userData.id) sessionStorage.setItem('userId', userData.id.toString());
        if (userData.rol) sessionStorage.setItem('userRole', userData.rol);
        if (userData.nombre) sessionStorage.setItem('userNombre', userData.nombre);
        if (userData.email) sessionStorage.setItem('userEmail', userData.email);
        
        console.log('✅ Datos de usuario actualizados en sessionStorage');
        console.log('📝 Nuevo rol guardado:', userData.rol);
      }
    } catch (error) {
      console.error('Error actualizando userData:', error);
    }
  }

  // =====================================================
  // 🚪 CERRAR SESIÓN - limpiando sessionStorage
  // =====================================================
  logout(): void {
    console.log('🚪 Cerrando sesión...');
    
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userNombre');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userData');
    
    this.isAuthenticatedSubject.next(false);
    
    console.log('✅ Sesión cerrada correctamente');
  }

  // =====================================================
  // 🔍 VERIFICAR ESTADO DE AUTENTICACIÓN (OBSERVABLE)
  // =====================================================
  getAuthStatus(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  // =====================================================
  // 🔄 REFRESCAR ESTADO DE AUTENTICACIÓN
  // =====================================================
  private checkAuthStatus(): void {
    const token = this.getToken();
    const isAuth = !!token;
    this.isAuthenticatedSubject.next(isAuth);
    
    console.log(`🔐 Estado de autenticación local: ${isAuth ? 'Autenticado' : 'No autenticado'}`);
  }
}