'use client'

import { SessionProvider } from 'next-auth/react'
import { LanguageProvider } from '@/context/LanguageContext'
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker'
import type { Locale } from '@/lib/i18n'

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale: Locale
}) {
  return (
    <SessionProvider>
      <LanguageProvider initialLocale={initialLocale}>
        <AnalyticsTracker />
        {children}
      </LanguageProvider>
    </SessionProvider>
  )
}
