import { Injectable, signal } from '@angular/core'
import { JobsService } from '../services/jobs.service'
import { ProposalsService } from '../services/proposals.service'

@Injectable({ providedIn: 'root' })
export class NavbarStore {

  readonly myJobsCount = signal(0)
  readonly myBidsCount = signal(0)

  constructor(
    private readonly jobsService: JobsService,
    private readonly proposalsService: ProposalsService
  ) {}

  refresh() {
    this.jobsService.getMyPostings().subscribe({
      next: response => {
        const jobs = response ?? []
        const openJobs = jobs.filter(job => job.status === 'open')
        this.myJobsCount.set(openJobs.length)
      },
      error: () => {
        this.myJobsCount.set(0)
      }
    })

    this.proposalsService.getMyBids().subscribe({
      next: response => {
        const proposals = response ?? []
        const pendingBids = proposals.filter(proposal => proposal.status === 'pending')
        this.myBidsCount.set(pendingBids.length)
      },
      error: () => {
        this.myBidsCount.set(0)
      }
    })
  }

  reset() {
    this.myJobsCount.set(0)
    this.myBidsCount.set(0)
  }

}