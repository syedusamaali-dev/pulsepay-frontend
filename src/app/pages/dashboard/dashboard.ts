import { Component, OnInit, OnDestroy, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../core/services/auth';
import { TransferService, TransferPayload } from '../../core/services/transfer';
import { SocketService, PaymentNotification } from '../../core/services/socket';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser!: Signal<User | null>; // or Signal/WritableSignal type
  transactions = signal<any[]>([]);
  
  // Transfer Form State
  recipientAccountNumber = '';
  amount: number | null = null;
  description = '';
  pin = '';
  
  // UI Control Signals
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showPinField = signal<boolean>(false);
  liveToast = signal<PaymentNotification | null>(null);

  private socketSub!: Subscription;

  constructor(
    private authService: AuthService,
    private transferService: TransferService,
    private socketService: SocketService,
    private router: Router
  ) {
 this.currentUser = this.authService.currentUser;

  }

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      // Connect to real-time WebSockets
      this.socketService.connect(user.id);
      
      // Listen for incoming payments
      this.socketSub = this.socketService.onPaymentReceived().subscribe((notification) => {
        this.liveToast.set(notification);
        this.authService.updateBalance(notification.newBalance);
        this.loadTransactionHistory();
        
        // Auto-dismiss toast after 6 seconds
        setTimeout(() => this.liveToast.set(null), 6000);
      });
    }

    this.loadTransactionHistory();
  }

  ngOnDestroy(): void {
    if (this.socketSub) this.socketSub.unsubscribe();
    this.socketService.disconnect();
  }

  loadTransactionHistory(): void {
    this.transferService.getHistory().subscribe({
      next: (res) => {
        if (res.success) {
          this.transactions.set(res.data);
        }
      },
      error: (err) => console.error('Failed to load transaction history', err)
    });
  }

  checkFraudShieldTrigger(): void {
    if (this.amount && this.amount >= 5000) {
      this.showPinField.set(true);
    } else {
      this.showPinField.set(false);
      this.pin = '';
    }
  }

  executeTransfer(): void {
    if (!this.recipientAccountNumber || !this.amount || this.amount <= 0) {
      this.errorMessage.set('Please enter a valid recipient account number and amount.');
      return;
    }

    if (this.amount >= 5000 && !this.pin) {
      this.errorMessage.set('Transfers of $5,000+ require a Security PIN.');
      this.showPinField.set(true);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: TransferPayload = {
      recipientAccountNumber: this.recipientAccountNumber,
      amount: this.amount,
      description: this.description,
      ...(this.pin && { pin: this.pin })
    };

    this.transferService.executeTransfer(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.successMessage.set(`Successfully sent $${res.data.amount}! Ref: ${res.data.referenceId}`);
          this.authService.updateBalance(res.data.newBalance);
          this.resetForm();
          this.loadTransactionHistory();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errObj = err.error;
        if (errObj && errObj.error?.includes('FRAUD_TRIGGER')) {
          this.showPinField.set(true);
        }
        this.errorMessage.set(errObj?.error || 'Transfer failed. Please check your inputs.');
      }
    });
  }

  resetForm(): void {
    this.recipientAccountNumber = '';
    this.amount = null;
    this.description = '';
    this.pin = '';
    this.showPinField.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}