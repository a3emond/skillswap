import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { Lang } from './i18n.types'

export async function loadDictionary(
  http: HttpClient,
  lang: Lang
) {
  return await firstValueFrom(
    http.get(`/assets/i18n/${lang}.json`)
  )
}