import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

import { ApiClient } from '../http/api-client'
import { Review } from '../models/review.model'
import { ReviewCreateDto } from '../models/dto/review-create.dto'
import { ReviewsListDto } from '../models/dto/reviews-list.dto'

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  constructor(private readonly api: ApiClient) {}

  create(jobId: number | string, dto: ReviewCreateDto): Observable<Review> {
    return this.api.post<Review>(`/jobs/${jobId}/reviews`, dto)
  }

  getForUser(userId: number): Observable<ReviewsListDto> {
    return this.api.get<ReviewsListDto>(`/reviews/user/${userId}`)
  }
}