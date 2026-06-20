'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

const visitorStorageKey = 'larryAcademy_visitorId'

function getVisitorId() {
  const existing = window.localStorage.getItem(visitorStorageKey)
  if (existing) return existing

  const generated = typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`
  window.localStorage.setItem(visitorStorageKey, generated)
  return generated
}

export default function AnalyticsTracker() {
  const pathname = usePathname()
  const { status } = useSession()

  useEffect(() => {
    if (status !== 'unauthenticated') return
    if (!pathname || pathname.startsWith('/admin')) return

    const visitorId = getVisitorId()
    const query = window.location.search.replace(/^\?/, '')
    const path = query ? `${pathname}?${query}` : pathname

    const payload = JSON.stringify({ visitorId, path, referrer: document.referrer || null })
    const sent = navigator.sendBeacon?.(
      '/api/analytics/visitor',
      new Blob([payload], { type: 'application/json' })
    )

    if (!sent) {
      fetch('/api/analytics/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  }, [pathname, status])

  return null
}
