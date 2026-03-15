import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { JobsService } from '../../../core/services/jobs.service';

import { JobSearchDto } from '../../../core/models/dto/job-search.dto';
import { JobStatus, Job } from '../../../core/models/job.model';

import { ApiError } from '../../../core/http/api-error.model';
import { DevLogger } from '../../../core/utils/dev-logger';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { AlertError } from '../../../shared/components/alert-error/alert-error';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { Modal } from '../../../shared/components/modal/modal';

import { JobDetails } from '../job-details/job-details';
import { JobList } from '../job-list/job-list';

@Component({
  selector: 'app-job-search',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, AlertError, Spinner, Modal, JobDetails, JobList],
  templateUrl: './job-search.html',
  styleUrl: './job-search.scss',
})
export class JobSearch {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly jobsService = inject(JobsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);

  readonly loading = signal(false);
  readonly apiError = signal('');
  readonly jobs = signal<Job[]>([]);
  readonly selectedJobId = signal<number | null>(null);

  readonly categories = this.jobsService.categories;

  readonly form = this.fb.group({
    category: [''],
    status: ['' as JobStatus | ''],
    min_budget: [0],
  });

  readonly showDetails = computed(() => this.selectedJobId() !== null);


  // Initializes the component and loads categories/jobs on startup
  constructor() {
    this.bootstrapCategories();
  }

  // Handles job search form submission and updates job list
  search(): void {
    DevLogger.group('[JobSearch] search');

    this.apiError.set('');

    const raw = this.form.getRawValue();

    const dto: JobSearchDto = {};

    if (raw.category) dto.category = raw.category;
    if (raw.status) dto.status = raw.status as JobStatus;
    if (raw.min_budget > 0) dto.min_budget = raw.min_budget;

    DevLogger.log('[JobSearch] DTO', dto);

    this.loading.set(true);

    this.jobsService
      .search(dto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          DevLogger.log('[JobSearch] request finalized');
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (jobs) => {
          DevLogger.group('[JobSearch] success');

          DevLogger.log('[JobSearch] results', jobs);

          this.jobs.set(jobs);

          DevLogger.groupEnd();
        },

        error: (error: ApiError) => {
          DevLogger.group('[JobSearch] error');

          DevLogger.error('[JobSearch] normalized ApiError', error);

          this.apiError.set(this.i18n.error(error.message));

          DevLogger.groupEnd();
        },
      });

    DevLogger.groupEnd();
  }

  // Selects a job to show its details
  openJob(jobId: number): void {
    this.selectedJobId.set(jobId);
  }

  // Deselects the current job and hides details
  closeJob(): void {
    this.selectedJobId.set(null);
  }

  // Updates a job in the list after it is refreshed/edited
  handleJobRefresh(updated: Job): void {
    this.jobs.update((list) => list.map((job) => (job.id === updated.id ? updated : job)));
  }

  // Loads initial categories and jobs
  private bootstrapCategories(): void {
    const dto: JobSearchDto = {};

    this.jobsService
      .search(dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (jobs) => {
          this.jobs.set(jobs);
        },

        error: (error: ApiError) => {
          DevLogger.error('[JobSearch] bootstrap search failed', error);
        },
      });
  }
}
