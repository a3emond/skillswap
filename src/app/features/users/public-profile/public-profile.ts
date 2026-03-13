import { Component, DestroyRef, inject, signal, Input } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { finalize } from 'rxjs'

import { UsersService } from '../../../core/services/users.service'
import { ApiError } from '../../../core/http/api-error.model'
import { User } from '../../../core/models/user.model'

import { DevLogger } from '../../../core/utils/dev-logger'

import { Modal } from '../../../shared/components/modal/modal'
import { Spinner } from '../../../shared/components/spinner/spinner'
import { AlertError } from '../../../shared/components/alert-error/alert-error'
import { RatingStars } from '../../../shared/components/rating-stars/rating-stars'

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [
    Modal,
    Spinner,
    AlertError,
    RatingStars
  ],
  templateUrl: './public-profile.html',
  styleUrl: './public-profile.scss'
})
export class PublicProfile {

  @Input({ required: true }) username!: string

  private usersService = inject(UsersService)
  private destroyRef = inject(DestroyRef)

  readonly loading = signal(true)
  readonly apiErrorMessage = signal('')
  readonly user = signal<User | null>(null)

  constructor() {

    DevLogger.log('[PublicProfile] component initialized')

  }

  ngOnInit() {

    DevLogger.group('[PublicProfile] load user')

    this.usersService.getByUsername(this.username)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false)
          DevLogger.log('[PublicProfile] request finalized')
        })
      )
      .subscribe({

        next: user => {

          DevLogger.log('[PublicProfile] user received', user)

          this.user.set(user)

          DevLogger.groupEnd()
        },

        error: (error: ApiError) => {

          DevLogger.error('[PublicProfile] ApiError', error)

          this.apiErrorMessage.set(error.message)

          DevLogger.groupEnd()
        }

      })
  }

}