import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { CommonModule } from '@angular/common'

import { TranslatePipe } from '../../core/i18n/translate.pipe'
import { I18nService } from '../../core/i18n/i18n.service'
import { ThemeService } from '../../core/theme/theme.service'

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

  menuOpen = false

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
    this.i18n.setLang(next)
  }

  toggleTheme() {
    this.theme.toggle()
  }

}