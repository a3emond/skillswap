import { Injectable, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Lang } from './i18n.types'
import { loadDictionary } from './i18n.loader'
import { detectBrowserLang } from './browser-lang.util'

@Injectable({ providedIn: 'root' })
export class I18nService {

  private lang = signal<Lang>('en')
  private dict = signal<any>({})

  constructor(private http: HttpClient) {}

  async init() {

    const stored = localStorage.getItem('lang') as Lang | null
    const lang = stored ?? detectBrowserLang()

    await this.setLang(lang)
  }

  async setLang(lang: Lang) {

    const dictionary = await loadDictionary(this.http, lang)

    this.lang.set(lang)
    this.dict.set(dictionary)

    localStorage.setItem('lang', lang)
  }

  currentLang() {
    return this.lang()
  }

  t(path: string): string {

    const parts = path.split('.')

    let value = this.dict()

    for (const p of parts) {
      value = value?.[p]
    }

    return value ?? path
  }

  error(key: string) {
    return this.t(`errors.${key}`)
  }

}