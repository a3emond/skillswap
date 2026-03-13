import { Component, inject, effect, computed } from '@angular/core'
import { RouterLink } from '@angular/router'
import { CommonModule } from '@angular/common'

import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { I18nService } from '../../core/i18n/i18n.service'
import { ThemeService } from '../../core/theme/theme.service'
import { AuthStore } from '../../core/auth/auth.store'
import { NavbarStore } from '../../core/navbar/navbar.store'
import { DevLogger } from '../../core/utils/dev-logger'

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

    /**
     * Observe authentication state changes
     */
    effect(() => {

      const authState = this.authenticated()

      DevLogger.log('[Navbar] auth state changed', authState)

      if (authState) {
        DevLogger.log('[Navbar] refreshing navbar counters')
        this.navbarStore.refresh()
      } else {
        DevLogger.log('[Navbar] resetting navbar counters')
        this.navbarStore.reset()
        this.menuOpen = false
      }

    })

    this.syncThemeIcon()
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen
    DevLogger.log('[Navbar] menu toggled', this.menuOpen)
  }

  closeMenu() {
    this.menuOpen = false
  }

  currentLang() {
    return this.i18n.currentLang()
  }

  toggleLang() {

    const current = this.i18n.currentLang()
    const next = current === 'en' ? 'fr' : 'en'

    DevLogger.log('[Navbar] language change', {
      from: current,
      to: next
    })

    void this.i18n.setLang(next)
  }

  toggleTheme() {

    DevLogger.log('[Navbar] theme toggle requested')

    this.theme.toggle()
    this.syncThemeIcon()

    DevLogger.log('[Navbar] theme icon synced', this.themeIcon)
  }

  private syncThemeIcon() {

    const currentTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    this.themeIcon = currentTheme === 'dark' ? 'fa-sun' : 'fa-moon'

    DevLogger.log('[Navbar] theme detected', currentTheme)
  }

  logout() {

    DevLogger.warn('[Navbar] logout triggered')

    this.auth.clearSession()
    this.closeMenu()
  }

}