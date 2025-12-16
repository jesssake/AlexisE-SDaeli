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

interface CredencialPrueba {
  email: string;
  password: string;
  rol: string;
  nombre: string;
  admin_nombre?: string;
  tutor_nombre?: string;
  nino_nombre?: string;
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
  private readonly CREDENCIALES_PRUEBA: CredencialPrueba[] = [
    // Administrador
    { 
      email: 'admin@escuela.com', 
      password: 'Admin123', 
      rol: 'ADMIN', 
      nombre: 'Administrador Principal',
      admin_nombre: 'Administrador Principal'
    },
    
    // Super Admin
    { 
      email: 'superadmin@escuela.com', 
      password: 'Super123', 
      rol: 'SUPERADMIN', 
      nombre: 'Super Administrador',
      admin_nombre: 'Super Administrador'
    },
    
    // Usuario (Tutor)
    { 
      email: 'tutor@example.com', 
      password: 'Tutor123', 
      rol: 'TUTOR', 
      nombre: 'María Rodríguez',
      tutor_nombre: 'María Rodríguez',
      nino_nombre: 'Ana Rodríguez'
    },
    
    // Otro Usuario (Tutor)
    { 
      email: 'padre@familia.com', 
      password: 'Padre123', 
      rol: 'TUTOR', 
      nombre: 'Juan Pérez',
      tutor_nombre: 'Juan Pérez',
      nino_nombre: 'Carlos Pérez'
    }
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
    VALIDATING: '¡Verificando! ⏳',
    ADMIN_DETECTED: '¡Eres administrador! ⚙️',
    TUTOR_DETECTED: '¡Eres un tutor/padre! 👨‍👩‍👧‍👦'
  };

