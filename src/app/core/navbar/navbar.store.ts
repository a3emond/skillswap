import { Injectable, inject, signal } from '@angular/core'

import { JobsService } from '../services/jobs.service'
import { ProposalsService } from '../services/proposals.service'

@Injectable({ providedIn: 'root' })
export class NavbarStore {

  private jobsService = inject(JobsService)
  private proposalsService = inject(ProposalsService)

  readonly myJobsCount = signal(0)
  readonly myBidsCount = signal(0)

  refresh() {

    this.jobsService.getMyPostings().subscribe({
      next: jobs => {
        const openJobs = jobs.filter(job => job.status === 'open')
        this.myJobsCount.set(openJobs.length)
      },
      error: () => this.myJobsCount.set(0)
    })

    this.proposalsService.getMyBids().subscribe({
      next: proposals => {
        const pending = proposals.filter(p => p.status === 'pending')
        this.myBidsCount.set(pending.length)
      },
      error: () => this.myBidsCount.set(0)
    })

  }

  reset() {
    this.myJobsCount.set(0)
    this.myBidsCount.set(0)
  }

}