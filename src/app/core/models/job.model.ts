import { User } from './user.model'

export type JobStatus = 'open' | 'in_progress' | 'completed'

export type Job = {
  id: number
  title: string
  description: string
  budget: number
  category: string
  status: JobStatus
  owner_id?: number
  freelancer_id?: number | null
  owner?: User
  freelancer?: User | null
  created_at?: string
  updated_at?: string
}