import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

import { ApiClient } from '../http/api-client'
import { RegisterDto } from '../models/dto/register.dto'
import { LoginDto } from '../models/dto/login.dto'
import { RegisterResponseDto } from '../models/dto/register-response.dto'
import { LoginResponseDto } from '../models/dto/login-response.dto'

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly api: ApiClient) {}

  register(dto: RegisterDto): Observable<RegisterResponseDto> {
    return this.api.post<RegisterResponseDto>('/auth/register', dto)
  }

  login(dto: LoginDto): Observable<LoginResponseDto> {
    return this.api.post<LoginResponseDto>('/auth/login', dto)
  }
}