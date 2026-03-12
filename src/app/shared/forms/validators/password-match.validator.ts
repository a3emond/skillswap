import { AbstractControl, ValidationErrors } from '@angular/forms'

export function passwordMatchValidator(
  group: AbstractControl
): ValidationErrors | null {

  const password = group.get('password')?.value
  const confirm = group.get('confirmPassword')?.value

  if (!password || !confirm) return null

  return password === confirm
    ? null
    : { passwordMismatch: true }

}