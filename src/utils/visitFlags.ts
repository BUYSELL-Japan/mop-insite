/**
 * "Already seen" flags kept in localStorage (2026-11-18).
 * Reads and writes never throw: private windows or blocked storage just behave like a first visit.
 */
export const WELCOME_SHOWN_KEY = 'mop_welcome_shown';
export const SPLASH_SHOWN_KEY = 'mop_splash_shown';
// Earlier versions stored the welcome flag as hasSeenWelcome = "true" (useLocalStorage)
const LEGACY_WELCOME_KEY = 'hasSeenWelcome';

export function hasFlag(key: string): boolean {
  try {
    if (localStorage.getItem(key) === '1') return true;
    return key === WELCOME_SHOWN_KEY && localStorage.getItem(LEGACY_WELCOME_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setFlag(key: string): void {
  try {
    localStorage.setItem(key, '1');
  } catch {
    // storage unavailable: the dialog / splash simply shows again next time
  }
}
