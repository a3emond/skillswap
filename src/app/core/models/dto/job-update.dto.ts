import { JobStatus } from '../job.model'

export type JobUpdateDto = {
  title?: string
  description?: string
  budget?: number
  category?: string
  status?: JobStatus
}