import { Component, DestroyRef, Input, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ReviewsService } from '../../../core/services/reviews.service';
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
  selector: 'app-user-reviews',
  standalone: true,
  imports: [TranslatePipe, DatePipe, Spinner, AlertError, EmptyState, RatingStars],
  templateUrl: './user-reviews.html',
  styleUrl: './user-reviews.scss',
})
export class UserReviews {
  private readonly reviewsService = inject(ReviewsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) userId!: number;

  readonly loading = signal(true);
  readonly apiErrorMessage = signal('');
  readonly reviews = signal<Review[]>([]);

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    DevLogger.group('[UserReviews] loadReviews');

    this.loading.set(true);
    this.apiErrorMessage.set('');

    this.reviewsService
      .getForUser(this.userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (reviews) => {
          this.reviews.set(reviews ?? []);
          DevLogger.log('[UserReviews] loaded reviews', reviews);
        },
        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[UserReviews] load failed', error);
        },
      });

    DevLogger.groupEnd();
  }
}
