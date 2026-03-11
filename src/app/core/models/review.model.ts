import { User } from './user.model'

export type Review = {
  id: number
  job_id: number
  reviewer_id: number
  target_id: number
  rating: number
  message?: string
  reviewer?: User
  target?: User
  created_at?: string
}