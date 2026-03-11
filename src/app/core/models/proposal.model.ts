import { User } from './user.model'

export type ProposalStatus = 'pending' | 'accepted' | 'rejected'

export type Proposal = {
  id: number
  job_id: number
  user_id?: number
  freelancer_id?: number
  price: number
  cover_letter?: string
  message?: string
  status: ProposalStatus
  freelancer?: User
  created_at?: string
  updated_at?: string
}