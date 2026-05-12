import { HttpClient } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'auth_token';
  private readonly USER_STORAGE_KEY = 'current_user';

  // Mock user database - username and email can be used interchangeably
  private readonly mockUsers = [
    {
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin',
      role: 'admin' as const,
    },
    {
      username: 'user',
      email: 'user@example.com',
      password: 'user',
      role: 'user' as const,
    },
  ];

  private currentUserSubject = new BehaviorSubject<User | null>(
    this.loadUserFromStorage(),
  );
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.hasValidToken(),
  );
  public isAuthenticated$: Observable<boolean> =
    this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
  constructor(private http: HttpClient) {
    // Restore user session if token exists
    if (this.hasValidToken()) {
      const storedUser = this.loadUserFromStorage();
      if (storedUser) {
        this.currentUserSubject.next(storedUser);
        this.isAuthenticatedSubject.next(true);
      }
    }
  }

  /**
   * Login user with username/email and password
   * Accepts either username or email for credentials
   */
  login(credential: string, password: string) {
    return this.http.post('http://localhost:3000/auth/login', {
      credential,
      password,
    });
  }

  getFeedback(payload: any) {
    return this.http.post('http://127.0.0.1:8000/feedback', payload);
  }

  /**
   * Logout current user and clear storage
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USER_STORAGE_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Check if user has valid token (basic check - no expiry logic yet)
   */
  hasValidToken(): boolean {
    const token = localStorage.getItem(this.STORAGE_KEY);
    return token !== null && token.length > 0;
  }

  /**
   * Get current user synchronously
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if current user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user !== null && user.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Generate mock JWT-like token
   * Format: mock_token_{base64_user_data}_{timestamp}
   */
  private generateMockToken(user: any): string {
    const timestamp = Date.now();
    const payload = `${user.username}:${user.role}`;
    const encoded = btoa(payload); // Simple base64 encoding (not secure, mock only)
    return `mock_token_${encoded}_${timestamp}`;
  }

  /**
   * Load user from localStorage
   */
  private loadUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_STORAGE_KEY);
    if (!userJson) {
      return null;
    }
    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  }
}
