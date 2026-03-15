import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Job } from '../../../core/models/job.model';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [TranslatePipe],
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

}