  ngOnInit(): void {
    // ✅ VERIFICAR PRIMERO si ya está autenticado
    if (this.authService.isAuthenticated()) {
      console.log('🔍 Usuario ya autenticado, verificando rol...');
      this.redirectToDashboard();
      return;
    }

    // ✅ Limpiar sesión previa solo si no está autenticado
    this.limpiarSesionCompleta();
    console.log('🧹 Sesión anterior limpiada para nuevo login.');

    this.inicializarComponente();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private limpiarSesionCompleta(): void {
    try {
      const claves = [
        'userData', 'authToken', 'token', 'userId', 'tutorId',
        'userEmail', 'correo', 'userNombre', 'userRole', 'userType',
        'ninoNombre', 'tutorTelefono', 'ninoCondiciones'
      ];
      
      claves.forEach(clave => localStorage.removeItem(clave));
    } catch (e) {
      console.warn('Error limpiando localStorage:', e);
    }
  }

  private inicializarComponente(): void {
    try {
      document.body.classList.add('login-page');
    } catch (error) {
      console.warn('No se pudo agregar clase al body:', error);
    }

    // Mostrar credenciales de prueba en consola para desarrollo
    this.mostrarCredencialesPrueba();

    this.mostrarMensajeBienvenida();
    this.enfocarCampoEmail();
  }

  private mostrarCredencialesPrueba(): void {
    console.log('🔐 CREDENCIALES DE PRUEBA DISPONIBLES:');
    console.log('=========================================');
    console.log('⚙️ ADMINISTRADORES:');
    console.log('📧 admin@escuela.com | 🔐 Admin123 | 🎯 ADMIN');
    console.log('📧 superadmin@escuela.com | 🔐 Super123 | 🎯 SUPERADMIN');
    console.log('');
    console.log('👨‍👩‍👧‍👦 TUTORES/PADRES:');
    console.log('📧 tutor@example.com | 🔐 Tutor123 | 🎯 TUTOR');
    console.log('📧 padre@familia.com | 🔐 Padre123 | 🎯 TUTOR');
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
      // Usar siempre el modo real (backend)
      const respuesta = await this.ejecutarLogin();
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

    // Validar respuesta exitosa
    const isSuccess = 
      respuesta?.success === true || 
      respuesta?.status === 'success' ||
      respuesta?.status === 200 ||
      (respuesta?.user !== undefined && respuesta?.user !== null);

    const userData = respuesta?.user || respuesta?.data || respuesta;
    const token = respuesta?.token || respuesta?.access_token || respuesta?.jwt;

    console.log('✅ Validación de respuesta:', {
      isSuccess,
      hasUser: !!userData,
      hasToken: !!token
    });

    if (!isSuccess || !userData) {
      const errorMsg = respuesta?.message || 'Credenciales incorrectas o servidor no disponible';
      console.warn('❌ Login fallido:', errorMsg);
      throw new Error(errorMsg);
    }

    // Normalizar usuario según estructura de tu backend
    const usuarioNormalizado = this.normalizarUsuario(userData);
    
    // Completar datos faltantes si es necesario
    const usuarioCompleto = this.completarDatosFaltantes(usuarioNormalizado);
    
    // Depurar información
    this.debugUserDetection(usuarioCompleto);
    
    await this.manejarLoginExitoso(usuarioCompleto, token);
  }

  private normalizarUsuario(user: any): any {
    console.log('🔍 Normalizando usuario recibido:', user);
    
    // Obtener rol del backend (ya viene normalizado)
    const rol = (user.rol || 'TUTOR').toUpperCase().trim();
    
    // Determinar tipo de usuario basado en propiedades
    let tipoUsuario = 'TUTOR';
    let nombre = user.nombre || '';
    let email = user.email || this.model.email;
    let nino_nombre = user.nino_nombre || '';
    let tutor_telefono = user.tutor_telefono || '';
    let nino_condiciones = user.nino_condiciones || '';
    
    // Si tiene propiedades de administrador
    if (user.admin_nombre || rol.includes('ADMIN') || user.isAdmin) {
      tipoUsuario = 'ADMINISTRADOR';
      nombre = user.admin_nombre || user.nombre || 'Administrador';
      email = user.admin_email || user.email || this.model.email;
    }
    // Si tiene propiedades de tutor
    else if (user.tutor_nombre || rol.includes('TUTOR') || rol.includes('PADRE')) {
      tipoUsuario = 'TUTOR';
      nombre = user.tutor_nombre || user.nombre || 'Tutor';
      email = user.tutor_email || user.email || this.model.email;
      nino_nombre = user.nino_nombre || '';
      tutor_telefono = user.tutor_telefono || '';
      nino_condiciones = user.nino_condiciones || '';
    }
    
    // Construir objeto normalizado con TODAS las propiedades importantes
    const usuarioNormalizado = {
      id: user.id || 0,
      nombre: nombre,
      email: email,
      rol: rol,
      tipo: tipoUsuario,
      nino_nombre: nino_nombre,
      tutor_telefono: tutor_telefono,
      nino_condiciones: nino_condiciones,
      // Preservar todas las propiedades originales
      ...user
    };
    
    console.log('✅ Usuario normalizado:', usuarioNormalizado);
    return usuarioNormalizado;
  }

  private completarDatosFaltantes(user: any): any {
    console.log('🔧 Completando datos faltantes para el usuario...');
    
    const usuarioCompleto = { ...user };
    
    // Si el email es de usuarios conocidos, completar datos
    switch (usuarioCompleto.email) {
      case 'juan.perez1@example.com':
        if (!usuarioCompleto.id) usuarioCompleto.id = 8;
        if (!usuarioCompleto.nombre) usuarioCompleto.nombre = 'Juan Pérez';
        if (!usuarioCompleto.nino_nombre) usuarioCompleto.nino_nombre = 'Luis Pérez';
        if (!usuarioCompleto.tutor_telefono) usuarioCompleto.tutor_telefono = '(555) 1234-5678';
        usuarioCompleto.rol = 'tutor';
        usuarioCompleto.tipo = 'TUTOR';
        console.log('📋 Datos completados para Juan Pérez');
        break;
        
      case 'ana.garcia@example.com':
        if (!usuarioCompleto.id) usuarioCompleto.id = 9;
        if (!usuarioCompleto.nombre) usuarioCompleto.nombre = 'Ana García';
        if (!usuarioCompleto.nino_nombre) usuarioCompleto.nino_nombre = 'Carla Pérez';
        if (!usuarioCompleto.tutor_telefono) usuarioCompleto.tutor_telefono = '(555) 9876-5432';
        usuarioCompleto.rol = 'tutor';
        usuarioCompleto.tipo = 'TUTOR';
        console.log('📋 Datos completados para Ana García');
        break;
        
      case 'carlos.lopez@example.com':
        if (!usuarioCompleto.id) usuarioCompleto.id = 10;
        if (!usuarioCompleto.nombre) usuarioCompleto.nombre = 'Carlos López';
        if (!usuarioCompleto.nino_nombre) usuarioCompleto.nino_nombre = 'Pedro Gómez';
        if (!usuarioCompleto.tutor_telefono) usuarioCompleto.tutor_telefono = '(555) 1122-3344';
        if (!usuarioCompleto.nino_condiciones) usuarioCompleto.nino_condiciones = 'Alergia a la penicilina';
        usuarioCompleto.rol = 'tutor';
        usuarioCompleto.tipo = 'TUTOR';
        console.log('📋 Datos completados para Carlos López');
        break;
        
      default:
        // Si no hay ID, generar uno temporal
        if (!usuarioCompleto.id) {
          usuarioCompleto.id = Math.floor(Math.random() * 100) + 100;
          console.log('🔢 ID temporal generado:', usuarioCompleto.id);
        }
    }
    
    return usuarioCompleto;
  }

  private debugUserDetection(user: any): void {
    console.group('🔎 DEBUG: Detección de Usuario');
    console.log('📧 Email del formulario:', this.model.email);
    console.log('👤 Usuario completo:', user);
    console.log('🎭 Rol:', user.rol);
    console.log('🏷️ Tipo:', user.tipo);
    console.log('🆔 ID:', user.id);
    console.log('👶 Niño:', user.nino_nombre);
    console.log('📋 Propiedades disponibles:', Object.keys(user));
    console.groupEnd();
  }

  private getUserType(user: any): string {
    return user.tipo || 'TUTOR';
  }

  private async manejarLoginExitoso(user: any, token?: string): Promise<void> {
    console.log('🎉 Login exitoso - Usuario:', user);
    console.log('🔍 Rol:', user.rol);
    console.log('📧 Email:', user.email);
    console.log('🆔 ID:', user.id);
    
    // Mostrar mensaje según el tipo de usuario
    const mensajeUsuario = this.obtenerMensajeUsuario(user.rol, user.tipo);
    this.showMonkeyMessage(mensajeUsuario);
    this.transitionMessage = `Redirigiendo a ${user.tipo}...`;

    // Guardar sesión con datos normalizados
    this.guardarSesion(user, token);
    
    // Verificar que los datos se guardaron correctamente
    this.verificarDatosGuardados();

    await this.delay(1500);
    
    // Animación de salida
    const container = document.querySelector('.login-container');
    container?.classList.add('fade-out');
    
    await this.delay(600);

    // Redirigir según rol y tipo
    await this.redirigirSegunRol(user);
  }

  private guardarSesion(user: any, token?: string): void {
    try {
      console.log('💾 GUARDANDO SESIÓN COMPLETA...');
      
      // 1. Guardar datos completos del usuario
      const userData = {
        ...user,
        correo: user.email || user.correo || this.model.email
      };
      
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // 2. GUARDAR TODAS LAS CLAVES NECESARIAS PARA COMPATIBILIDAD
      // Tokens
      if (token) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('token', token);
      } else {
        const fakeToken = `fake-token-${Date.now()}-${user.id}`;
        localStorage.setItem('authToken', fakeToken);
        localStorage.setItem('token', fakeToken);
      }
      
      // IDs (IMPORTANTE: Estos deben ser números válidos)
      const userId = user.id ? parseInt(user.id) : 0;
      localStorage.setItem('userId', userId.toString());
      localStorage.setItem('tutorId', userId.toString()); // Para tutores
      
      // Información personal
      localStorage.setItem('userEmail', user.email || user.correo || this.model.email);
      localStorage.setItem('correo', user.email || user.correo || this.model.email);
      localStorage.setItem('userNombre', user.nombre || user.tutor_nombre || user.admin_nombre || 'Usuario');
      
      // Rol y tipo
      localStorage.setItem('userRole', user.rol || 'tutor');
      localStorage.setItem('userType', user.tipo || 'TUTOR');
      
      // Información del niño (si es tutor)
      localStorage.setItem('ninoNombre', user.nino_nombre || '');
      
      // Otras propiedades importantes
      if (user.tutor_telefono) {
        localStorage.setItem('tutorTelefono', user.tutor_telefono);
      }
      if (user.nino_condiciones) {
        localStorage.setItem('ninoCondiciones', user.nino_condiciones);
      }
      
      console.log('✅ SESIÓN GUARDADA EXITOSAMENTE');
      
    } catch (error) {
      console.error('❌ Error guardando sesión:', error);
      throw error;
    }
  }

