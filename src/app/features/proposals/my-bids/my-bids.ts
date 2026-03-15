import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';

import { ProposalsService } from '../../../core/services/proposals.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { JobsService } from '../../../core/services/jobs.service';
import { NavbarStore } from '../../../core/navbar/navbar.store';
import { ReviewsService } from '../../../core/services/reviews.service';

import { ApiError } from '../../../core/http/api-error.model';
import { DevLogger } from '../../../core/utils/dev-logger';

import { Proposal } from '../../../core/models/proposal.model';
import { Review } from '../../../core/models/review.model';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';

import { Spinner } from '../../../shared/components/spinner/spinner';
import { AlertError } from '../../../shared/components/alert-error/alert-error';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { Modal } from '../../../shared/components/modal/modal';

import { JobProposals } from '../job-proposals/job-proposals';
import { JobDetails } from '../../jobs/job-details/job-details';
import { ReviewSubmit } from '../../reviews/review-submit/review-submit';

type ReviewDraft = {
  proposalId: number;
  jobId: number;
  targetId: number;
  targetLabel: string;
};

@Component({
  selector: 'app-my-bids',
  standalone: true,
  imports: [
    TranslatePipe,
    Spinner,
    AlertError,
    EmptyState,
    ConfirmDialog,
    Modal,
    JobProposals,
    JobDetails,
    ReviewSubmit,
  ],
  templateUrl: './my-bids.html',
  styleUrl: './my-bids.scss',
})
export class MyBids {
  private readonly proposalsService = inject(ProposalsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly authStore = inject(AuthStore);
  private readonly jobsService = inject(JobsService);
  private readonly navbarStore = inject(NavbarStore);
  private readonly reviewsService = inject(ReviewsService);

  readonly loading = signal(true);
  readonly actionLoading = signal(false);

  readonly apiErrorMessage = signal('');

  readonly bids = signal<Proposal[]>([]);

  readonly selectedProposal = signal<Proposal | null>(null);
  readonly selectedJobId = signal<number | null>(null);
  readonly reviewDraft = signal<ReviewDraft | null>(null);
  readonly reviewedProposalIds = signal<Set<number>>(new Set());

  readonly currentUser = this.authStore.user;

  readonly pendingAction = signal<'delete' | null>(null);

  readonly confirmTitle = signal('');
  readonly confirmMessage = signal('');

  readonly actionLabelResolver = (proposal: Proposal): string | null => {
    if (proposal.status === 'pending') {
      return 'proposals.actions.delete';
    }

    if (
      proposal.status === 'accepted' &&
      proposal.job?.status === 'completed' &&
      !this.reviewedProposalIds().has(proposal.id)
    ) {
      return 'jobs.actions.leave_review';
    }

    return null;
  };

  readonly actionClassResolver = (proposal: Proposal): string => {
    return proposal.status === 'pending' ? 'btn btn-danger' : 'btn btn-primary';
  };

  ngOnInit(): void {
    this.loadBids();
  }

  openJob(jobId: number): void {
    this.selectedJobId.set(jobId);
  }

  closeJob(): void {
    this.selectedJobId.set(null);
  }

  loadBids(): void {
    DevLogger.group('[MyBids] loadBids');

    this.loading.set(true);
    this.apiErrorMessage.set('');

    this.proposalsService
      .getMyBids()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (dto) => {
          const bids = dto ?? [];
          const missingJobIds = [...new Set(
            bids
              .filter((proposal) => !proposal.job?.title)
              .map((proposal) => proposal.job_id),
          )];

          if (missingJobIds.length === 0) {
            this.bids.set(bids);
            this.loadReviewState(bids);
            DevLogger.log('[MyBids] bids loaded', bids);
            return;
          }

          forkJoin(
            missingJobIds.map((jobId) =>
              this.jobsService.getById(jobId).pipe(
                map((job) => ({ id: jobId, job })),
                catchError(() => of({ id: jobId, job: null })),
              ),
            ),
          )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (titles) => {
                const titleMap = new Map(titles.map((item) => [item.id, item.job]));

                const enriched = bids.map((proposal) => {
                  const resolvedJob = titleMap.get(proposal.job_id);
                  const resolvedTitle = proposal.job?.title ?? resolvedJob?.title ?? '';

                  return {
                    ...proposal,
                    job:
                      resolvedJob || proposal.job
                        ? {
                            ...(proposal.job ?? {}),
                            ...(resolvedJob ?? {}),
                            id: proposal.job_id,
                            title: resolvedTitle,
                          }
                        : null,
                  };
                });

                this.bids.set(enriched);
                this.loadReviewState(enriched);
                DevLogger.log('[MyBids] bids enriched with job titles', enriched);
              },
              error: () => {
                this.bids.set(bids);
                this.loadReviewState(bids);
              },
            });
        },
        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[MyBids] load failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  askDelete(proposalId: number): void {
    const proposal = this.bids().find((item) => item.id === proposalId) ?? null;

    if (!proposal) {
      return;
    }

    this.selectedProposal.set(proposal);
    this.pendingAction.set('delete');

    this.confirmTitle.set(this.i18n.t('proposals.delete.confirm_title'));
    this.confirmMessage.set(this.i18n.t('proposals.delete.confirm_message'));
  }

