import { Component, Input, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';

import { ReviewsService } from '../../../core/services/reviews.service';
import { Job } from '../../../core/models/job.model';
import { Review } from '../../../core/models/review.model';
import { ApiError } from '../../../core/http/api-error.model';
import { DevLogger } from '../../../core/utils/dev-logger';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';

import { Spinner } from '../../../shared/components/spinner/spinner';
import { AlertError } from '../../../shared/components/alert-error/alert-error';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { RatingStars } from '../../../shared/components/rating-stars/rating-stars';

@Component({
  selector: 'app-job-reviews',
  standalone: true,
  imports: [TranslatePipe, DatePipe, Spinner, AlertError, EmptyState, RatingStars],
  templateUrl: './job-reviews.html',
  styleUrl: './job-reviews.scss',
})
export class JobReviews {
  private readonly reviewsService = inject(ReviewsService);
  private readonly i18n = inject(I18nService);

  private readonly currentJob = signal<Job | null>(null);
  private readonly lastLoadKey = signal('');

  @Input() showHeader = true;

  @Input({ required: true })
  set job(value: Job) {
    this.currentJob.set(value);

    const loadKey = [value.id, value.owner_id ?? 0, value.freelancer_id ?? 0].join(':');

    if (this.lastLoadKey() === loadKey) {
      return;
    }

    this.lastLoadKey.set(loadKey);
    this.loadReviews();
  }

  readonly currentJobValue = computed(() => this.currentJob());

  readonly loading = signal(true);
  readonly apiErrorMessage = signal('');
  readonly reviews = signal<Review[]>([]);

  readonly hasResults = computed(() => this.reviews().length > 0);

  loadReviews(): void {
    const job = this.currentJobValue();

    if (!job) {
      this.loading.set(false);
      this.reviews.set([]);
      return;
    }

    const userIds = [...new Set([job.owner_id, job.freelancer_id].filter((id): id is number => !!id))];

    if (userIds.length === 0) {
      this.loading.set(false);
      this.reviews.set([]);
      return;
    }

    DevLogger.group('[JobReviews] loadReviews');

    this.loading.set(true);
    this.apiErrorMessage.set('');

    const requests = userIds.map((userId) => this.reviewsService.getForUser(userId));

    forkJoin(requests.length > 0 ? requests : [of([])])
      .subscribe({
        next: (reviewLists) => {
          const matchingReviews = reviewLists
            .flat()
            .filter((review) => String(review.job_id) === String(job.id))
            .filter(
              (review, index, reviews) =>
                reviews.findIndex((candidate) => candidate.id === review.id) === index,
            )
            .sort((left, right) => {
              const leftDate = left.created_at ? Date.parse(left.created_at) : 0;
              const rightDate = right.created_at ? Date.parse(right.created_at) : 0;

              return rightDate - leftDate;
            });

          const hydrated = matchingReviews.map((review) => ({
            ...review,
            reviewer: review.reviewer ?? this.resolveUserFromJob(review.reviewer_id),
            target: review.target ?? this.resolveUserFromJob(review.target_id),
          }));

          this.reviews.set(hydrated);
          this.loading.set(false);

          DevLogger.log('[JobReviews] loaded reviews', hydrated);
          DevLogger.groupEnd();
        },
        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          this.loading.set(false);
          DevLogger.error('[JobReviews] load failed', error);
          DevLogger.groupEnd();
        },
      });
  }

  private resolveUserFromJob(userId: number | string | undefined) {
    const job = this.currentJobValue();

    if (!job || userId === undefined || userId === null) {
      return undefined;
    }

    if (job.owner && String(job.owner_id) === String(userId)) {
      return job.owner;
    }

    if (job.freelancer && String(job.freelancer_id) === String(userId)) {
      return job.freelancer;
    }

    return undefined;
  }
}