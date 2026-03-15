import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { JobsService } from '../../../core/services/jobs.service';

import { ApiError } from '../../../core/http/api-error.model';
import { DevLogger } from '../../../core/utils/dev-logger';

import { Job } from '../../../core/models/job.model';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';

import { Spinner } from '../../../shared/components/spinner/spinner';
import { AlertError } from '../../../shared/components/alert-error/alert-error';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Modal } from '../../../shared/components/modal/modal';

import { JobList } from '../job-list/job-list';
import { JobDetails } from '../job-details/job-details';

@Component({
  selector: 'app-my-postings',
  standalone: true,
  imports: [
    TranslatePipe,
    Spinner,
    AlertError,
    EmptyState,
    Modal,
    JobList,
    JobDetails,
  ],
  templateUrl: './my-postings.html',
  styleUrl: './my-postings.scss',
})
export class MyPostings {
  private readonly jobsService = inject(JobsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);

  readonly loading = signal(true);
  readonly apiErrorMessage = signal('');

  readonly jobs = signal<Job[]>([]);
  readonly selectedJobId = signal<number | null>(null);

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
          this.jobs.set(jobs ?? []);
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

  handleJobRefresh(updated: Job): void {
    this.jobs.update((list) => list.map((job) => (job.id === updated.id ? updated : job)));
  }

}
