import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { PlatformService } from '../../../core/services/platform.service';
import { PlatformStatsDto } from '../../../core/models/dto/platform-stats.dto';
import { ApiError } from '../../../core/http/api-error.model';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { DevLogger } from '../../../core/utils/dev-logger';
import { ScientificPipe } from '../../../core/utils/scientific-number.pipe';

import { Spinner } from '../../../shared/components/spinner/spinner';
import { AlertError } from '../../../shared/components/alert-error/alert-error';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [Spinner, AlertError, TranslatePipe, ScientificPipe],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class Stats {
  private platformService = inject(PlatformService);
  private i18n = inject(I18nService);
  private destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly apiErrorMessage = signal('');
  readonly stats = signal<PlatformStatsDto | null>(null);

  constructor() {
    DevLogger.log('[Stats] component initialized');
    this.loadStats();
  }

  private loadStats(): void {
    DevLogger.group('[Stats] load stats');

    this.platformService
      .getStats()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
          DevLogger.log('[Stats] request finalized');
        }),
      )
      .subscribe({
        next: (stats) => {
          DevLogger.log('[Stats] stats received', stats);
          this.stats.set(stats);
          DevLogger.groupEnd();
        },

        error: (error: ApiError) => {
          DevLogger.error('[Stats] ApiError', error);
          this.apiErrorMessage.set(this.i18n.error(error.message));
          DevLogger.groupEnd();
        },
      });
  }
}
