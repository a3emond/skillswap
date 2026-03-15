import { User } from './user.model'

export type Review = {
  id: number | string
  job_id: number | string
  reviewer_id: number | string
  target_id: number | string
  rating: number
  message?: string
  comment?: string
  reviewer?: User
  target?: User
  created_at?: string
}