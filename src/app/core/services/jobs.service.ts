import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

import { ApiClient } from '../http/api-client'
import { Job } from '../models/job.model'
import { JobSearchDto } from '../models/dto/job-search.dto'
import { JobCreateDto } from '../models/dto/job-create.dto'
import { JobUpdateDto } from '../models/dto/job-update.dto'
import { JobsListDto } from '../models/dto/jobs-list.dto'

@Injectable({ providedIn: 'root' })
export class JobsService {
  constructor(private readonly api: ApiClient) {}

  search(dto: JobSearchDto): Observable<JobsListDto> {
    return this.api.post<JobsListDto>('/jobs/search', dto)
  }

  create(dto: JobCreateDto): Observable<Job> {
    return this.api.post<Job>('/jobs', dto)
  }

  getById(jobId: number): Observable<Job> {
    return this.api.get<Job>(`/jobs/${jobId}`)
  }

  update(jobId: number, dto: JobUpdateDto): Observable<Job> {
    return this.api.patch<Job>(`/jobs/${jobId}`, dto)
  }

  getMyPostings(): Observable<JobsListDto> {
    return this.api.get<JobsListDto>('/jobs/my-postings')
  }

  complete(jobId: number): Observable<Job> {
    return this.api.patch<Job>(`/jobs/${jobId}/complete`, {})
  }
}