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
    if (this.socket && this.socket.connected) return;

    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      // Join targeted user socket room for real-time payments
      this.socket.emit('join_user_room', userId);
    });

    this.socket.on('payment_received', (data: PaymentNotification) => {
      this.paymentReceivedSubject.next(data);
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