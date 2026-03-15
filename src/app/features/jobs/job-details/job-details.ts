import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { JobsService } from '../../../core/services/jobs.service';
import { ProposalsService } from '../../../core/services/proposals.service';
import { AuthStore } from '../../../core/auth/auth.store';

import { ApiError } from '../../../core/http/api-error.model';
import { DevLogger } from '../../../core/utils/dev-logger';

import { Job } from '../../../core/models/job.model';
import { Proposal } from '../../../core/models/proposal.model';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';

import { Spinner } from '../../../shared/components/spinner/spinner';
import { AlertError } from '../../../shared/components/alert-error/alert-error';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

import { PublicProfile } from '../../users/public-profile/public-profile';
import { JobProposals } from '../../proposals/job-proposals/job-proposals';
import { ProposalCreate } from '../../proposals/proposal-create/proposal-create';
import { JobReviews } from '../../reviews/job-reviews/job-reviews';
import { ReviewSubmit } from '../../reviews/review-submit/review-submit';

type PendingAction = 'accept' | 'delete' | 'complete' | null;
type SectionKey = 'meta' | 'owner' | 'freelancer' | 'proposals' | 'reviews';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [
    TranslatePipe,
    Spinner,
    AlertError,
    ConfirmDialog,
    EmptyState,
    PublicProfile,
    JobProposals,
    ProposalCreate,
    JobReviews,
    ReviewSubmit,
  ],
  templateUrl: './job-details.html',
  styleUrl: './job-details.scss',
})
export class JobDetails {
  private readonly jobsService = inject(JobsService);
  private readonly proposalsService = inject(ProposalsService);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) jobId!: number;

  @Output() close = new EventEmitter<void>();
  @Output() refreshed = new EventEmitter<Job>();

  readonly loading = signal(true);
  readonly proposalsLoading = signal(false);
  readonly actionLoading = signal(false);

  readonly apiErrorMessage = signal('');
  readonly proposalsErrorMessage = signal('');

  readonly job = signal<Job | null>(null);

  readonly ownerProposals = signal<Proposal[]>([]);
  readonly myBids = signal<Proposal[]>([]);

  readonly selectedProposal = signal<Proposal | null>(null);
  readonly pendingAction = signal<PendingAction>(null);

  readonly showReview = signal(false);

  readonly currentUser = computed(() => this.authStore.user());
  readonly currentUserId = computed(() => this.currentUser()?.id ?? 0);

  readonly isOwner = computed(() => {
    const job = this.job();
    return !!job && job.owner_id === this.currentUserId();
  });

  readonly isAssignedFreelancer = computed(() => {
    const job = this.job();
    return !!job && job.freelancer_id === this.currentUserId();
  });

  readonly isJobOpen = computed(() => {
    const job = this.job();
    return !!job && job.status === 'open';
  });

  readonly myProposal = computed(() => {
    return this.myBids().find((proposal) => proposal.job_id === this.jobId) ?? null;
  });

  readonly hasMyProposal = computed(() => !!this.myProposal());

  readonly canViewOwnerProposals = computed(() => {
    return this.isOwner() && this.isJobOpen();
  });

  readonly canSubmitProposal = computed(() => {
    return !this.isOwner() && this.isJobOpen() && !this.hasMyProposal();
  });

  readonly canDeleteMyProposal = computed(() => {
    const proposal = this.myProposal();
    return !!proposal && proposal.status === 'pending';
  });

  readonly canComplete = computed(() => {
    const job = this.job();
    return !!job && job.status === 'in_progress' && (this.isOwner() || this.isAssignedFreelancer());
  });

  readonly canReview = computed(() => {
    const job = this.job();
    return !!job && job.status === 'completed' && (this.isOwner() || this.isAssignedFreelancer());
  });

  readonly canShowReviews = computed(() => {
    const job = this.job();

    return !!job && job.status === 'completed';
  });

  readonly reviewTargetId = computed(() => {
    const job = this.job();

    if (!job) {
      return 0;
    }

    if (this.isOwner()) {
      return job.freelancer_id ?? 0;
    }

    if (this.isAssignedFreelancer()) {
      return job.owner_id ?? 0;
    }

    return 0;
  });

  readonly reviewTargetName = computed(() => {
    const job = this.job();

    if (!job) {
      return '';
    }

    if (this.isOwner()) {
      return job.freelancer?.username ?? job.freelancer?.name ?? '';
    }

    if (this.isAssignedFreelancer()) {
      return job.owner?.username ?? job.owner?.name ?? '';
    }

    return '';
  });

  readonly confirmTitle = computed(() => {
    switch (this.pendingAction()) {
      case 'accept':
        return this.i18n.t('proposals.accept.confirm_title');
      case 'delete':
        return this.i18n.t('proposals.delete.confirm_title');
      case 'complete':
        return this.i18n.t('jobs.complete.confirm_title');
      default:
        return '';
    }
  });

  readonly confirmMessage = computed(() => {
    switch (this.pendingAction()) {
      case 'accept':
        return this.i18n.t('proposals.accept.confirm_message');
      case 'delete':
        return this.i18n.t('proposals.delete.confirm_message');
      case 'complete':
        return this.i18n.t('jobs.complete.confirm_message');
      default:
        return '';
    }
  });

  // collapsible sections 
  readonly openSection = signal<SectionKey>('meta');

  toggleSection(section: SectionKey): void {
    this.openSection.set(section);
  }

  isOpen(section: SectionKey): boolean {
    return this.openSection() === section;
  }

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(): void {
    this.loadJob();
  }

  loadJob(): void {
    DevLogger.group('[JobDetails] loadJob');

    this.loading.set(true);
    this.apiErrorMessage.set('');
    this.proposalsErrorMessage.set('');

    this.jobsService
      .getById(this.jobId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (job) => {
          this.job.set(job);
          this.refreshed.emit(job);

          DevLogger.log('[JobDetails] loaded job', job);

          this.loadProposalState();
        },
        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[JobDetails] load failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  loadProposalState(): void {
    this.ownerProposals.set([]);
    this.myBids.set([]);
    this.proposalsErrorMessage.set('');

    if (this.canViewOwnerProposals()) {
      this.loadOwnerProposals();
      return;
    }

    if (!this.isOwner()) {
      this.loadMyBids();
    }
  }

  loadOwnerProposals(): void {
    DevLogger.group('[JobDetails] loadOwnerProposals');

    this.proposalsLoading.set(true);
    this.proposalsErrorMessage.set('');

    this.proposalsService
      .getForJob(this.jobId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.proposalsLoading.set(false);
        }),
      )
      .subscribe({
        next: (proposals) => {
          this.ownerProposals.set(proposals);
          DevLogger.log('[JobDetails] owner proposals loaded', proposals);
        },
        error: (error: ApiError) => {
          this.proposalsErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[JobDetails] owner proposals load failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  loadMyBids(): void {
    DevLogger.group('[JobDetails] loadMyBids');

    this.proposalsLoading.set(true);
    this.proposalsErrorMessage.set('');

    this.proposalsService
      .getMyBids()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.proposalsLoading.set(false);
        }),
      )
      .subscribe({
        next: (dto) => {
          this.myBids.set(dto ?? []);
          DevLogger.log('[JobDetails] my bids loaded', dto);
        },
        error: (error: ApiError) => {
          this.proposalsErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[JobDetails] my bids load failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  handleProposalSubmitted(): void {
    this.loadProposalState();
  }

  askAccept(proposalId: number): void {
    const proposal = this.ownerProposals().find((item) => item.id === proposalId) ?? null;

    if (!proposal) {
      return;
    }

    this.selectedProposal.set(proposal);
    this.pendingAction.set('accept');
  }

  askDelete(proposalId: number): void {
    const proposal =
      this.myProposal()?.id === proposalId
        ? this.myProposal()
        : (this.myBids().find((item) => item.id === proposalId) ?? null);

    if (!proposal) {
      return;
    }

    this.selectedProposal.set(proposal);
    this.pendingAction.set('delete');
  }

  askComplete(): void {
    this.selectedProposal.set(null);
    this.pendingAction.set('complete');
  }

  confirmAction(): void {
    switch (this.pendingAction()) {
      case 'accept':
        this.acceptSelectedProposal();
        break;
      case 'delete':
        this.deleteSelectedProposal();
        break;
      case 'complete':
        this.completeJob();
        break;
    }
  }

  acceptSelectedProposal(): void {
    const proposal = this.selectedProposal();

    if (!proposal) {
      return;
    }

    DevLogger.group('[JobDetails] acceptSelectedProposal');

    this.actionLoading.set(true);
    this.apiErrorMessage.set('');

    this.proposalsService
      .accept(proposal.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.actionLoading.set(false);
          this.clearPendingAction();
        }),
      )
      .subscribe({
        next: () => {
          DevLogger.log('[JobDetails] proposal accepted', proposal.id);
          this.loadPage();
        },
        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[JobDetails] accept failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  deleteSelectedProposal(): void {
    const proposal = this.selectedProposal();

    if (!proposal) {
      return;
    }

    DevLogger.group('[JobDetails] deleteSelectedProposal');

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
          DevLogger.log('[JobDetails] proposal deleted', proposal.id);
          this.loadProposalState();
        },
        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[JobDetails] delete failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  openReview(): void {
    this.showReview.set(true);
  }

  completeJob(): void {
    DevLogger.group('[JobDetails] completeJob');

    this.actionLoading.set(true);
    this.apiErrorMessage.set('');

    this.jobsService
      .complete(this.jobId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.actionLoading.set(false);
          this.clearPendingAction();
        }),
      )
      .subscribe({
        next: (job) => {
          this.job.set(job);
          this.refreshed.emit(job);

          DevLogger.log('[JobDetails] completed job', job);

          this.loadPage();
        },
        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[JobDetails] complete failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  clearPendingAction(): void {
    this.pendingAction.set(null);
    this.selectedProposal.set(null);
  }

  handleReviewSubmitted(): void {
    this.showReview.set(false);
    this.loadPage();
  }
}
