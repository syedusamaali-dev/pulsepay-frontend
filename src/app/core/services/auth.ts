import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  fullName: string;
  email: string;
  accountNumber: string;
  balance: number;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  
  // Signal for reactive UI updates across components
  currentUser = signal<User | null>(this.getUserFromStorage());

  constructor(private http: HttpClient) {}

  register(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap((res) => {
        if (res.success && res.token) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.success && res.token) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('pulsepay_token');
    localStorage.removeItem('pulsepay_user');
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('pulsepay_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  updateBalance(newBalance: number): void {
    const user = this.currentUser();
    if (user) {
      const updatedUser = { ...user, balance: newBalance };
      localStorage.setItem('pulsepay_user', JSON.stringify(updatedUser));
      this.currentUser.set(updatedUser);
    }
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem('pulsepay_token', token);
    localStorage.setItem('pulsepay_user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('pulsepay_user');
    return userJson ? JSON.parse(userJson) : null;
  }
}