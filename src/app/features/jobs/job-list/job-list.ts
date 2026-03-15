import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Job, JobStatus } from '../../../core/models/job.model';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [TranslatePipe, DatePipe],
  templateUrl: './job-list.html',
  styleUrl: './job-list.scss',
})
export class JobList {
  readonly pageSizeOptions = [10, 20, 50] as const;

  private readonly jobItems = signal<Job[]>([]);
  private previousJobIds = '';

  @Input({ required: true })
  set jobs(value: Job[]) {
    const nextJobs = value ?? [];
    const nextJobIds = nextJobs.map((job) => job.id).join(',');

    this.jobItems.set(nextJobs);

    if (nextJobIds !== this.previousJobIds) {
      this.currentPage.set(1);
      this.previousJobIds = nextJobIds;
      return;
    }

    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }
  }

  @Output() jobClick = new EventEmitter<number>();
  @Output() action = new EventEmitter<number>();

  @Input() actionLabel: string | null = null;
  @Input() actionClass = 'btn btn-secondary';
  @Input() actionVisibleStatuses: JobStatus[] = [];
  @Input() actionDisabledStatuses: JobStatus[] = [];
  @Input() actionDisabledTitle: string | null = null;
  @Input() actionLoadingId: number | null = null;
  @Input() actionLabelResolver: ((job: Job) => string | null) | null = null;
  @Input() actionClassResolver: ((job: Job) => string) | null = null;
  @Input() actionDisabledResolver: ((job: Job) => boolean) | null = null;
  @Input() actionTitleResolver: ((job: Job) => string | null) | null = null;

  readonly pageSize = signal<number>(10);
  readonly currentPage = signal(1);

  readonly totalResults = computed(() => this.jobItems().length);
  readonly totalPages = computed(() => {
    const pages = Math.ceil(this.totalResults() / this.pageSize());

    return Math.max(1, pages);
  });
  readonly hasResults = computed(() => this.totalResults() > 0);
  readonly pagedJobs = computed(() => {
    const page = this.currentPage();
    const pageSize = this.pageSize();
    const start = (page - 1) * pageSize;

    return this.jobItems().slice(start, start + pageSize);
  });
  readonly canGoPrevious = computed(() => this.currentPage() > 1);
  readonly canGoNext = computed(() => this.currentPage() < this.totalPages());

  onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);

    if (!this.pageSizeOptions.includes(value as (typeof this.pageSizeOptions)[number])) {
      return;
    }

    this.pageSize.set(value);
    this.currentPage.set(1);
  }

  goToPreviousPage(): void {
    if (!this.canGoPrevious()) {
      return;
    }

    this.currentPage.update((page) => page - 1);
  }

  goToNextPage(): void {
    if (!this.canGoNext()) {
      return;
    }

    this.currentPage.update((page) => page + 1);
  }

  openJob(jobId: number): void {
    this.jobClick.emit(jobId);
  }

  showAction(job: Job): boolean {
    if (this.actionLabelResolver) {
      return !!this.actionLabelResolver(job);
    }

    if (!this.actionLabel) {
      return false;
    }

    if (this.actionVisibleStatuses.length === 0) {
      return true;
    }

    return this.actionVisibleStatuses.includes(job.status);
  }

  isActionDisabled(job: Job): boolean {
    if (this.actionDisabledResolver) {
      return this.actionDisabledResolver(job);
    }

    return (
      this.actionDisabledStatuses.includes(job.status) ||
      this.actionLoadingId === job.id
    );
  }

  actionLabelFor(job: Job): string | null {
    if (this.actionLabelResolver) {
      return this.actionLabelResolver(job);
    }

    return this.actionLabel;
  }

  actionClassFor(job: Job): string {
    if (this.actionClassResolver) {
      return this.actionClassResolver(job);
    }

    return this.actionClass;
  }

  actionTitleFor(job: Job): string | null {
    if (this.actionTitleResolver) {
      return this.actionTitleResolver(job);
    }

    return this.isActionDisabled(job) ? this.actionDisabledTitle : null;
  }

  triggerAction(event: Event, jobId: number): void {
    event.stopPropagation();
    this.action.emit(jobId);
  }

}
