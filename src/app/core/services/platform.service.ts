import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

import { ApiClient } from '../http/api-client'
import { PlatformStatsDto } from '../models/dto/platform-stats.dto'

@Injectable({ providedIn: 'root' })
export class PlatformService {
  constructor(private readonly api: ApiClient) {}

  getStats(): Observable<PlatformStatsDto> {
    return this.api.get<PlatformStatsDto>('/platform/stats')
  }
}