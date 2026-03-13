import { Component, DestroyRef, computed, inject, signal } from '@angular/core'
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { finalize } from 'rxjs'

import { AuthService } from '../../../core/services/auth.service'
import { AuthStore } from '../../../core/auth/auth.store'
import { NavbarStore } from '../../../core/navbar/navbar.store'

import { I18nService } from '../../../core/i18n/i18n.service'
import { TranslatePipe } from '../../../core/i18n/translate.pipe'

import { ApiError } from '../../../core/http/api-error.model'
import { DevLogger } from '../../../core/utils/dev-logger'

import { AlertError } from '../../../shared/components/alert-error/alert-error'
import { Spinner } from '../../../shared/components/spinner/spinner'
import { FieldError } from '../../../shared/forms/field-error/field-error'
import { FormErrorSummary } from '../../../shared/forms/form-error-summary/form-error-summary'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    AlertError,
    Spinner,
    FieldError,
    FormErrorSummary
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  private readonly fb = inject(NonNullableFormBuilder)
  private readonly authService = inject(AuthService)
  private readonly authStore = inject(AuthStore)
  private readonly navbarStore = inject(NavbarStore)
  private readonly i18n = inject(I18nService)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)

  readonly loading = signal(false)
  readonly apiErrorMessage = signal('')

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  })

  readonly submitDisabled = computed(() =>
    this.loading() || this.form.invalid
  )

  constructor() {

    DevLogger.log('[Login] component initialized')

    if (this.authStore.isAuthenticated()) {

      DevLogger.warn('[Login] already authenticated, redirecting')

      void this.router.navigate(['/jobs'])
    }
  }

  submit(): void {

    DevLogger.group('[Login] submit')

    this.apiErrorMessage.set('')

    if (this.form.invalid) {

      DevLogger.warn('[Login] form invalid', this.form.getRawValue())

      this.form.markAllAsTouched()
      DevLogger.groupEnd()
      return
    }

    const dto = this.form.getRawValue()

    DevLogger.log('[Login] DTO', dto)

    this.loading.set(true)

    this.authService.login(dto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {

          DevLogger.log('[Login] request finalized')
          this.loading.set(false)

        })
      )
      .subscribe({

        next: response => {

          DevLogger.group('[Login] success')

          DevLogger.log('[Login] response DTO', response)

          this.authStore.setSession(response.token, response.user)

          DevLogger.log('[Login] session stored')

          this.navbarStore.refresh()

          DevLogger.log('[Login] navbar refreshed')

          void this.router.navigate(['/jobs'])

          DevLogger.log('[Login] navigation → /jobs')

          DevLogger.groupEnd()
        },

        error: (error: ApiError) => {

          DevLogger.group('[Login] error')

          DevLogger.error('[Login] normalized ApiError', error)

          DevLogger.log('[Login] status', error.status)
          DevLogger.log('[Login] message', error.message)
          DevLogger.log('[Login] raw payload', error.raw)

          this.apiErrorMessage.set(this.i18n.error(error.message))

          DevLogger.groupEnd()
        }
      })

    DevLogger.groupEnd()
  }

  get emailCtrl() {
    return this.form.controls.email
  }

  get passwordCtrl() {
    return this.form.controls.password
  }

  getEmailError(): string {

    if (!this.emailCtrl.touched) {
      return ''
    }

    if (this.emailCtrl.hasError('required')) {
      return this.i18n.t('auth.validation.email_required')
    }

    if (this.emailCtrl.hasError('email')) {
      return this.i18n.t('auth.validation.email_invalid')
    }

    return ''
  }

  getPasswordError(): string {

    if (!this.passwordCtrl.touched) {
      return ''
    }

    if (this.passwordCtrl.hasError('required')) {
      return this.i18n.t('auth.validation.password_required')
    }

    if (this.passwordCtrl.hasError('minlength')) {
      return this.i18n.t('auth.validation.password_minlength')
    }

    return ''
  }

  get formErrors(): string[] {

    const errors: string[] = []

    const emailError = this.getEmailError()
    const passwordError = this.getPasswordError()

    if (emailError) {
      errors.push(emailError)
    }

    if (passwordError) {
      errors.push(passwordError)
    }

    return errors
  }

}