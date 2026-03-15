import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { JobForm } from '../job-form/job-form';
import { JobsService } from '../../../core/services/jobs.service';
import { NavbarStore } from '../../../core/navbar/navbar.store';

import { JobCreateDto } from '../../../core/models/dto/job-create.dto';
import { ApiError } from '../../../core/http/api-error.model';

import { DevLogger } from '../../../core/utils/dev-logger';

@Component({
  selector: 'app-job-create',
  standalone: true,
  imports: [JobForm],
  templateUrl: './job-create.html',
  styleUrl: './job-create.scss',
})
export class JobCreate {
  private readonly jobsService = inject(JobsService);
  private readonly navbarStore = inject(NavbarStore);
  private readonly router = inject(Router);

  readonly loading = signal(false);

  submit(dto: JobCreateDto): void {
    const createDto: JobCreateDto = {
      title: dto.title!,
      description: dto.description!,
      budget: dto.budget!,
      category: dto.category!,
    };

    this.loading.set(true);

    this.jobsService.create(createDto).subscribe({
      next: () => {
        this.navbarStore.refresh();
        this.router.navigate(['/jobs']);
      },
      error: (error: ApiError) => {
        DevLogger.error('[JobCreate] create failed', error);
        this.loading.set(false);
      },
    });
  }
}
