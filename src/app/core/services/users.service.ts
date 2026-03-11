import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

import { ApiClient } from '../http/api-client'
import { User } from '../models/user.model'

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly api: ApiClient) {}

  getMe(): Observable<User> {
    return this.api.get<User>('/users/me')
  }

  getByUsername(username: string): Observable<User> {
    return this.api.get<User>(`/users/${encodeURIComponent(username)}`)
  }
}