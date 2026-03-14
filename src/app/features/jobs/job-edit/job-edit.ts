import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';

import { Job } from '../../../core/models/job.model';
import { JobUpdateDto } from '../../../core/models/dto/job-update.dto';
import { ApiError } from '../../../core/http/api-error.model';

import { JobsService } from '../../../core/services/jobs.service';
import { DevLogger } from '../../../core/utils/dev-logger';

import { Modal } from '../../../shared/components/modal/modal';
import { JobForm, JobFormValue } from '../job-form/job-form';

@Component({
  selector: 'app-job-edit',
  standalone: true,
  imports: [Modal, JobForm],
  templateUrl: './job-edit.html',
  styleUrl: './job-edit.scss',
})
export class JobEdit {
  private readonly jobsService = inject(JobsService);

  @Input({ required: true }) job!: Job;

  @Output() updated = new EventEmitter<Job>();
  @Output() closed = new EventEmitter<void>();

  readonly loading = signal(false);

  close(): void {
    this.closed.emit();
  }

  submit(value: JobFormValue): void {
    const dto: JobUpdateDto = {
      title: value.title,
      description: value.description,
      budget: value.budget,
      category: value.category,
      status: value.status,
    };

    this.loading.set(true);

    this.jobsService.update(this.job.id, dto).subscribe({
      next: (updated) => {
        this.updated.emit(updated);
        this.closed.emit();
      },
      error: (error: ApiError) => {
        DevLogger.error('[JobEdit] update failed', error);
        this.loading.set(false);
      },
    });
  }
}
