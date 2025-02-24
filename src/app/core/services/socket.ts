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
  private activeUserId: string | null = null; // Store user ID for auto-reconnects

  connect(userId: string): void {
    this.activeUserId = userId;

    if (this.socket && this.socket.connected) {
      // Re-join user room if socket is already active
      this.socket.emit('join_user_room', userId);
      return;
    }

    // Attach auth token if available in local storage
    const token = localStorage.getItem('token') || '';

    this.socket = io(environment.socketUrl, {
      transports: ['websocket', 'polling'], // Prioritize websocket for Back4App
      withCredentials: true,
      autoConnect: true,
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      console.log('⚡ PulsePay Socket Connected:', this.socket.id);
      
      // Auto join room using stored activeUserId
      if (this.activeUserId) {
        this.socket.emit('join_user_room', this.activeUserId);
      }
    });

    this.socket.on('payment_received', (data: PaymentNotification) => {
      console.log('💵 PulsePay Payment Received:', data);
      this.paymentReceivedSubject.next(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ PulsePay Socket Connection Error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ PulsePay Socket Disconnected:', reason);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.activeUserId = null;
    }
  }

  onPaymentReceived(): Observable<PaymentNotification> {
    return this.paymentReceivedSubject.asObservable();
  }
}