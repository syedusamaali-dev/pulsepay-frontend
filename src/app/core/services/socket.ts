import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface PaymentNotification {
  referenceId: string;
  amount: number;
  currency: string;
  senderName: string;
  newBalance: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private paymentReceivedSubject = new Subject<PaymentNotification>();

  connect(userId: string): void {
    if (this.socket && this.socket.connected) {
      // If already connected, make sure room is joined
      this.socket.emit('join_user_room', userId);
      return;
    }

    this.socket = io(environment.socketUrl, {
      transports: ['polling', 'websocket'], // Polling fallback ensures Back4App proxy passes traffic smoothly
      withCredentials: true,
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Connected to Socket server:', this.socket.id);
      // Re-join user room on fresh connect or auto-reconnect
      this.socket.emit('join_user_room', userId);
    });

    this.socket.on('payment_received', (data: PaymentNotification) => {
      this.paymentReceivedSubject.next(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket Connection Error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  onPaymentReceived(): Observable<PaymentNotification> {
    return this.paymentReceivedSubject.asObservable();
  }
}