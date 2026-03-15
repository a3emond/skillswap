import { Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ProposalsService } from '../../../core/services/proposals.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { NavbarStore } from '../../../core/navbar/navbar.store';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { ProposalCreateDto } from '../../../core/models/dto/proposal-create.dto';
import { Proposal } from '../../../core/models/proposal.model';

import { ApiError } from '../../../core/http/api-error.model';
import { DevLogger } from '../../../core/utils/dev-logger';

import { Spinner } from '../../../shared/components/spinner/spinner';
import { AlertError } from '../../../shared/components/alert-error/alert-error';

@Component({
  selector: 'app-proposal-create',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, Spinner, AlertError],
  templateUrl: './proposal-create.html',
  styleUrl: './proposal-create.scss',
})
export class ProposalCreate {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly proposalsService = inject(ProposalsService);
  private readonly authStore = inject(AuthStore);
  private readonly navbarStore = inject(NavbarStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) jobId!: number;
  @Input() jobTitle = '';

  @Output() submitted = new EventEmitter<Proposal>();
  @Output() close = new EventEmitter<void>();

  readonly loading = signal(false);
  readonly apiErrorMessage = signal('');

  readonly form = this.fb.group({
    price: [0],
    message: [''],
  });

  submit(): void {
    DevLogger.group('[ProposalCreate] submit');

    this.apiErrorMessage.set('');

    const raw = this.form.getRawValue();

    const dto: ProposalCreateDto = {
      price: raw.price,
      message: raw.message,
    };

    this.loading.set(true);

    this.proposalsService
      .create(this.jobId, dto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (proposal) => {
          const currentUser = this.authStore.user();
          const enrichedProposal: Proposal = {
            ...proposal,
            job_id: proposal.job_id ?? this.jobId,
            user_id: proposal.user_id ?? currentUser?.id,
            freelancer_id: proposal.freelancer_id ?? currentUser?.id,
            freelancer: proposal.freelancer ?? currentUser ?? undefined,
            job:
              proposal.job ??
              (this.jobTitle
                ? {
                    id: this.jobId,
                    title: this.jobTitle,
                  }
                : null),
          };

          DevLogger.log('[ProposalCreate] created', proposal);
          this.navbarStore.refresh();
          this.submitted.emit(enrichedProposal);
        },

        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[ProposalCreate] failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  closeModal(): void {
    this.close.emit();
  }
}
