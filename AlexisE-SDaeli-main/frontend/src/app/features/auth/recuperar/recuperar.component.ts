import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { LoggingService } from '../../../services/logging.service';

interface Pregunta {
  id: number;
  pregunta: string;
}

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="recuperar-container">
      <div class="card">
        <h2>🔐 Recuperar Contraseña</h2>
        
        <!-- PASO 1: Ingresar email -->
        <div *ngIf="paso === 1" class="paso">
          <p>Ingresa tu correo electrónico</p>
          <div class="form-group">
            <label>Correo electrónico:</label>
            <input type="email" [(ngModel)]="email" placeholder="tu@email.com" [disabled]="cargando">
          </div>
          <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
          <button (click)="iniciarRecuperacion()" [disabled]="cargando">
            {{ cargando ? 'Buscando...' : 'Continuar' }}
          </button>
          <a routerLink="/login" class="link">← Volver al login</a>
        </div>
        
        <!-- PASO 2: Preguntas de seguridad -->
        <div *ngIf="paso === 2" class="paso">
          <p>Responde las siguientes preguntas de seguridad</p>
          <div class="info-usuario">
            <span class="icon">👤</span>
            <span>{{ nombreUsuario }}</span>
          </div>
          
          <div *ngFor="let p of preguntasSeleccionadas; let i = index" class="form-group">
            <label>{{ p.pregunta }}</label>
            <input type="text" [(ngModel)]="respuestas[i].respuesta" placeholder="Tu respuesta" [disabled]="cargando">
          </div>
          
          <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
          <button (click)="verificarRespuestas()" [disabled]="cargando">
            {{ cargando ? 'Verificando...' : 'Verificar respuestas' }}
          </button>
          <a (click)="volverAlEmail()" class="link">← Volver a ingresar email</a>
        </div>
        
        <!-- PASO 3: Nueva contraseña -->
        <div *ngIf="paso === 3" class="paso">
          <p>Ingresa tu nueva contraseña</p>
          <div class="form-group">
            <label>Nueva contraseña:</label>
            <input type="password" [(ngModel)]="nuevaPassword" placeholder="Mínimo 6 caracteres" [disabled]="cargando">
          </div>
          <div class="form-group">
            <label>Confirmar contraseña:</label>
            <input type="password" [(ngModel)]="confirmarPassword" placeholder="Repite la contraseña" [disabled]="cargando">
          </div>
          <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
          <div class="success-msg" *ngIf="successMsg">{{ successMsg }}</div>
          <button (click)="restablecerPassword()" [disabled]="cargando">
            {{ cargando ? 'Guardando...' : 'Restablecer contraseña' }}
          </button>
          <a routerLink="/login" class="link">← Volver al login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recuperar-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
      padding: 20px;
    }
    .card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 20px;
      padding: 40px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    h2 {
      color: white;
      text-align: center;
      margin-bottom: 30px;
      font-size: 1.8rem;
    }
    .paso p {
      color: #aaa;
      text-align: center;
      margin-bottom: 25px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      color: #888;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }
    input {
      width: 100%;
      padding: 12px 15px;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 10px;
      color: white;
      font-size: 1rem;
    }
    input:focus {
      outline: none;
      border-color: #3498db;
    }
    button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #3498db, #2ecc71);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 10px;
    }
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(52,152,219,0.3);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .error-msg {
      color: #e74c3c;
      margin-top: 10px;
      text-align: center;
      font-size: 0.9rem;
    }
    .success-msg {
      color: #2ecc71;
      margin-top: 10px;
      text-align: center;
      font-size: 0.9rem;
    }
    .link {
      display: block;
      text-align: center;
      margin-top: 20px;
      color: #3498db;
      text-decoration: none;
      cursor: pointer;
    }
    .link:hover {
      text-decoration: underline;
    }
    .info-usuario {
      background: #2a2a2a;
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 20px;
      text-align: center;
      color: white;
    }
    .info-usuario .icon {
      margin-right: 8px;
    }
  `]
})
export class RecuperarComponent implements OnInit {
  paso = 1;
  email = '';
  nombreUsuario = '';
  usuarioId: number | null = null;
  preguntas: Pregunta[] = [];
  preguntasSeleccionadas: Pregunta[] = [];
  respuestas: { id: number, respuesta: string }[] = [];
  token = '';
  nuevaPassword = '';
  confirmarPassword = '';
  cargando = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  , private logger: LoggingService) {}

  ngOnInit(): void {
    // Verificar si hay token en la URL (recuperación por email)
    this.route.params.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
        this.verificarToken();
      }
    });
  }

  iniciarRecuperacion() {
    if (!this.email) {
      this.errorMsg = 'Ingresa tu correo electrónico';
      return;
    }

    this.cargando = true;
    this.errorMsg = '';

    this.http.post('http://localhost:3000/api/recuperar/iniciar', { email: this.email })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.usuarioId = res.usuario_id;
            this.nombreUsuario = res.nombre;
            this.preguntas = res.preguntas;
            
            // Seleccionar 3 preguntas aleatorias
            this.seleccionarPreguntasAleatorias();
            
            this.paso = 2;
          } else {
            this.errorMsg = res.message;
          }
          this.cargando = false;
        },
        error: (err) => {
          this.errorMsg = err.error?.message || 'Error al buscar el usuario';
          this.cargando = false;
        }
      });
  }

  seleccionarPreguntasAleatorias() {
    // Seleccionar 3 preguntas aleatorias
    const preguntasShuffle = [...this.preguntas];
    for (let i = preguntasShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [preguntasShuffle[i], preguntasShuffle[j]] = [preguntasShuffle[j], preguntasShuffle[i]];
    }
    this.preguntasSeleccionadas = preguntasShuffle.slice(0, 3);
    
    // Inicializar respuestas
    this.respuestas = this.preguntasSeleccionadas.map(p => ({ id: p.id, respuesta: '' }));
  }

  verificarRespuestas() {
    // Verificar que todas las respuestas estén completas
    const respuestasIncompletas = this.respuestas.filter(r => !r.respuesta.trim());
    if (respuestasIncompletas.length > 0) {
      this.errorMsg = 'Por favor, responde todas las preguntas';
      return;
    }

    this.cargando = true;
    this.errorMsg = '';

    this.http.post('http://localhost:3000/api/recuperar/verificar-respuestas', {
      usuario_id: this.usuarioId,
      respuestas: this.respuestas
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.token = res.token;
          this.paso = 3;
        } else {
          this.errorMsg = res.message;
        }
        this.cargando = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al verificar respuestas';
        this.cargando = false;
      }
    });
  }

  verificarToken() {
    this.cargando = true;
    this.http.get(`http://localhost:3000/api/recuperar/verificar-token/${this.token}`)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.usuarioId = res.usuario_id;
            this.nombreUsuario = res.nombre;
            this.paso = 3;
          } else {
            this.errorMsg = res.message || 'Token inválido';
          }
          this.cargando = false;
        },
        error: (err) => {
          this.errorMsg = 'Token inválido o expirado';
          this.cargando = false;
        }
      });
  }

  restablecerPassword() {
    if (!this.nuevaPassword || !this.confirmarPassword) {
      this.errorMsg = 'Completa todos los campos';
      return;
    }
    if (this.nuevaPassword.length < 6) {
      this.errorMsg = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.errorMsg = 'Las contraseñas no coinciden';
      return;
    }

    this.cargando = true;
    this.errorMsg = '';
    this.successMsg = '';

    this.http.post(`http://localhost:3000/api/recuperar/restablecer/${this.token}`, {
      password: this.nuevaPassword,
      confirmPassword: this.confirmarPassword
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.successMsg = res.message;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMsg = res.message;
        }
        this.cargando = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al restablecer la contraseña';
        this.cargando = false;
      }
    });
  }

  volverAlEmail() {
    this.paso = 1;
    this.email = '';
    this.errorMsg = '';
    this.respuestas = [];
  }
}