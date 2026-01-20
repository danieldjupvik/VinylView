import { NO, US } from 'country-flag-icons/react/3x2'
import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

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

interface LanguageToggleProps {
  className?: string
}

function LanguageFlag({
  lang,
  className
}: {
  lang: 'en' | 'no'
  className?: string
}) {
  const FlagComponent = lang === 'no' ? NO : US

  return (
    <span
      className={cn(
        'ring-border/50 flex size-4 items-center justify-center overflow-hidden rounded-full ring-1',
        className
      )}
      aria-hidden="true"
    >
      <FlagComponent className="h-full w-full" />
    </span>
  )
}

export function LanguageToggle({
  className
}: LanguageToggleProps): React.JSX.Element {
  const { i18n, t } = useTranslation()
  const currentLanguage = normalizeLanguage(
    i18n.resolvedLanguage ?? i18n.language ?? 'en'
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('', className)}
          aria-label={t('language.label')}
        >
          <Languages className="h-5 w-5" />
          <span className="sr-only">{t('language.label')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={currentLanguage}
          onValueChange={(value) => {
            void i18n.changeLanguage(value)
          }}
        >
          <DropdownMenuRadioItem value="en">
            <span className="flex items-center gap-2">
              <LanguageFlag lang="en" />
              <span>{t('language.english')}</span>
            </span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="no">
            <span className="flex items-center gap-2">
              <LanguageFlag lang="no" />
              <span>{t('language.norwegian')}</span>
            </span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
