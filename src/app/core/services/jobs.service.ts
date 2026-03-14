import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { ApiClient } from '../http/api-client';

import { Job } from '../models/job.model';
import { JobSearchDto } from '../models/dto/job-search.dto';
import { JobCreateDto } from '../models/dto/job-create.dto';
import { JobUpdateDto } from '../models/dto/job-update.dto';
import { JobsListDto } from '../models/dto/jobs-list.dto';


/**
 * JobsService differs from other services because it maintains a small
 * in-memory cache of job categories derived from API responses.
 *
 * The backend exposes categories only as free-form strings and does not
 * provide an endpoint to list available categories. To support dynamic
 * UI elements (e.g. category dropdowns) without additional requests,
 * the service extracts unique categories whenever jobs are fetched or
 * modified and stores them in a signal.
 *
 * This allows components to consume a reactive list of categories while
 * keeping the API contract unchanged.
 */


@Injectable({ providedIn: 'root' })
export class JobsService {
  constructor(private readonly api: ApiClient) {}

  readonly categories = signal<string[]>([]);

  private updateCategoriesFromList(jobs: Job[]): void {
    const set = new Set(this.categories());

    for (const job of jobs) {
      const cat = job.category?.trim();

      if (cat) {
        set.add(cat);
      }
    }

    const sorted = [...set].sort((a, b) => a.localeCompare(b));

    this.categories.set(sorted);
  }

  private updateCategoryFromJob(job: Job): void {
    const cat = job.category?.trim();

    if (!cat) return;

    const set = new Set(this.categories());

    set.add(cat);

    const sorted = [...set].sort((a, b) => a.localeCompare(b));

    this.categories.set(sorted);
  }

  search(dto: JobSearchDto): Observable<JobsListDto> {
    return this.api
      .post<JobsListDto>('/jobs/search', dto)
      .pipe(tap((jobs) => this.updateCategoriesFromList(jobs)));
  }

  create(dto: JobCreateDto): Observable<Job> {
    return this.api.post<Job>('/jobs', dto).pipe(tap((job) => this.updateCategoryFromJob(job)));
  }

  getById(jobId: number): Observable<Job> {
    return this.api.get<Job>(`/jobs/${jobId}`).pipe(tap((job) => this.updateCategoryFromJob(job)));
  }

  update(jobId: number, dto: JobUpdateDto): Observable<Job> {
    return this.api
      .patch<Job>(`/jobs/${jobId}`, dto)
      .pipe(tap((job) => this.updateCategoryFromJob(job)));
  }

  getMyPostings(): Observable<JobsListDto> {
    return this.api
      .get<JobsListDto>('/jobs/my-postings')
      .pipe(tap((jobs) => this.updateCategoriesFromList(jobs)));
  }

  complete(jobId: number): Observable<Job> {
    return this.api
      .patch<Job>(`/jobs/${jobId}/complete`, {})
      .pipe(tap((job) => this.updateCategoryFromJob(job)));
  }
}
