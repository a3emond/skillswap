import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'

import { AuthStore } from '../auth/auth.store'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore)
  const router = inject(Router)

  const token = authStore.getToken()

  const request = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authStore.clearSession()

        void router.navigate(['/login'], {
          queryParams: {
            sessionExpired: 'true'
          }
        })
      }

      return throwError(() => error)
    })
  )
}