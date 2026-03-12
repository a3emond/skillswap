import { Component, DestroyRef, inject, signal } from '@angular/core'
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { finalize } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

import { AuthService } from '../../../core/services/auth.service'
import { I18nService } from '../../../core/i18n/i18n.service'
import { TranslatePipe } from '../../../core/i18n/translate.pipe'

import { ApiError } from '../../../core/http/api-error.model'

import { passwordMatchValidator } from '../../../shared/forms/validators/password-match.validator'

import { AlertError } from '../../../shared/components/alert-error/alert-error'
import { AlertSuccess } from '../../../shared/components/alert-success/alert-success'
import { Spinner } from '../../../shared/components/spinner/spinner'
import { FieldError } from '../../../shared/forms/field-error/field-error'
import { FormErrorSummary } from '../../../shared/forms/form-error-summary/form-error-summary'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    AlertError,
    AlertSuccess,
    Spinner,
    FieldError,
    FormErrorSummary
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  private fb = inject(NonNullableFormBuilder)
  private authService = inject(AuthService)
  private i18n = inject(I18nService)
  private router = inject(Router)
  private destroyRef = inject(DestroyRef)

  readonly loading = signal(false)
  readonly apiErrorMessage = signal('')
  readonly successMessage = signal('')
  readonly suggestedUsername = signal<string | null>(null)

  readonly showPassword = signal(false)
  readonly showConfirmPassword = signal(false)

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    bio: ['', [Validators.required, Validators.minLength(10)]],
    skills: ['', [Validators.required]]
  }, {
    validators: passwordMatchValidator
  })

  submit(): void {

    this.apiErrorMessage.set('')
    this.successMessage.set('')
    this.suggestedUsername.set(null)

    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    this.loading.set(true)

    const raw = this.form.getRawValue()

    const dto = {
      name: raw.name,
      username: raw.username,
      email: raw.email,
      password: raw.password,
      bio: raw.bio,
      skills: raw.skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    }

    this.authService.register(dto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({

        next: res => {

          this.successMessage.set(res.message)

          setTimeout(() => {
            void this.router.navigate(['/login'])
          }, 1200)

        },

        error: (error: ApiError) => {

          console.log(error)

          if (
            error.raw &&
            typeof error.raw === 'object' &&
            'suggested_username' in error.raw
          ) {
            this.suggestedUsername.set(
              (error.raw as any).suggested_username
            )
          }

          this.apiErrorMessage.set(
            this.i18n.error(error.message)
          )

        }

      })
  }

  applySuggestedUsername(): void {

    const suggestion = this.suggestedUsername()

    if (!suggestion) return

    this.form.controls.username.setValue(suggestion)
    this.suggestedUsername.set(null)
  }

  togglePassword(): void {
    this.showPassword.update(v => !v)
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v)
  }

  get formErrors(): string[] {

    const errors: string[] = []

    const map = [
      this.getNameError(),
      this.getUsernameError(),
      this.getEmailError(),
      this.getPasswordError(),
      this.getConfirmPasswordError(),
      this.getBioError(),
      this.getSkillsError()
    ]

    for (const e of map) {
      if (e) errors.push(e)
    }

    return errors
  }

  getNameError(): string {

    const c = this.form.controls.name

    if (!c.touched) return ''

    if (c.hasError('required'))
      return this.i18n.t('auth.validation.name_required')

    if (c.hasError('minlength'))
      return this.i18n.t('auth.validation.name_minlength')

    return ''
  }

  getUsernameError(): string {

    const c = this.form.controls.username

    if (!c.touched) return ''

    if (c.hasError('required'))
      return this.i18n.t('auth.validation.username_required')

    if (c.hasError('minlength'))
      return this.i18n.t('auth.validation.username_minlength')

    return ''
  }

  getEmailError(): string {

    const c = this.form.controls.email

    if (!c.touched) return ''

    if (c.hasError('required'))
      return this.i18n.t('auth.validation.email_required')

    if (c.hasError('email'))
      return this.i18n.t('auth.validation.email_invalid')

    return ''
  }

  getPasswordError(): string {

    const c = this.form.controls.password

    if (!c.touched) return ''

    if (c.hasError('required'))
      return this.i18n.t('auth.validation.password_required')

    if (c.hasError('minlength'))
      return this.i18n.t('auth.validation.password_minlength')

    return ''
  }

  getConfirmPasswordError(): string {

    const c = this.form.controls.confirmPassword

    if (!c.touched) return ''

    if (c.hasError('required'))
      return this.i18n.t('auth.validation.confirm_password_required')

    if (this.form.hasError('passwordMismatch'))
      return this.i18n.t('auth.validation.password_mismatch')

    return ''
  }

  getBioError(): string {

    const c = this.form.controls.bio

    if (!c.touched) return ''

    if (c.hasError('required'))
      return this.i18n.t('auth.validation.bio_required')

    if (c.hasError('minlength'))
      return this.i18n.t('auth.validation.bio_minlength')

    return ''
  }

  getSkillsError(): string {

    const c = this.form.controls.skills

    if (!c.touched) return ''

    if (c.hasError('required'))
      return this.i18n.t('auth.validation.skills_required')

    return ''
  }

}