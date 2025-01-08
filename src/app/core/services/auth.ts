import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  fullName: string;
  email: string;
  accountNumber?: string;
  balance?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
    account: {
      _id: string;
      userId: string;
      accountNumber: string;
      currency: string;
      balance: number;
      status: string;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Signal for reactive user state management across Angular components
  currentUser = signal<User | null>(this.getUserFromStorage());

  constructor(private http: HttpClient) {}

  /**
   * Register a new user account
   */
  register(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap((res) => {
        if (res.success && res.data?.token) {
          const userPayload: User = {
            ...res.data.user,
            accountNumber: res.data.account?.accountNumber,
            balance: res.data.account?.balance,
          };
          this.setSession(res.data.token, userPayload);
        }
      })
    );
  }

  /**
   * Login user with email & password
   */
  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.success && res.data?.token) {
          const userPayload: User = {
            ...res.data.user,
            accountNumber: res.data.account?.accountNumber,
            balance: res.data.account?.balance,
          };
          this.setSession(res.data.token, userPayload);
        }
      })
    );
  }

  /**
   * Update user balance in real-time (called when a transfer occurs or socket payment arrives)
   */
  updateBalance(newBalance: number): void {
    const user = this.currentUser();
    if (user) {
      const updatedUser: User = { ...user, balance: newBalance };
      localStorage.setItem('pulsepay_user', JSON.stringify(updatedUser));
      this.currentUser.set(updatedUser);
    }
  }

  /**
   * Clear session on logout
   */
  logout(): void {
    localStorage.removeItem('pulsepay_token');
    localStorage.removeItem('pulsepay_user');
    this.currentUser.set(null);
  }

  /**
   * Retrieve JWT token from Local Storage
   */
  getToken(): string | null {
    return localStorage.getItem('pulsepay_token');
  }

  /**
   * Check if user session exists
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
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