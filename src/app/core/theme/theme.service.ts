import { Injectable, signal } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private theme = signal<'light' | 'dark'>('light') //TODO: add check browser preference as initital value

  constructor() {

    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null

    if (stored) {
      this.setTheme(stored)
    } else {
      this.setTheme('light')
    }

  }

  toggle() {
    const next = this.theme() === 'light' ? 'dark' : 'light'
    this.setTheme(next)
  }

  setTheme(theme: 'light' | 'dark') {

    this.theme.set(theme)

    document.documentElement.setAttribute('data-theme', theme)

    localStorage.setItem('theme', theme)

  }

}