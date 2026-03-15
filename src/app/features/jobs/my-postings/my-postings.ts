import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';

import { JobsService } from '../../../core/services/jobs.service';
import { NavbarStore } from '../../../core/navbar/navbar.store';
import { ReviewsService } from '../../../core/services/reviews.service';
import { AuthStore } from '../../../core/auth/auth.store';

import { ApiError } from '../../../core/http/api-error.model';
import { DevLogger } from '../../../core/utils/dev-logger';

import { Job } from '../../../core/models/job.model';
import { Review } from '../../../core/models/review.model';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';

import { Spinner } from '../../../shared/components/spinner/spinner';
import { AlertError } from '../../../shared/components/alert-error/alert-error';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Modal } from '../../../shared/components/modal/modal';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

import { JobList } from '../job-list/job-list';
import { JobDetails } from '../job-details/job-details';
import { ReviewSubmit } from '../../reviews/review-submit/review-submit';

type ReviewDraft = {
  jobId: number;
  targetId: number;
  targetLabel: string;
};

@Component({
  selector: 'app-my-postings',
  standalone: true,
  imports: [
    TranslatePipe,
    Spinner,
    AlertError,
    EmptyState,
    Modal,
    ConfirmDialog,
    JobList,
    JobDetails,
    ReviewSubmit,
  ],
  templateUrl: './my-postings.html',
  styleUrl: './my-postings.scss',
})
export class MyPostings {
  private readonly jobsService = inject(JobsService);
  private readonly navbarStore = inject(NavbarStore);
  private readonly reviewsService = inject(ReviewsService);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);

  readonly loading = signal(true);
  readonly actionLoadingJobId = signal<number | null>(null);
  readonly apiErrorMessage = signal('');

  readonly jobs = signal<Job[]>([]);
  readonly selectedJobId = signal<number | null>(null);
  readonly pendingCompleteJob = signal<Job | null>(null);
  readonly reviewDraft = signal<ReviewDraft | null>(null);
  readonly reviewedJobIds = signal<Set<number>>(new Set());

  readonly currentUser = this.authStore.user;

  readonly actionLabelResolver = (job: Job): string | null => {
    if (job.status === 'in_progress') {
      return 'jobs.actions.complete';
    }

    if (job.status === 'completed' && this.canReviewJob(job)) {
      return 'jobs.actions.leave_review';
    }

    return null;
  };

  readonly actionClassResolver = (job: Job): string => {
    return job.status === 'in_progress' ? 'btn btn-primary' : 'btn btn-secondary';
  };

  readonly actionDisabledResolver = (job: Job): boolean => {
    return this.actionLoadingJobId() === job.id;
  };

  readonly actionTitleResolver = (job: Job): string | null => {
    if (job.status === 'open') {
      return this.i18n.t('jobs.complete.available_when_in_progress');
    }

    if (job.status === 'completed' && !this.canReviewJob(job)) {
      return this.i18n.t('reviews.submit.already_submitted');
    }

    return null;
  };

  ngOnInit(): void {
    this.loadMyPostings();
  }

  loadMyPostings(): void {
    DevLogger.group('[MyPostings] loadMyPostings');

    this.loading.set(true);
    this.apiErrorMessage.set('');

    this.jobsService
      .getMyPostings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (jobs) => {
          const nextJobs = jobs ?? [];

          this.jobs.set(nextJobs);
          this.loadReviewState(nextJobs);

          DevLogger.log('[MyPostings] jobs loaded', jobs);
        },
        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[MyPostings] load failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  openJob(jobId: number): void {
    this.selectedJobId.set(jobId);
  }

  closeJob(): void {
    this.selectedJobId.set(null);
  }

  askComplete(jobId: number): void {
    const job = this.jobs().find((item) => item.id === jobId) ?? null;

    if (!job || job.status === 'completed') {
      return;
    }

    this.pendingCompleteJob.set(job);
  }

  askJobAction(jobId: number): void {
    const job = this.jobs().find((item) => item.id === jobId) ?? null;

    if (!job) {
      return;
    }

    if (job.status === 'in_progress') {
      this.askComplete(jobId);
      return;
    }

    if (job.status === 'completed') {
      this.openReview(job);
    }
  }

  confirmAction(): void {
    this.completeSelectedJob();
  }

  clearPendingAction(): void {
    this.pendingCompleteJob.set(null);
  }

  clearReviewDraft(): void {
    this.reviewDraft.set(null);
  }

  openReview(job: Job): void {
    if (!this.canReviewJob(job)) {
      return;
    }

    const targetId = job.freelancer_id ?? 0;

    if (!targetId) {
      return;
    }

    this.reviewDraft.set({
      jobId: job.id,
      targetId,
      targetLabel: job.freelancer?.username ?? job.freelancer?.name ?? '',
    });
  }

  handleReviewSubmitted(): void {
    const draft = this.reviewDraft();

    if (draft) {
      this.reviewedJobIds.update((set) => {
        const next = new Set(set);
        next.add(draft.jobId);
        return next;
      });
    }

    this.reviewDraft.set(null);
  }

  canReviewJob(job: Job): boolean {
    if (job.status !== 'completed') {
      return false;
    }

    if (!job.freelancer_id) {
      return false;
    }

    return !this.reviewedJobIds().has(job.id);
  }

  private loadReviewState(jobs: Job[]): void {
    const currentUserId = this.currentUser()?.id;

    if (!currentUserId) {
      this.reviewedJobIds.set(new Set());
      return;
    }

    const completedJobs = jobs.filter((job) => job.status === 'completed' && !!job.freelancer_id);

    if (completedJobs.length === 0) {
      this.reviewedJobIds.set(new Set());
      return;
    }

    const targetIds = [...new Set(completedJobs.map((job) => job.freelancer_id!).filter(Boolean))];

    forkJoin(
      targetIds.map((targetId) =>
        this.reviewsService.getForUser(targetId).pipe(catchError(() => of([] as Review[]))),
      ),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lists: Review[][]) => {
        const done = new Set<number>();

        const byTarget = new Map<number, Review[]>();
        targetIds.forEach((targetId, index) => {
          byTarget.set(targetId, lists[index] ?? []);
        });

        for (const job of completedJobs) {
          const targetReviews = byTarget.get(job.freelancer_id ?? 0) ?? [];

          const alreadyReviewed = targetReviews.some(
            (review) =>
              review.job_id === job.id &&
              String(review.reviewer_id) === String(currentUserId),
          );

          if (alreadyReviewed) {
            done.add(job.id);
          }
        }

        this.reviewedJobIds.set(done);
      });
  }

  completeSelectedJob(): void {
    const job = this.pendingCompleteJob();

    if (!job) {
      return;
    }

    DevLogger.group('[MyPostings] completeSelectedJob');

    this.actionLoadingJobId.set(job.id);
    this.apiErrorMessage.set('');

    this.jobsService
      .complete(job.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.actionLoadingJobId.set(null);
          this.clearPendingAction();
        }),
      )
      .subscribe({
        next: (updated) => {
          this.loadMyPostings();
          this.navbarStore.refresh();
          DevLogger.log('[MyPostings] completed job', updated);
        },
        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[MyPostings] complete failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  handleJobRefresh(updated: Job): void {
    this.jobs.update((list) => list.map((job) => (job.id === updated.id ? updated : job)));
  }

}
