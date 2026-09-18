const AUTH_DETOUR_KEY = 'linka.door.auth-detour'

/** `/?replay` forces the Door to play even mid-detour. */
export const REPLAY_PARAM = 'replay'

/**
 * Navigation protection for one in-flight entrance — nothing more.
 *
 * The Door is LINKA's universal entrance. It is NOT a first-run tutorial, and
 * this flag must never be read as "this person has seen the Door, so skip it
 * from now on". A fresh, intentional visit to LINKA always begins at the Door.
 *
 * The flag exists for exactly one problem: when the Door sends an unauthenticated
 * visitor into the OTP flow, `VerifyScreen` returns them to `/` on success. Without
 * a marker, that internal redirect would replay the whole entrance in the middle
 * of signing in. So the flag is set only when an auth detour *begins*, and is
 * cleared the moment `/` is re-entered — it survives one redirect and no longer.
 *
 * Consequences of that scoping, all intended:
 *   - an authenticated visitor opening LINKA gets the Door, every time
 *   - a visitor who finishes onboarding and returns to `/` gets the Door again
 *   - only the single hop OTP -> `/` is protected
 */
export const doorSession = {
  /** Called as the Door hands an unauthenticated visitor to the OTP flow. */
  beginAuthDetour(): void {
    try {
      window.sessionStorage.setItem(AUTH_DETOUR_KEY, '1')
    } catch {
      // Private browsing can refuse storage. The cost is a replayed entrance,
      // never a broken sign-in.
    }
  },

  /** Is `/` being re-entered as the tail of an auth detour? */
  isReturningFromAuth(): boolean {
    try {
      return window.sessionStorage.getItem(AUTH_DETOUR_KEY) === '1'
    } catch {
      return false
    }
  },

  /** The flag has done its job after a single redirect. */
  clear(): void {
    try {
      window.sessionStorage.removeItem(AUTH_DETOUR_KEY)
    } catch {
      // Nothing to do.
    }
  },
}

/** True when the current URL asks for the entrance to play regardless. */
export function isReplayRequested(): boolean {
  try {
    return new URLSearchParams(window.location.search).has(REPLAY_PARAM)
  } catch {
    return false
  }
}
