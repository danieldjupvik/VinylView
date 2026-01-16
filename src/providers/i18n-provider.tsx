import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslation from '@/locales/en/translation.json'
import noTranslation from '@/locales/no/translation.json'

const detectLanguage = () => {
  if (typeof navigator === 'undefined') return 'en'
  const candidate =
    (navigator.languages && navigator.languages[0]) ||
    navigator.language ||
    'en'
  const normalized = candidate.toLowerCase()
  if (
    normalized.startsWith('no') ||
    normalized.startsWith('nb') ||
    normalized.startsWith('nn')
  ) {
    return 'no'
  }
  return 'en'
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
  lng: detectLanguage(),
  supportedLngs: ['en', 'no'],
  nonExplicitSupportedLngs: true,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
})

export default i18n
