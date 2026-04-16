import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

export interface ChatMessage {
  id?: number;
  conversacion_id?: number | null;
  remitente_id: number;
  destinatario_id: number;
  mensaje: string;
  fecha?: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket!: Socket;
  private connected = false;

  /**
   * Conecta al servidor de sockets y se une a la sala privada del usuario.
   * @param userId   ID del usuario logueado (maestro/tutor)
   * @param url      URL del backend con Socket.io (por defecto )
   */
  connect(userId: number, url: string = ''): void {
    if (this.connected) return;

    this.socket = io(url, { transports: ['websocket'] });

    this.socket.on('connect', () => {
      this.connected = true;
      // unir a sala privada user_{id}
      this.socket.emit('joinChat', userId);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });
  }

  /**
   * Observable para recibir mensajes en tiempo real desde el backend.
   */
  onReceiveMessage<T = ChatMessage>(): Observable<T> {
    const sub = new Subject<T>();
    this.socket.on('receiveMessage', (data: T) => sub.next(data));
    return sub.asObservable();
  }

  /**
   * (Opcional) Emitir por socket un mensaje saliente.
   * Nota: si además haces POST /api/chat/enviar, el backend emitirá al destinatario.
   */
  sendMessage(payload: ChatMessage): void {
    this.socket.emit('sendMessage', payload);
  }

  /**
   * Desconecta el socket (opcional).
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }
}
