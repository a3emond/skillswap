export function detectBrowserLang(): 'en' | 'fr' {

  const lang = navigator.language.toLowerCase()

  if (lang.startsWith('fr')) return 'fr'

  return 'en'
}