  askProposalAction(proposalId: number): void {
    const proposal = this.bids().find((item) => item.id === proposalId) ?? null;

    if (!proposal) {
      return;
    }

    if (proposal.status === 'pending') {
      this.askDelete(proposalId);
      return;
    }

    if (
      proposal.status === 'accepted' &&
      proposal.job?.status === 'completed' &&
      !this.reviewedProposalIds().has(proposal.id)
    ) {
      this.openReview(proposal);
    }
  }

  openReview(proposal: Proposal): void {
    const targetId = proposal.job?.owner_id ?? 0;

    if (!targetId) {
      return;
    }

    this.reviewDraft.set({
      proposalId: proposal.id,
      jobId: proposal.job_id,
      targetId,
      targetLabel: proposal.job?.owner?.username ?? proposal.job?.owner?.name ?? '',
    });
  }

  clearReviewDraft(): void {
    this.reviewDraft.set(null);
  }

  handleReviewSubmitted(): void {
    const draft = this.reviewDraft();

    if (draft) {
      this.reviewedProposalIds.update((set) => {
        const next = new Set(set);
        next.add(draft.proposalId);
        return next;
      });
    }

    this.reviewDraft.set(null);
  }

  confirmAction(): void {
    if (this.pendingAction() === 'delete') {
      this.deleteSelectedProposal();
    }
  }

  deleteSelectedProposal(): void {
    const proposal = this.selectedProposal();

    if (!proposal) {
      return;
    }

    DevLogger.group('[MyBids] deleteSelectedProposal');

    this.actionLoading.set(true);
    this.apiErrorMessage.set('');

    this.proposalsService
      .delete(proposal.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.actionLoading.set(false);
          this.clearPendingAction();
        }),
      )
      .subscribe({
        next: () => {
          DevLogger.log('[MyBids] proposal deleted', proposal.id);

          this.bids.update((list) => list.filter((p) => p.id !== proposal.id));
          this.navbarStore.refresh();
        },
        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[MyBids] delete failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  clearPendingAction(): void {
    this.pendingAction.set(null);
    this.selectedProposal.set(null);
  }

  private loadReviewState(proposals: Proposal[]): void {
    const currentUserId = this.currentUser()?.id;

    if (!currentUserId) {
      this.reviewedProposalIds.set(new Set());
      return;
    }

    const eligible = proposals.filter(
      (proposal) => proposal.status === 'accepted' && proposal.job?.status === 'completed' && !!proposal.job?.owner_id,
    );

    if (eligible.length === 0) {
      this.reviewedProposalIds.set(new Set());
      return;
    }

    const targetIds = [...new Set(eligible.map((proposal) => proposal.job?.owner_id!).filter(Boolean))];

    forkJoin(
      targetIds.map((targetId) =>
        this.reviewsService.getForUser(targetId).pipe(catchError(() => of([] as Review[]))),
      ),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lists: Review[][]) => {
        const byTarget = new Map<number, Review[]>();

        targetIds.forEach((targetId, index) => {
          byTarget.set(targetId, lists[index] ?? []);
        });

        const reviewed = new Set<number>();

        for (const proposal of eligible) {
          const targetId = proposal.job?.owner_id ?? 0;
          const targetReviews = byTarget.get(targetId) ?? [];

          const already = targetReviews.some(
            (review) =>
              review.job_id === proposal.job_id &&
              String(review.reviewer_id) === String(currentUserId),
          );

          if (already) {
            reviewed.add(proposal.id);
          }
        }

        this.reviewedProposalIds.set(reviewed);
      });
  }
}
