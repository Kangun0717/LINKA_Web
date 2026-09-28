import { useEffect, useState } from 'react'

import { fetchAuthCapabilities, type Identity } from '@/features/auth/api'

export type IdentityMethod = Identity['kind']

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/

/** Email lower-cased; phone reduced to E.164 (`+819012345678`). */
export function toIdentity(method: IdentityMethod, raw: string): Identity | null {
  if (method === 'email') {
    const email = raw.trim().toLowerCase()
    return EMAIL_PATTERN.test(email) ? { kind: 'email', email } : null
  }

  const phone = raw.replace(/[\s\-().]/g, '')
  return PHONE_PATTERN.test(phone) ? { kind: 'phone', phone } : null
}

/** Whether the project has an SMS provider switched on. `null` while asking. */
export function usePhoneAvailable(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    void fetchAuthCapabilities().then(({ phone }) => {
      if (active) setAvailable(phone)
    })
    return () => {
      active = false
    }
  }, [])

  return available
}
