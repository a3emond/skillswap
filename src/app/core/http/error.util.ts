import { HttpErrorResponse } from '@angular/common/http'
import { ApiError } from './api-error.model'

export function normalizeError(error: HttpErrorResponse): ApiError {
  let message = 'Unexpected error'

  if (error.status === 0) {
    message = 'Network error'
  } else if (typeof error.error === 'string' && error.error.trim()) {
    message = error.error
  } else if (
    error.error &&
    typeof error.error === 'object' &&
    'error' in error.error &&
    typeof error.error.error === 'string'
  ) {
    message = error.error.error
  } else if (error.message) {
    message = error.message
  }

  return {
    status: error.status,
    message,
    raw: error.error
  }
}