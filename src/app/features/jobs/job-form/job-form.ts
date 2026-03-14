import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Job, JobStatus } from '../../../core/models/job.model';

import { JobsService } from '../../../core/services/jobs.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { FieldError } from '../../../shared/forms/field-error/field-error';
import { FormErrorSummary } from '../../../shared/forms/form-error-summary/form-error-summary';
import { Spinner } from '../../../shared/components/spinner/spinner';

export type JobFormValue = {
  title: string;
  description: string;
  budget: number;
  category: string;
  status: JobStatus;
};

@Component({
  selector: 'app-job-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, FieldError, FormErrorSummary, Spinner],
  templateUrl: './job-form.html',
  styleUrl: './job-form.scss',
})
export class JobForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly jobsService = inject(JobsService);
  private readonly i18n = inject(I18nService);

  @Input() job?: Job;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() loading = false;

  @Output() submitForm = new EventEmitter<JobFormValue>();

  readonly categories = this.jobsService.categories;

  readonly newCategory = signal('');

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    budget: [0, [Validators.required, Validators.min(1)]],
    category: [''],
    status: ['open' as JobStatus],
  });

  readonly submitDisabled = computed(() => this.loading || this.form.invalid);

  constructor() {
    effect(() => {
      const locked = this.newCategory().trim().length > 0;

      if (locked) {
        this.form.controls.category.disable({ emitEvent: false });
      } else {
        this.form.controls.category.enable({ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.bootstrapCategories();

    if (!this.job) return;

    this.form.patchValue({
      title: this.job.title,
      description: this.job.description,
      budget: this.job.budget,
      category: this.job.category,
      status: this.job.status,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const category = this.newCategory().trim() !== '' ? this.newCategory().trim() : raw.category;

    const value: JobFormValue = {
      title: raw.title,
      description: raw.description,
      budget: raw.budget,
      category,
      status: raw.status,
    };

    this.submitForm.emit(value);
  }

  get titleCtrl() {
    return this.form.controls.title;
  }
  get descriptionCtrl() {
    return this.form.controls.description;
  }
  get budgetCtrl() {
    return this.form.controls.budget;
  }

  getTitleError(): string {
    if (!this.titleCtrl.touched) return '';

    if (this.titleCtrl.hasError('required')) return this.i18n.t('jobs.validation.title_required');

    if (this.titleCtrl.hasError('minlength')) return this.i18n.t('jobs.validation.title_minlength');

    return '';
  }

  getDescriptionError(): string {
    if (!this.descriptionCtrl.touched) return '';

    if (this.descriptionCtrl.hasError('required'))
      return this.i18n.t('jobs.validation.description_required');

    if (this.descriptionCtrl.hasError('minlength'))
      return this.i18n.t('jobs.validation.description_minlength');

    return '';
  }

  getBudgetError(): string {
    if (!this.budgetCtrl.touched) return '';

    if (this.budgetCtrl.hasError('required')) return this.i18n.t('jobs.validation.budget_required');

    if (this.budgetCtrl.hasError('min')) return this.i18n.t('jobs.validation.budget_min');

    return '';
  }

  get formErrors(): string[] {
    const errors: string[] = [];

    const title = this.getTitleError();
    const desc = this.getDescriptionError();
    const budget = this.getBudgetError();

    if (title) errors.push(title);
    if (desc) errors.push(desc);
    if (budget) errors.push(budget);

    return errors;
  }

  private bootstrapCategories(): void {
    if (this.jobsService.categories().length > 0) {
      return;
    }

    this.jobsService.search({}).subscribe();
  }
}
