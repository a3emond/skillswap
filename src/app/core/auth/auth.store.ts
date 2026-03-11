import { Injectable, computed, signal } from '@angular/core'
import { User } from '../models/user.model'

const TOKEN_KEY = 'skillswap_token'
const USER_KEY = 'skillswap_user'

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY)) // signal used for navbar reactive UI
  private readonly userSignal = signal<User | null>(this.readStoredUser())

  readonly token = computed(() => this.tokenSignal())
  readonly user = computed(() => this.userSignal())
  readonly authenticated = computed(() => !!this.tokenSignal())

  setSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    this.tokenSignal.set(token)
    this.userSignal.set(user)
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    this.tokenSignal.set(null)
    this.userSignal.set(null)
  }

  getToken(): string | null {
    return this.tokenSignal()
  }

  getUser(): User | null {
    return this.userSignal()
  }

  isAuthenticated(): boolean {
    return !!this.tokenSignal()
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY)

    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as User
    } catch {
      localStorage.removeItem(USER_KEY)
      return null
    }
  }
}