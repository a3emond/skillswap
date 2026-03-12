import { Component, inject, effect, computed } from '@angular/core'
import { RouterLink } from '@angular/router'
import { CommonModule } from '@angular/common'

import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { I18nService } from '../../core/i18n/i18n.service'
import { ThemeService } from '../../core/theme/theme.service'
import { AuthStore } from '../../core/auth/auth.store'
import { NavbarStore } from '../../core/navbar/navbar.store'

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {

  private i18n = inject(I18nService)
  private theme = inject(ThemeService)
  private auth = inject(AuthStore)
  private navbarStore = inject(NavbarStore)

  user = this.auth.user
  authenticated = this.auth.authenticated

  myJobsCount = this.navbarStore.myJobsCount
  myBidsCount = this.navbarStore.myBidsCount

  menuOpen = false
  themeIcon = 'fa-moon'

  hasNotifications = computed(() =>
    this.myJobsCount() > 0 || this.myBidsCount() > 0
  )

  constructor() {

    effect(() => {
      if (this.authenticated()) {
        this.navbarStore.refresh()
      } else {
        this.navbarStore.reset()
        this.menuOpen = false
      }
    })

    this.syncThemeIcon()
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen
  }

  closeMenu() {
    this.menuOpen = false
  }

  currentLang() {
    return this.i18n.currentLang()
  }

  toggleLang() {
    const next = this.i18n.currentLang() === 'en' ? 'fr' : 'en'
    void this.i18n.setLang(next)
  }

  toggleTheme() {
    this.theme.toggle()
    this.syncThemeIcon()
  }

  private syncThemeIcon() {
    const currentTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    this.themeIcon = currentTheme === 'dark' ? 'fa-sun' : 'fa-moon'
  }

  logout() {
    this.auth.clearSession()
    this.closeMenu()
  }

}