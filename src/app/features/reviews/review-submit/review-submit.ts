import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ReviewsService } from '../../../core/services/reviews.service';
import { ReviewCreateDto } from '../../../core/models/dto/review-create.dto';
import { ApiError } from '../../../core/http/api-error.model';
import { DevLogger } from '../../../core/utils/dev-logger';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { Modal } from '../../../shared/components/modal/modal';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { AlertError } from '../../../shared/components/alert-error/alert-error';
import { FieldError } from '../../../shared/forms/field-error/field-error';
import { FormErrorSummary } from '../../../shared/forms/form-error-summary/form-error-summary';

@Component({
  selector: 'app-review-submit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    Modal,
    Spinner,
    AlertError,
    FieldError,
    FormErrorSummary,
  ],
  templateUrl: './review-submit.html',
  styleUrl: './review-submit.scss',
})
export class ReviewSubmit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly reviewsService = inject(ReviewsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) jobId!: number;
  @Input({ required: true }) targetId!: number;
  @Input() targetLabel = '';

  @Output() submitted = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  readonly loading = signal(false);
  readonly apiErrorMessage = signal('');

  readonly form = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    message: [''],
  });

  readonly submitDisabled = computed(() => this.loading() || this.form.invalid);

  submit(): void {
    DevLogger.group('[ReviewSubmit] submit');

    this.apiErrorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      DevLogger.groupEnd();
      return;
    }

    const raw = this.form.getRawValue();

    const dto: ReviewCreateDto = {
      target_id: this.targetId,
      rating: raw.rating,
      message: raw.message || undefined,
    };

    this.loading.set(true);

    this.reviewsService
      .create(this.jobId, dto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.submitted.emit();
        },
        error: (error: ApiError) => {
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.error('[ReviewSubmit] submit failed', error);
        },
      });

    DevLogger.groupEnd();
  }

  get ratingCtrl() {
    return this.form.controls.rating;
  }

  getRatingError(): string {
    if (!this.ratingCtrl.touched) {
      return '';
    }

    if (this.ratingCtrl.hasError('required')) {
      return this.i18n.t('reviews.validation.rating_required');
    }

    if (this.ratingCtrl.hasError('min') || this.ratingCtrl.hasError('max')) {
      return this.i18n.t('reviews.validation.rating_range');
    }

    return '';
  }

  get formErrors(): string[] {
    const errors: string[] = [];

    const ratingError = this.getRatingError();

    if (ratingError) {
      errors.push(ratingError);
    }

    return errors;
  }

  closeModal(): void {
    this.close.emit();
  }
}