  private verificarDatosGuardados(): void {
    console.log('🔍 VERIFICACIÓN DE DATOS GUARDADOS EN LOCALSTORAGE:');
    console.log('===================================================');
    const claves = [
      'authToken', 'token', 'userId', 'tutorId', 
      'userEmail', 'correo', 'userNombre', 
      'userRole', 'userType', 'ninoNombre'
    ];
    
    claves.forEach(clave => {
      const valor = localStorage.getItem(clave);
      console.log(`- ${clave}:`, valor || '❌ No encontrado');
    });
    console.log('===================================================');
  }

  private obtenerMensajeUsuario(rol: string, tipo: string): string {
    if (tipo === 'ADMINISTRADOR' || rol.includes('ADMIN')) {
      return this.MONKEY_MESSAGES.ADMIN_DETECTED;
    } else {
      return this.MONKEY_MESSAGES.TUTOR_DETECTED;
    }
  }

  private async redirigirSegunRol(user: any): Promise<void> {
    const rol = (user.rol || '').toUpperCase();
    const tipo = (user.tipo || '').toUpperCase();
    
    console.log('🎯 INICIANDO REDIRECCIÓN:', { rol, tipo });
    console.log('👤 Información completa del usuario:', user);
    
    // ✅ CORRECCIÓN DEFINITIVA: Mapeo basado en tu estructura de rutas
    let destino: string;
    
    if (tipo === 'ADMINISTRADOR' || rol.includes('ADMIN')) {
      // Administradores van a /maestro
      destino = '/maestro';
      console.log('📍 ADMINISTRADOR → /maestro');
    } else {
      // Tutores/Padres van a /estudiante
      destino = '/estudiante';
      console.log('📍 TUTOR → /estudiante');
    }

    console.log('🔍 Ruta final:', destino);

    try {
      // Aplicar clase CSS según tipo de usuario
      this.aplicarClaseUsuario(user);
      
      // Redirigir con reemplazo de URL
      const navigationResult = await this.router.navigateByUrl(destino, { 
        replaceUrl: true 
      });
      
      if (navigationResult) {
        console.log('✅ Redirección exitosa a:', destino);
      } else {
        console.warn('⚠️ Redirección fallida, la ruta podría no existir:', destino);
        // Intentar ruta alternativa
        if (destino === '/maestro') {
          await this.router.navigate(['/maestro/dashboard'], { replaceUrl: true });
        } else {
          await this.router.navigate(['/estudiante/dashboard'], { replaceUrl: true });
        }
      }
      
    } catch (error) {
      console.error('❌ Error crítico en redirección:', error);
      // Redirección de emergencia
      await this.router.navigate(['/auth/login'], { replaceUrl: true });
    }
  }

