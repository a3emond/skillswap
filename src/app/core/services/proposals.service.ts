import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

import { ApiClient } from '../http/api-client'
import { Proposal } from '../models/proposal.model'
import { ProposalCreateDto } from '../models/dto/proposal-create.dto'
import { ProposalsListDto } from '../models/dto/proposals-list.dto'

@Injectable({ providedIn: 'root' })
export class ProposalsService {
  constructor(private readonly api: ApiClient) {}

  create(jobId: number, dto: ProposalCreateDto): Observable<Proposal> {
    return this.api.post<Proposal>(`/jobs/${jobId}/proposals`, dto)
  }

  getForJob(jobId: number): Observable<ProposalsListDto> {
    return this.api.get<ProposalsListDto>(`/jobs/${jobId}/proposals`)
  }

  accept(proposalId: number): Observable<Proposal> {
    return this.api.patch<Proposal>(`/proposals/${proposalId}/accept`, {})
  }

  getMyBids(): Observable<ProposalsListDto> {
    return this.api.get<ProposalsListDto>('/proposals/my-bids')
  }

  delete(proposalId: number): Observable<void> {
    return this.api.delete<void>(`/proposals/${proposalId}`)
  }
}