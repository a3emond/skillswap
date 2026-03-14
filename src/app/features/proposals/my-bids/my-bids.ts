import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ProposalsService } from '../../../core/services/proposals.service';

import { ApiError } from '../../../core/http/api-error.model';
import { DevLogger } from '../../../core/utils/dev-logger';

import { Proposal } from '../../../core/models/proposal.model';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';

import { Spinner } from '../../../shared/components/spinner/spinner';
import { AlertError } from '../../../shared/components/alert-error/alert-error';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

import { JobProposals } from '../job-proposals/job-proposals';
import { JobDetails } from '../../jobs/job-details/job-details';

@Component({
  selector: 'app-my-bids',
  standalone: true,
  imports: [
    TranslatePipe,
    Spinner,
    AlertError,
    EmptyState,
    ConfirmDialog,
    JobProposals,
    JobDetails,
  ],
  templateUrl: './my-bids.html',
  styleUrl: './my-bids.scss',
})
export class MyBids {
  private readonly proposalsService = inject(ProposalsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);

  readonly loading = signal(true);
  readonly actionLoading = signal(false);

  readonly apiErrorMessage = signal('');

  readonly bids = signal<Proposal[]>([]);

  readonly selectedProposal = signal<Proposal | null>(null);
  readonly selectedJobId = signal<number | null>(null);

  readonly pendingAction = signal<'delete' | null>(null);

  readonly confirmTitle = signal('');
  readonly confirmMessage = signal('');

  ngOnInit(): void {
    this.loadBids();
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
          this.bids.set(dto ?? []);
          DevLogger.log('[MyBids] bids loaded', dto);
        },
        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[MyBids] load failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  openJob(jobId: number): void {
    this.selectedJobId.set(jobId);
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
}
