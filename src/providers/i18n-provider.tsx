import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslation from '@/locales/en/translation.json'
import noTranslation from '@/locales/no/translation.json'
import { STORAGE_KEYS } from '@/lib/constants'

const normalizeLanguage = (value: string) => {
  const normalized = value.toLowerCase()
  if (
    normalized.startsWith('no') ||
    normalized.startsWith('nb') ||
    normalized.startsWith('nn')
  ) {
    return 'no'
  }
  return 'en'
}

const detectLanguage = () => {
  if (typeof navigator === 'undefined') return 'en'
  const candidate =
    (navigator.languages && navigator.languages[0]) ||
    navigator.language ||
    'en'
  return normalizeLanguage(candidate)
}

const readStoredLanguage = () => {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE)
  return stored ? normalizeLanguage(stored) : null
}

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslation
    },
    no: {
      translation: noTranslation
    }
  },
  lng: readStoredLanguage() ?? detectLanguage(),
  supportedLngs: ['en', 'no'],
  nonExplicitSupportedLngs: true,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
})

if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (language) => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, normalizeLanguage(language))
  })
}

export default i18n