  private aplicarClaseUsuario(user: any): void {
    try {
      // Remover todas las clases anteriores
      const clasesUsuario = ['estudiante-page', 'maestro-page', 'admin-page', 'tutor-page'];
      document.body.classList.remove(...clasesUsuario);
      
      // Añadir clase según tipo
      const tipo = this.getUserType(user);
      if (tipo === 'ADMINISTRADOR') {
        document.body.classList.add('maestro-page');
        console.log('🎨 Clase CSS: maestro-page');
      } else {
        document.body.classList.add('estudiante-page');
        console.log('🎨 Clase CSS: estudiante-page');
      }
      
    } catch (error) {
      console.warn('⚠️ No se pudo aplicar clase CSS:', error);
    }
  }

  private redirectToDashboard(): void {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        console.log('🔄 Usuario ya autenticado, redirigiendo...', user);
        
        // Asegurar compatibilidad
        if (user.email && !localStorage.getItem('correo')) {
          localStorage.setItem('correo', user.email);
        }
        
        this.redirigirSegunRol(user);
      } catch (error) {
        console.error('❌ Error parseando userData:', error);
        this.limpiarYSalir();
      }
    } else {
      this.limpiarYSalir();
    }
  }

  private limpiarYSalir(): void {
    try {
      this.limpiarSesionCompleta();
    } catch (e) {
      console.warn('Error limpiando almacenamiento:', e);
    }
    this.router.navigate(['/auth/login']);
  }

  private manejarErrorLogin(error: any): void {
    console.error('❌ Error en login:', error);
    
    let mensajeUsuario = 'Error de conexión con el servidor.';
    let mensajeMono = this.MONKEY_MESSAGES.CONNECTION_ERROR;

    if (error.message?.includes('Credenciales incorrectas')) {
      mensajeUsuario = 'Credenciales incorrectas. Verifica tu email y contraseña.';
      mensajeMono = this.MONKEY_MESSAGES.ERROR;
    } else if (error.message?.includes('conectar') || error.status === 0) {
      mensajeUsuario = 'No se puede conectar al servidor. Verifica que esté ejecutándose.';
      mensajeMono = '¡Servidor no disponible! 🌐❌';
    } else if (error.status === 404) {
      mensajeUsuario = 'Endpoint no encontrado. Verifica la configuración del servidor.';
      mensajeMono = '¡Ruta no encontrada! 🗺️❌';
    } else if (error.status === 500) {
      mensajeUsuario = 'Error interno del servidor. Intenta más tarde.';
      mensajeMono = '¡Error del servidor! ⚠️';
    } else if (error.status === 401) {
      mensajeUsuario = 'No autorizado. Verifica tus credenciales.';
      mensajeMono = this.MONKEY_MESSAGES.ERROR;
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
          id: Math.floor(Math.random() * 1000) + 1,
          nombre: credencial.nombre,
          email: credencial.email,
          rol: credencial.rol,
          tipo: credencial.rol.includes('ADMIN') ? 'ADMINISTRADOR' : 'TUTOR',
          // Propiedades específicas
          ...(credencial.rol.includes('ADMIN') ? {
            admin_nombre: credencial.admin_nombre
          } : {
            tutor_nombre: credencial.tutor_nombre,
            nino_nombre: credencial.nino_nombre
          })
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

  // ==================== MÉTODOS DE UTILIDAD ====================

  private limpiarSesion(): void {
    try {
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      localStorage.removeItem('correo');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userType');
      console.log('🧹 Sesión limpiada manualmente');
    } catch (error) {
      console.warn('Error limpiando sesión:', error);
    }
  }
}