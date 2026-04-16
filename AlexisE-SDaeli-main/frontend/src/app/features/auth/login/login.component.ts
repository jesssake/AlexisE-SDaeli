﻿// C:\Codigos\HTml\AlexisE-SDaeli-main\AlexisE-SDaeli-main\frontend\src\app\features\auth\login\login.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoginAuthService } from '../../../services/loginauth.service';
import { LoggingService } from '../../../services/logging.service';

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
  nino_id?: number;
  id?: number;
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
  private logger = inject(LoggingService);
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

  // Credenciales de prueba
  private readonly CREDENCIALES_PRUEBA: CredencialPrueba[] = [
    // Administrador
    { 
      email: 'admin@escuela.com', 
      password: 'Admin123', 
      rol: 'ADMIN', 
      nombre: 'Administrador Principal',
      admin_nombre: 'Administrador Principal',
      id: 1
    },
    
    // Super Admin
    { 
      email: 'superadmin@escuela.com', 
      password: 'Super123', 
      rol: 'SUPERADMIN', 
      nombre: 'Super Administrador',
      admin_nombre: 'Super Administrador',
      id: 1
    },
    
    // Tutor de Ana Rodríguez
    { 
      email: 'tutor@example.com', 
      password: 'Tutor123', 
      rol: 'TUTOR', 
      nombre: 'María Rodríguez',
      tutor_nombre: 'María Rodríguez',
      nino_nombre: 'Ana Rodríguez',
      nino_id: 2,
      id: 3
    },
    
    // Tutor de Carlos Pérez
    { 
      email: 'padre@familia.com', 
      password: 'Padre123', 
      rol: 'TUTOR', 
      nombre: 'Juan Pérez',
      tutor_nombre: 'Juan Pérez',
      nino_nombre: 'Carlos Pérez',
      nino_id: 3,
      id: 4
    },
    
    // ✅ NUEVO: Maestro Juan Pérez
    {
      email: 'juan.perez@escuela.edu',
      password: '2025Eliana_Obil',
      rol: 'MAESTRO',
      nombre: 'Juan Pérez',
      admin_nombre: 'Juan Pérez',
      id: 1
    },
    
    // ✅ NUEVO: Tutor real Alexis
    {
      email: 'biospacensap2025@gmail.com',
      password: '2025ELIANAdavid-j',
      rol: 'TUTOR',
      nombre: 'Alexis David Obil Colli',
      tutor_nombre: 'Alexis David Obil Colli',
      nino_nombre: 'Darli obil sima',
      nino_id: 3,
      id: 3
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
    RECOVERY: 'Redirigiendo a recuperación de contraseña... 🔐',
    REGISTER: '¡Nos vemos en el registro! 🐵➡️',
    VALIDATING: '¡Verificando! ⏳',
    ADMIN_DETECTED: '¡Eres administrador! ⚙️',
    TUTOR_DETECTED: '¡Eres un tutor/padre! 👨‍👩‍👧‍👦',
    MAESTRO_DETECTED: '¡Bienvenido Maestro! 👨‍🏫'
  };

  ngOnInit(): void {
    // Verificar si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.logger.log('🔍 Usuario ya autenticado, verificando rol...');
      this.redirectToDashboard();
      return;
    }

    // Limpiar sesión previa
    this.limpiarSesionCompleta();
    this.logger.log('🧹 Sesión anterior limpiada para nuevo login.');

    this.inicializarComponente();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ✅ CORREGIDO: Usar sessionStorage
  private limpiarSesionCompleta(): void {
    try {
      const claves = [
        'userData', 'authToken', 'token', 'userId', 'tutorId',
        'userEmail', 'correo', 'userNombre', 'userRole', 'userType',
        'ninoNombre', 'tutorTelefono', 'ninoCondiciones', 'esMaestro'
      ];
      
      claves.forEach(clave => sessionStorage.removeItem(clave));
    } catch (e) {
      this.logger.warn('Error limpiando sessionStorage:', e);
    }
  }

  private inicializarComponente(): void {
    try {
      document.body.classList.add('login-page');
    } catch (error) {
      this.logger.warn('No se pudo agregar clase al body:', error);
    }

    // Mostrar credenciales de prueba en consola
    this.mostrarCredencialesPrueba();

    this.mostrarMensajeBienvenida();
    this.enfocarCampoEmail();
  }

  private mostrarCredencialesPrueba(): void {
    this.logger.log('🔐 CREDENCIALES DE PRUEBA DISPONIBLES:');
    this.logger.log('=========================================');
    this.logger.log('⚙️ ADMINISTRADORES:');
    this.logger.log('📧 admin@escuela.com | 🔐 Admin123 | 🎯 ADMIN');
    this.logger.log('📧 superadmin@escuela.com | 🔐 Super123 | 🎯 SUPERADMIN');
    this.logger.log('');
    this.logger.log('👨‍🏫 MAESTROS:');
    this.logger.log('📧 juan.perez@escuela.edu | 🔐 2025Eliana_Obil | 🎯 MAESTRO');
    this.logger.log('');
    this.logger.log('👨‍👩‍👧‍👦 TUTORES/PADRES:');
    this.logger.log('📧 tutor@example.com | 🔐 Tutor123 | 🎯 TUTOR → 👧 Ana Rodríguez (ID: 2)');
    this.logger.log('📧 padre@familia.com | 🔐 Padre123 | 🎯 TUTOR → 👦 Carlos Pérez (ID: 3)');
    this.logger.log('📧 biospacensap2025@gmail.com | 🔐 2025ELIANAdavid-j | 🎯 TUTOR → 👦 Darli obil sima (ID: 3)');
    this.logger.log('=========================================');
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
      this.logger.warn('Error limpiando clases del body:', error);
    }
  }

  // ==================== MÉTODO PRINCIPAL DE LOGIN ====================
  
  async submit(): Promise<void> {
    if (!this.validarFormulario()) return;

    this.iniciarLogin();
    
    try {
      this.logger.log('🎯 Usando LOGIN REAL - Conectando al backend');
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
    this.logger.log('➡️ Intentando login REAL con Node.js...');
    this.logger.log('📧 Email:', this.model.email);

    try {
      const respuesta = await firstValueFrom(
        this.authService.login(this.model.email.trim(), this.model.password)
          .pipe(takeUntil(this.destroy$))
      );

      this.logger.log('📥 Respuesta COMPLETA del servidor:', respuesta);
      return respuesta;
    } catch (error: any) {
      this.logger.error('🚨 Error en ejecutarLogin:', error);
      throw error;
    }
  }

  // ==================== NORMALIZACIÓN DE USUARIO ====================
  
  private normalizarUsuario(user: any): any {
    this.logger.log('🔍 Normalizando usuario recibido:', user);
    
    // Detectar si es maestro por el email o rol
    const esMaestro = user.rol === 'MAESTRO' || 
                      user.rol === 'maestro' || 
                      user.email?.includes('@escuela') || 
                      user.email?.includes('@edu');
    
    const usuarioNormalizado = {
      id: user.id || 0,
      userId: esMaestro ? user.id : (user.rol === 'TUTOR' ? (user.nino_id || user.id) : user.id),
      nombre: user.nombre || user.admin_nombre || user.tutor_nombre || 'Usuario',
      email: user.email || this.model.email,
      rol: esMaestro ? 'MAESTRO' : (user.rol || 'TUTOR'),
      tipo: esMaestro ? 'MAESTRO' : (user.tipo || (user.rol?.includes('ADMIN') ? 'ADMINISTRADOR' : 'TUTOR')),
      nino_id: user.nino_id || null,
      nino_nombre: user.nino_nombre || '',
      tutor_telefono: user.tutor_telefono || '',
      nino_condiciones: user.nino_condiciones || '',
      esMaestro: esMaestro,
      ...user
    };
    
    this.logger.log('✅ Usuario normalizado:', usuarioNormalizado);
    return usuarioNormalizado;
  }

  private async procesarRespuestaLogin(respuesta: any): Promise<void> {
    this.logger.log('🔍 Procesando respuesta:', respuesta);

    const isSuccess = respuesta?.success === true;
    const userData = respuesta;
    const token = respuesta?.token;

    this.logger.log('✅ Validación de respuesta:', {
      isSuccess,
      hasUser: !!userData,
      hasToken: !!token
    });

    if (!isSuccess || !userData) {
      const errorMsg = respuesta?.message || 'Credenciales incorrectas';
      this.logger.warn('❌ Login fallido:', errorMsg);
      throw new Error(errorMsg);
    }

    // Normalizar usuario
    const usuarioNormalizado = this.normalizarUsuario(userData);
    
    // Depurar información
    this.debugUserDetection(usuarioNormalizado);
    
    await this.manejarLoginExitoso(usuarioNormalizado, token);
  }

  private debugUserDetection(user: any): void {
    this.logger.group('🔎 DEBUG: Detección de Usuario');
    this.logger.log('📧 Email:', this.model.email);
    this.logger.log('👤 Usuario:', user);
    this.logger.log('🎭 Rol:', user.rol);
    this.logger.log('🏷️ Tipo:', user.tipo);
    this.logger.log('🆔 ID Usuario:', user.id);
    this.logger.log('👶 ID Niño:', user.nino_id);
    this.logger.log('👶 Nombre Niño:', user.nino_nombre);
    this.logger.log('👨‍🏫 Es Maestro:', user.esMaestro);
    this.logger.groupEnd();
  }

  // ==================== GUARDADO DE SESIÓN (CORREGIDO) ====================
  
  private guardarSesion(user: any, token?: string): void {
    try {
      this.logger.log('💾 GUARDANDO SESIÓN COMPLETA...');
      
      // Guardar datos completos del usuario
      const userData = {
        ...user,
        correo: user.email || this.model.email
      };
      
      sessionStorage.setItem('userData', JSON.stringify(userData));
      
      // Guardar token
      if (token) {
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('token', token);
      } else {
        const fakeToken = `fake-token-${Date.now()}-${user.id}`;
        sessionStorage.setItem('authToken', fakeToken);
        sessionStorage.setItem('token', fakeToken);
      }
      
      // ✅ DECISIÓN CRÍTICA: ¿Qué ID guardamos?
      let userIdToSave: number;
      
      // Detectar si es maestro
      if (user.esMaestro || user.rol === 'MAESTRO' || user.tipo === 'MAESTRO') {
        userIdToSave = user.id ? parseInt(user.id) : 1;
        this.logger.log(`👨‍🏫 MAESTRO: Usando ID: ${userIdToSave} (${user.nombre})`);
        
        // Guardar indicador de maestro
        sessionStorage.setItem('esMaestro', 'true');
        sessionStorage.setItem('userRole', 'maestro');
        sessionStorage.setItem('userType', 'MAESTRO');
        
      } else if (user.rol === 'TUTOR') {
        // Para TUTOR, guardamos el ID del NIÑO (estudiante)
        userIdToSave = user.nino_id ? parseInt(user.nino_id) : 
                      (user.id ? parseInt(user.id) : 3);
        this.logger.log(`👨‍👩‍👧 TUTOR: Usando ID del NIÑO: ${userIdToSave} (${user.nino_nombre || 'desconocido'})`);
        
        sessionStorage.setItem('userRole', 'tutor');
        sessionStorage.setItem('userType', 'TUTOR');
        
      } else {
        // Para ADMIN, guardamos su propio ID
        userIdToSave = user.id ? parseInt(user.id) : 1;
        this.logger.log(`👨‍💼 ADMIN: Usando ID del ADMIN: ${userIdToSave}`);
        
        sessionStorage.setItem('userRole', user.rol || 'admin');
        sessionStorage.setItem('userType', user.tipo || 'ADMINISTRADOR');
      }
      
      // Guardar IDs
      sessionStorage.setItem('userId', userIdToSave.toString());
      sessionStorage.setItem('tutorId', (user.id || userIdToSave).toString());
      
      // Información personal
      sessionStorage.setItem('userEmail', user.email || this.model.email);
      sessionStorage.setItem('correo', user.email || this.model.email);
      sessionStorage.setItem('userNombre', user.nombre || 'Usuario');
      
      // Información del niño (si es tutor)
      if (user.nino_nombre) {
        sessionStorage.setItem('ninoNombre', user.nino_nombre);
      }
      
      // ✅ CORREGIDO: Quitados puntos y coma dentro de los logs
      this.logger.log('🔍 IDs guardados en sessionStorage:');
      this.logger.log('  - userId:', sessionStorage.getItem('userId'));
      this.logger.log('  - tutorId:', sessionStorage.getItem('tutorId'));
      this.logger.log('  - userRole:', sessionStorage.getItem('userRole'));
      this.logger.log('  - userType:', sessionStorage.getItem('userType'));
      this.logger.log('  - ninoNombre:', sessionStorage.getItem('ninoNombre'));
      this.logger.log('  - esMaestro:', sessionStorage.getItem('esMaestro'));
      
      this.logger.log('✅ SESIÓN GUARDADA EXITOSAMENTE EN SESSIONSTORAGE');
      
    } catch (error) {
      this.logger.error('❌ Error guardando sesión:', error);
      throw error;
    }
  }

  // ✅ CORREGIDO: Quitados puntos y coma dentro de los logs
  private verificarDatosGuardados(): void {
    this.logger.log('🔍 VERIFICACIÓN DE DATOS GUARDADOS:');
    const claves = [
      'authToken', 'token', 'userId', 'tutorId', 
      'userEmail', 'correo', 'userNombre', 
      'userRole', 'userType', 'ninoNombre', 'esMaestro'
    ];
    
    claves.forEach(clave => {
      const valor = sessionStorage.getItem(clave);
      // ✅ CORREGIDO: Quitado punto y coma dentro del template string
      this.logger.log(`- ${clave}:`, valor ? '✅' : '❌', valor ? `(${valor})` : '');
    });
  }

  private async manejarLoginExitoso(user: any, token?: string): Promise<void> {
    this.logger.log('🎉 Login exitoso - Usuario:', user);
    
    // Mostrar mensaje según el tipo de usuario
    let mensajeUsuario = this.MONKEY_MESSAGES.SUCCESS;
    
    if (user.esMaestro || user.rol === 'MAESTRO') {
      mensajeUsuario = this.MONKEY_MESSAGES.MAESTRO_DETECTED;
      this.transitionMessage = `Bienvenido Maestro ${user.nombre}! 👨‍🏫`;
    } else if (user.tipo === 'ADMINISTRADOR' || user.rol?.includes('ADMIN')) {
      mensajeUsuario = this.MONKEY_MESSAGES.ADMIN_DETECTED;
      this.transitionMessage = `Bienvenido Administrador! ⚙️`;
    } else {
      mensajeUsuario = this.MONKEY_MESSAGES.TUTOR_DETECTED;
      this.transitionMessage = user.nino_nombre ? 
        `Bienvenido ${user.nino_nombre}! 🎉` : 
        `Bienvenido Tutor! 👨‍👩‍👧‍👦`;
    }
    
    this.showMonkeyMessage(mensajeUsuario);

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

  private obtenerMensajeUsuario(rol: string, tipo: string): string {
    if (tipo === 'MAESTRO' || rol === 'MAESTRO') {
      return this.MONKEY_MESSAGES.MAESTRO_DETECTED;
    } else if (tipo === 'ADMINISTRADOR' || rol.includes('ADMIN')) {
      return this.MONKEY_MESSAGES.ADMIN_DETECTED;
    } else {
      return this.MONKEY_MESSAGES.TUTOR_DETECTED;
    }
  }

  // ==================== REDIRECCIÓN MEJORADA ====================
  
  private async redirigirSegunRol(user: any): Promise<void> {
    const rol = (user.rol || '').toUpperCase();
    const tipo = (user.tipo || '').toUpperCase();
    const email = (user.email || '').toLowerCase();
    
    this.logger.log('🎯 INICIANDO REDIRECCIÓN:', { rol, tipo, email });
    
    let destino: string;
    
    // ✅ LÓGICA MEJORADA PARA MAESTROS
    if (user.esMaestro || 
        rol === 'MAESTRO' || 
        tipo === 'MAESTRO' ||
        email.includes('@escuela') || 
        email.includes('@gestion') ||
        email.includes('@edu') ||
        rol.includes('ADMIN') || 
        tipo === 'ADMINISTRADOR') {
      
      destino = '/maestro';
      this.logger.log('📍 MAESTRO/ADMIN → /maestro');
      
      // Asegurar que se guarde como maestro
      sessionStorage.setItem('userRole', 'maestro');
      sessionStorage.setItem('userType', 'MAESTRO');
      sessionStorage.setItem('esMaestro', 'true');
      
    } else {
      destino = '/estudiante';
      this.logger.log('📍 TUTOR/PADRE → /estudiante');
    }

    try {
      this.aplicarClaseUsuario(user);
      
      const navigationResult = await this.router.navigateByUrl(destino, { 
        replaceUrl: true 
      });
      
      if (navigationResult) {
        this.logger.log('✅ Redirección exitosa a:', destino);
      } else {
        this.logger.warn('⚠️ Redirección fallida, intentando ruta específica...');
        if (destino === '/maestro') {
          await this.router.navigate(['/maestro/dashboard'], { replaceUrl: true });
        } else {
          await this.router.navigate(['/estudiante/dashboard'], { replaceUrl: true });
        }
      }
      
    } catch (error) {
      this.logger.error('❌ Error en redirección:', error);
      await this.router.navigate(['/auth/login'], { replaceUrl: true });
    }
  }

  private aplicarClaseUsuario(user: any): void {
    try {
      const clasesUsuario = ['estudiante-page', 'maestro-page', 'admin-page', 'tutor-page'];
      document.body.classList.remove(...clasesUsuario);
      
      if (user.esMaestro || user.rol === 'MAESTRO' || user.tipo === 'MAESTRO') {
        document.body.classList.add('maestro-page');
        this.logger.log('🎨 Clase CSS: maestro-page');
      } else if (user.tipo === 'ADMINISTRADOR' || user.rol?.includes('ADMIN')) {
        document.body.classList.add('maestro-page');
        this.logger.log('🎨 Clase CSS: admin-page (maestro)');
      } else {
        document.body.classList.add('estudiante-page');
        this.logger.log('🎨 Clase CSS: estudiante-page');
      }
      
    } catch (error) {
      this.logger.warn('⚠️ No se pudo aplicar clase CSS:', error);
    }
  }

  private redirectToDashboard(): void {
    const userDataStr = sessionStorage.getItem('userData');
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        this.logger.log('🔄 Usuario ya autenticado, redirigiendo...', user);
        this.redirigirSegunRol(user);
      } catch (error) {
        this.logger.error('❌ Error parseando userData:', error);
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
      this.logger.warn('Error limpiando almacenamiento:', e);
    }
    this.router.navigate(['/auth/login']);
  }

  private manejarErrorLogin(error: any): void {
    this.logger.error('❌ Error en login:', error);
    
    let mensajeUsuario = 'Error de conexión con el servidor.';
    let mensajeMono = this.MONKEY_MESSAGES.CONNECTION_ERROR;

    if (error.message?.includes('Credenciales incorrectas')) {
      mensajeUsuario = 'Credenciales incorrectas. Verifica tu email y contraseña.';
      mensajeMono = this.MONKEY_MESSAGES.ERROR;
    }

    this.errors['general'] = mensajeUsuario;
    this.showMonkeyMessage(mensajeMono);
    
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
    
    // Redirigir a la página de recuperación
    setTimeout(() => {
      this.router.navigate(['/recuperar']);
    }, 500);
  }
}