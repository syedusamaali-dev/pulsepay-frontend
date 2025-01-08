import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
  if (!this.email || !this.password) {
    this.errorMessage.set('Please enter both email and password.');
    return;
  }

  this.isLoading.set(true);
  this.errorMessage.set(null);

  this.authService.login({ email: this.email, password: this.password }).subscribe({
    next: () => {
      this.isLoading.set(false);
      
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/dashboard']);
      }
    },
    error: (err) => {
      this.isLoading.set(false);
      this.errorMessage.set(err.error?.message || err.error?.error || 'Invalid credentials.');
    }
  });
}
}