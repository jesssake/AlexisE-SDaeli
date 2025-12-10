﻿// C:\Codigos\HTml\gestion-educativa\frontend\src\app\features\auth\login\login.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoginAuthService } from '../../../services/loginauth.service';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(LoginAuthService);
  private destroy$ = new Subject<void>();

  // Modelo de datos
  model: LoginModel = { email: '', password: '' };

  // Estado del componente
  loading = false;
  showPass = false;
  showMonkey = true;
  showSpeech = false;
  monkeyMessage = '';
  monkeyEyes: string = '🙉';
  isTransitioning = false;
  transitionMessage = 'Cargando...';
  errors: Record<string, string> = {};

  // Credenciales de prueba para desarrollo
  private readonly CREDENCIALES_PRUEBA = [
    { email: 'admin@gestion.com', password: 'AdminPassword123', rol: 'SuperAdmin', nombre: 'Administrador Principal' },
    { email: 'juan.perez@example.com', password: 'ContraseñaSegura123', rol: 'TUTOR', nombre: 'Juan Pérez' },
    { email: 'maria.garcia@example.com', password: 'Password123', rol: 'TUTOR', nombre: 'María García' },
    { email: 'carlos.lopez@example.com', password: 'SecurePass456', rol: 'TUTOR', nombre: 'Carlos López' },
    { email: 'coordinador@escuela.com', password: 'Coord123', rol: 'Admin', nombre: 'Coordinador Académico' },
    { email: 'director@escuela.com', password: 'Director456', rol: 'SuperAdmin', nombre: 'Director General' }
  ];

  // Mensajes del mono
  private readonly MONKEY_MESSAGES = {
    WELCOME: '¡Hola! Soy tu amigo mono 🐵',
    EMAIL_FOCUS: '¿Tu correo? ¡Qué emocionante! 📧',
    PASSWORD_FOCUS: '¡Shhh! No miro, prometo 🤫',
    PASSWORD_VISIBLE: '¡Cuidado! Alguien podría estar mirando 👀',
    SUCCESS: '¡Éxito! Redirigiendo... 🎉',
    ERROR: '¡Ups! Credenciales incorrectas 😢',
    CONNECTION_ERROR: '¡No puedo conectarme! 😭',
    RECOVERY: '¡Función de recuperación próximamente! 🔧',
    REGISTER: '¡Nos vemos en el registro! 🐵➡️',
    VALIDATING: '¡Verificando! ⏳'
  };

  ngOnInit(): void {
    // ================= MODIFICACIÓN =================
    // Limpiar sesión previa guardada para evitar redirecciones automáticas
    try {
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      console.log('Local session cleared on login screen.');
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
    // =================================================

    this.inicializarComponente();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private inicializarComponente(): void {
    try {
      document.body.classList.add('login-page');
    } catch (error) {
      console.warn('No se pudo agregar clase al body:', error);
    }

    // Mostrar credenciales de prueba en consola para desarrollo
    this.mostrarCredencialesPrueba();

    // Redirigir si ya está autenticado (comportamiento normal está ahora desactivado
    // mientras forzamos limpieza en ngOnInit para evitar redirecciones fantasma)
    if (this.authService.isAuthenticated()) {
      this.redirectToDashboard();
      return;
    }

    this.mostrarMensajeBienvenida();
    this.enfocarCampoEmail();
  }

  private mostrarCredencialesPrueba(): void {
    console.log('🔐 CREDENCIALES DE PRUEBA DISPONIBLES:');
    console.log('=========================================');
    this.CREDENCIALES_PRUEBA.forEach(credencial => {
      console.log(`📧 ${credencial.email} | 🔐 ${credencial.password} | 👤 ${credencial.nombre} | 🎯 ${credencial.rol}`);
    });
    console.log('=========================================');
  }

  private mostrarMensajeBienvenida(): void {
    setTimeout(() => {
      this.showMonkeyMessage('¡Bienvenido! Usa las credenciales de la consola 🐵');
    }, 1000);
  }

  private enfocarCampoEmail(): void {
    setTimeout(() => {
      const emailInput = document.querySelector<HTMLInputElement>('#email');
      emailInput?.focus();
    }, 500);
  }

  private cleanup(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    try {
      document.body.classList.remove('login-page', 'dark', 'dark-mode');
    } catch (error) {
      console.warn('Error limpiando clases del body:', error);
    }
  }

  async submit(): Promise<void> {
    if (!this.validarFormulario()) return;

    this.iniciarLogin();
    
    try {
      // 🔄 ELIGE EL MODO AQUÍ:
      const respuesta = await this.ejecutarLogin(); // MODO REAL - Backend Node.js
      // const respuesta = await this.ejecutarLoginTesting(); // MODO TESTING - Sin backend
      
      await this.procesarRespuestaLogin(respuesta);
    } catch (error: any) {
      this.manejarErrorLogin(error);
    } finally {
      this.finalizarLogin();
    }
  }

  private validarFormulario(): boolean {
    this.errors = {};

    if (!this.model.email?.trim()) {
      this.errors['email'] = 'El email es requerido';
    } else if (!this.validarEmail(this.model.email)) {
      this.errors['email'] = 'Formato de email inválido';
    }

    if (!this.model.password) {
      this.errors['password'] = 'La contraseña es requerida';
    }

    if (Object.keys(this.errors).length > 0) {
      this.errors['general'] = 'Por favor corrige los errores del formulario';
    }

    return Object.keys(this.errors).length === 0;
  }

  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private iniciarLogin(): void {
    this.loading = true;
    this.isTransitioning = true;
    this.transitionMessage = 'Verificando credenciales... 🔐';
    this.showMonkeyMessage(this.MONKEY_MESSAGES.VALIDATING);
    this.monkeyEyes = '🙈';
  }

  private async ejecutarLogin(): Promise<any> {
    console.log('➡️ Intentando login REAL con Node.js...');
    console.log('📧 Email:', this.model.email);
    console.log('🔐 Password length:', this.model.password.length);

    try {
      const respuesta = await firstValueFrom(
        this.authService.login(this.model.email.trim(), this.model.password)
          .pipe(takeUntil(this.destroy$))
      );

      console.log('📥 Respuesta COMPLETA del servidor:', respuesta);
      return respuesta;
    } catch (error: any) {
      console.error('🚨 Error en ejecutarLogin:', error);
      throw error;
    }
  }

  private async procesarRespuestaLogin(respuesta: any): Promise<void> {
    console.log('🔍 Procesando respuesta del servidor:', respuesta);

    // Validar múltiples formatos de respuesta
    const isSuccess = 
      respuesta?.success === true || 
      respuesta?.status === 'success' ||
      (respuesta?.user !== undefined && respuesta?.user !== null) ||
      (respuesta?.data !== undefined && respuesta?.data !== null);

    const userData = respuesta?.user || respuesta?.data;
    const token = respuesta?.token || respuesta?.access_token;

    console.log('✅ Validación de respuesta:', {
      isSuccess,
      userData,
      token,
      hasUser: !!userData,
      hasToken: !!token
    });

    if (!isSuccess || !userData) {
      const errorMsg = respuesta?.message || 'Credenciales incorrectas o servidor no disponible';
      console.warn('❌ Login fallido - Detalles:', {
        respuesta,
        isSuccess,
        userData,
        errorMsg
      });
      throw new Error(errorMsg);
    }

    await this.manejarLoginExitoso(userData, token);
  }

  private async manejarLoginExitoso(user: any, token?: string): Promise<void> {
    console.log('🎉 Login exitoso - Usuario completo:', user);
    console.log('🔍 Rol detectado:', user.rol);
    console.log('📧 Email del usuario:', user.email);
    
    // Mostrar mensaje según el rol
    const mensajeRol = this.obtenerMensajeRol(user.rol);
    this.showMonkeyMessage(`¡${mensajeRol}! 🎉`);
    this.transitionMessage = `Redirigiendo a ${user.rol}...`;

    // Guardar sesión
    this.guardarSesion(user, token);

    await this.delay(1500);
    
    // Animación de salida
    const container = document.querySelector('.login-container');
    container?.classList.add('fade-out');
    
    await this.delay(600);

    // Redirigir según rol
    await this.redirigirSegunRol(user);
  }

  private obtenerMensajeRol(rol: string): string {
    const mensajes: { [key: string]: string } = {
      'SuperAdmin': 'Bienvenido Super Administrador',
      'Admin': 'Bienvenido Administrador',
      'TUTOR': 'Bienvenido Tutor',
      'PROFESOR': 'Bienvenido Profesor',
      'MAESTRO': 'Bienvenido Maestro',
      'COORDINADOR': 'Bienvenido Coordinador'
    };
    
    return mensajes[rol] || `Bienvenido ${rol}`;
  }

  private guardarSesion(user: any, token?: string): void {
    try {
      localStorage.setItem('userData', JSON.stringify(user));
      if (token) {
        localStorage.setItem('token', token);
      }
      console.log('💾 Sesión guardada - Rol:', user.rol);
      console.log('💾 Datos guardados en localStorage:', user);
    } catch (error) {
      console.error('❌ Error guardando sesión:', error);
    }
  }

  private async redirigirSegunRol(user: any): Promise<void> {
    const rol = (user.rol || '').toUpperCase();
    console.log('🎯 INICIANDO REDIRECCIÓN - Rol:', rol);
    
    // ✅ RUTAS CORREGIDAS - Todos los admin/maestros van al dashboard maestro
    const rutas: { [key: string]: string } = {
      'SUPERADMIN': '/maestro/dashboard',        // ✅ CAMBIADO: de /admin/dashboard a /maestro/dashboard
      'ADMIN': '/maestro/dashboard',             // ✅ CAMBIADO: de /admin/dashboard a /maestro/dashboard
      'MAESTRO': '/maestro/dashboard',
      'PROFESOR': '/maestro/dashboard',
      'COORDINADOR': '/maestro/dashboard',
      'TEACHER': '/maestro/dashboard',
      'TUTOR': '/estudiante/configuracion',
      'PADRE': '/estudiante/configuracion',
      'ESTUDIANTE': '/estudiante/dashboard',
      'STUDENT': '/estudiante/dashboard',
      'ALUMNO': '/estudiante/dashboard'
    };

    const destino = rutas[rol] || '/estudiante/dashboard';

    console.log('📍 REDIRIGIENDO A:', destino);
    console.log('🔍 Ruta completa:', destino);
    console.log('👤 Usuario que redirige:', user);

    try {
      await this.router.navigateByUrl(destino, { replaceUrl: true });
      console.log('✅ Redirección exitosa a:', destino);
    } catch (error) {
      console.error('❌ Error en redirección:', error);
      // Si falla la redirección, ir a una ruta por defecto
      await this.router.navigateByUrl('/maestro/dashboard', { replaceUrl: true });
    }
  }

  private redirectToDashboard(): void {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('🔄 Usuario ya autenticado, redirigiendo...', user);
        this.redirigirSegunRol(user);
      } catch (error) {
        console.error('❌ Error parseando userData:', error);
        this.router.navigateByUrl('/auth/login');
      }
    }
  }

  private manejarErrorLogin(error: any): void {
    console.error('❌ Error completo en login:', error);
    
    let mensajeUsuario = 'Error de conexión con el servidor.';
    let mensajeMono = this.MONKEY_MESSAGES.CONNECTION_ERROR;

    if (error.message?.includes('Credenciales incorrectas')) {
      mensajeUsuario = 'Credenciales incorrectas. Verifica tu email y contraseña.';
      mensajeMono = this.MONKEY_MESSAGES.ERROR;
    } else if (error.message?.includes('conectar') || error.status === 0) {
      mensajeUsuario = 'No se puede conectar al servidor Node.js. Verifica que esté ejecutándose.';
      mensajeMono = '¡Node.js no disponible! 🌐❌';
    } else if (error.status === 404) {
      mensajeUsuario = 'Endpoint no encontrado. Verifica la ruta /api/login.';
      mensajeMono = '¡Ruta no encontrada! 🗺️❌';
    } else if (error.status === 500) {
      mensajeUsuario = 'Error interno del servidor Node.js. Intenta más tarde.';
      mensajeMono = '¡Error del servidor! ⚠️';
    }

    this.errors['general'] = mensajeUsuario;
    this.showMonkeyMessage(mensajeMono);
    
    // Reset monkey eyes
    this.monkeyEyes = '😢';
    setTimeout(() => {
      this.monkeyEyes = this.model.password.length > 0 ? '🙊' : '🙈';
    }, 2000);
  }

  private finalizarLogin(): void {
    this.loading = false;
    this.isTransitioning = false;
  }

  // ==================== MÉTODOS DEL MONO ====================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onEmailFocus(): void {
    this.monkeyEyes = '🙉';
    this.showMonkeyMessage(this.MONKEY_MESSAGES.EMAIL_FOCUS);
  }

  onEmailBlur(): void {
    this.hideMonkeyMessage();
    if (this.model.email && !this.validarEmail(this.model.email)) {
      this.errors['email'] = 'Formato de email inválido';
    }
  }

  onPasswordFocus(): void {
    this.monkeyEyes = '🙈';
    this.showMonkeyMessage(this.MONKEY_MESSAGES.PASSWORD_FOCUS);
  }

  onPasswordBlur(): void {
    this.monkeyEyes = this.model.password.length > 0 ? '🙊' : '🙉';
    this.hideMonkeyMessage();
  }

  onPasswordInput(): void {
    this.monkeyEyes = this.model.password.length > 0 ? '🙊' : '🙈';
    // Limpiar error de password al escribir
    if (this.errors['password'] && this.model.password.length >= 1) {
      delete this.errors['password'];
      if (Object.keys(this.errors).length === 0) {
        delete this.errors['general'];
      }
    }
  }

  showMonkeyMessage(message: string): void {
    this.monkeyMessage = message;
    this.showSpeech = true;
    setTimeout(() => this.hideMonkeyMessage(), 3000);
  }

  hideMonkeyMessage(): void {
    this.showSpeech = false;
  }

  togglePasswordVisibility(): void {
    this.showPass = !this.showPass;

    if (this.showPass) {
      this.showMonkeyMessage(this.MONKEY_MESSAGES.PASSWORD_VISIBLE);
      this.monkeyEyes = '🙉';
      setTimeout(() => {
        if (this.showPass) {
          this.monkeyEyes = this.model.password.length > 0 ? '🙊' : '🙈';
        }
      }, 2000);
    } else {
      this.monkeyEyes = this.model.password.length > 0 ? '🙊' : '🙈';
    }
  }

  // ==================== MÉTODO TESTING (OPCIONAL) ====================

  private async ejecutarLoginTesting(): Promise<any> {
    console.log('🔄 Usando MODO TESTING - Login temporal (sin backend)');
    console.log('📧 Email:', this.model.email);
    
    // Simular delay de red
    await this.delay(1500);

    // Buscar en credenciales de prueba
    const credencial = this.CREDENCIALES_PRUEBA.find(
      c => c.email === this.model.email && c.password === this.model.password
    );

    if (credencial) {
      return {
        success: true,
        user: {
          id: 1,
          nombre: credencial.nombre,
          email: credencial.email,
          rol: credencial.rol
        },
        token: 'test-token-' + Date.now(),
        message: 'Login exitoso (modo testing)'
      };
    } else {
      throw new Error('Credenciales incorrectas. Usa las credenciales mostradas en la consola.');
    }
  }

  // ==================== NAVEGACIÓN ====================

  async goToRegister(): Promise<void> {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.transitionMessage = 'Preparando registro... 🎉';

    this.showMonkeyMessage(this.MONKEY_MESSAGES.REGISTER);
    this.monkeyEyes = '🙈';

    await this.delay(800);
    
    const container = document.querySelector('.login-container');
    container?.classList.add('fade-out');

    await this.delay(500);
    this.router.navigate(['/auth/registro']);
  }

  openRecovery(event: Event): void {
    event.preventDefault();
    this.showMonkeyMessage(this.MONKEY_MESSAGES.RECOVERY);
  }
}
