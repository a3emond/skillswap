import { User } from './user.model'
import { Job } from './job.model'

export type ProposalStatus = 'pending' | 'accepted' | 'rejected'

export type Proposal = {
  id: number
  job_id: number
  user_id?: number | string
  freelancer_id?: number | string
  price: number
  cover_letter?: string
  message?: string
  status: ProposalStatus
  freelancer?: User
  job?: Partial<Job> | null
  created_at?: string
  updated_at?: string
}