/**
 * Squash scoring rules (point-a-rally to 11).
 *
 * - Every rally scores a point, whoever served.
 * - A game is won at 11 with a two-point lead (the WSF/PSA rule). Some club and
 *   school events cap games at 15 to keep to time; the referee picks which on
 *   the match format screen (see TieBreak).
 * - The server keeps serving while they win rallies, switching sides each time.
 * - If the receiver wins the rally ("hand-out") they become the server and may
 *   choose which side to serve from.
 */

export type Side = 'left' | 'right';
export type MatchFormat = 'best-of-3' | 'best-of-5';

export const POINTS_PER_GAME = 11;
export const POINT_CAP = 15;

/** What happens at 10-10: play on until someone leads by two (official), or first to 15 wins. */
export type TieBreak = 'win-by-two' | 'cap-15';
export const DEFAULT_TIE_BREAK: TieBreak = 'win-by-two';

export function isTieBreak(value: unknown): value is TieBreak {
  return value === 'win-by-two' || value === 'cap-15';
}

/** The score at which a game ends regardless of the margin. */
export function capFor(tieBreak: TieBreak): number {
  return tieBreak === 'cap-15' ? POINT_CAP : Infinity;
}

/** One-line description of the game rule, for the scoring screen and match reports. */
export function tieBreakRule(tieBreak: TieBreak): string {
  return tieBreak === 'cap-15'
    ? 'Games to 11, win by 2, first to 15 after 10-10'
    : 'Games to 11, win by 2 (no cap)';
}

export function gamesToWin(format: string): number {
  return format === 'best-of-3' ? 2 : 3;
}

export function isGameWon(score1: number, score2: number, pointsPerGame = POINTS_PER_GAME, cap = Infinity): boolean {
  const top = Math.max(score1, score2);
  return top >= cap || (top >= pointsPerGame && Math.abs(score1 - score2) >= 2);
}

export function isMatchWon(games1: number, games2: number, format: string): boolean {
  const needed = gamesToWin(format);
  return games1 >= needed || games2 >= needed;
}

export function otherSide(side: Side): Side {
  return side === 'left' ? 'right' : 'left';
}

export interface RallyState {
  player1: string;
  player2: string;
  server: string;
  servingSide: Side;
  score1: number;
  score2: number;
}

export interface RallyOutcome {
  score1: number;
  score2: number;
  /** The receiver won the rally, so the serve changes hands. */
  handout: boolean;
  /** Who serves next. */
  server: string;
  /**
   * Side for the next serve. `null` after a hand-out mid-game, because the new
   * server chooses their side.
   */
  servingSide: Side | null;
  gameWon: boolean;
  /** Winner of the game, if this rally ended it. */
  gameWinner: string | null;
}

/** Apply one rally won by `winner`. Pure: returns the new state, changes nothing. */
export function playRally(state: RallyState, winner: string, tieBreak: TieBreak = DEFAULT_TIE_BREAK): RallyOutcome {
  if (winner !== state.player1 && winner !== state.player2) {
    throw new Error(`${winner} is not playing in this match`);
  }
  const score1 = state.score1 + (winner === state.player1 ? 1 : 0);
  const score2 = state.score2 + (winner === state.player2 ? 1 : 0);
  const handout = winner !== state.server;
  const gameWon = isGameWon(score1, score2, POINTS_PER_GAME, capFor(tieBreak));
  return {
    score1,
    score2,
    handout,
    server: winner,
    // Server held: switch sides. Hand-out: the new server chooses (unless the game just ended).
    servingSide: handout ? null : otherSide(state.servingSide),
    gameWon,
    gameWinner: gameWon ? winner : null,
  };
}

/** "1:05" or "1:02:03". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

/** Escape text before putting it into the HTML of a printed transcript. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
