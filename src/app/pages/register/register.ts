import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  pin = '';
  initialDeposit: number | string = 1000; // Can hold user input string before cast

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onRegister(): void {
    if (!this.fullName || !this.email || !this.password || !this.pin) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Cast initialDeposit to ensure it's a number
    const payload = {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      pin: this.pin,
      initialDeposit: Number(this.initialDeposit) || 1000
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Registration failed. Please check inputs.');
      }
    });
  }
}