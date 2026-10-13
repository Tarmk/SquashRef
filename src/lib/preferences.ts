import { DEFAULT_TIE_BREAK, isTieBreak, type TieBreak } from './scoring';

// Referee preferences kept on this device. Storage can be unavailable (private
// windows, blocked site data), so every access falls back to the default.
const TIE_BREAK_KEY = 'squashref.tieBreak';

export function getTieBreak(): TieBreak {
  try {
    const stored = window.localStorage.getItem(TIE_BREAK_KEY);
    return isTieBreak(stored) ? stored : DEFAULT_TIE_BREAK;
  } catch {
    return DEFAULT_TIE_BREAK;
  }
}

export function setTieBreak(value: TieBreak): void {
  try {
    window.localStorage.setItem(TIE_BREAK_KEY, value);
  } catch {
    // Not saved; the default applies next time.
  }
}
