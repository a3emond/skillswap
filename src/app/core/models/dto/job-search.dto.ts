import { JobStatus } from '../job.model'

export type JobSearchDto = {
  category?: string
  status?: JobStatus
  min_budget?: number
}