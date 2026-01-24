import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslation from '@/locales/en/translation.json'
import noTranslation from '@/locales/no/translation.json'

// Language preference stored separately (not part of the 3 main consolidated keys)
const LANGUAGE_STORAGE_KEY = 'vinyldeck_language'

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
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return stored ? normalizeLanguage(stored) : null
  } catch (error) {
    console.warn('Failed to read language from localStorage.', error)
    return null
  }
}

// eslint-disable-next-line import-x/no-named-as-default-member -- i18next default export is the configured instance used for chaining
void i18next.use(initReactI18next).init({
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
  i18next.on('languageChanged', (language) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(language))
    } catch (error) {
      console.warn('Failed to save language to localStorage.', error)
    }
  })
}

export default i18next
