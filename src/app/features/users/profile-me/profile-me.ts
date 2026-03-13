import { Component, DestroyRef, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { finalize } from 'rxjs'

import { UsersService } from '../../../core/services/users.service'
import { I18nService } from '../../../core/i18n/i18n.service'
import { ApiError } from '../../../core/http/api-error.model'
import { User } from '../../../core/models/user.model'
import { DevLogger } from '../../../core/utils/dev-logger'

import { Spinner } from '../../../shared/components/spinner/spinner'
import { AlertError } from '../../../shared/components/alert-error/alert-error'
import { EmptyState } from '../../../shared/components/empty-state/empty-state'
import { RatingStars } from '../../../shared/components/rating-stars/rating-stars'

@Component({
  selector: 'app-profile-me',
  standalone: true,
  imports: [
    Spinner,
    AlertError,
    EmptyState,
    RatingStars
  ],
  templateUrl: './profile-me.html',
  styleUrl: './profile-me.scss'
})
export class ProfileMe { //TODO: Center card in it's container

  private usersService = inject(UsersService)
  private i18n = inject(I18nService)
  private destroyRef = inject(DestroyRef)

  readonly loading = signal(true)
  readonly apiErrorMessage = signal('')
  readonly user = signal<User | null>(null)

  constructor() {

    DevLogger.log('[ProfileMe] component initialized')

    this.loadUser()
  }

  private loadUser(): void {

    DevLogger.group('[ProfileMe] load user')

    this.usersService.getMe()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          DevLogger.log('[ProfileMe] request finalized')
          this.loading.set(false)
        })
      )
      .subscribe({

        next: (user: User) => {

          DevLogger.log('[ProfileMe] user received', user)

          this.user.set(user)

          DevLogger.groupEnd()
        },

        error: (error: ApiError) => {

          DevLogger.error('[ProfileMe] ApiError', error)

          this.apiErrorMessage.set(
            this.i18n.error(error.message)
          )

          DevLogger.groupEnd()
        }

      })
  }

}