export interface Fixture<P> {
  id: string;
  round: number;
  player1: P;
  player2: P;
  status: 'pending' | 'complete';
}

/**
 * Full round-robin schedule using the circle method: everyone plays everyone
 * once, and nobody plays twice in the same round. With an odd number of
 * players, one player sits out (has a bye) each round.
 */
export function roundRobin<P>(players: P[]): Fixture<P>[] {
  if (players.length < 2) return [];
  const seats: (P | null)[] = players.length % 2 ? [...players, null] : [...players];
  const n = seats.length;
  const fixtures: Fixture<P>[] = [];
  for (let round = 1; round < n; round++) {
    for (let i = 0; i < n / 2; i++) {
      const a = seats[i];
      const b = seats[n - 1 - i];
      if (a !== null && b !== null) {
        fixtures.push({ id: `r${round}-m${fixtures.length + 1}`, round, player1: a, player2: b, status: 'pending' });
      }
    }
    // Keep the first seat fixed and rotate everyone else one place.
    seats.splice(1, 0, seats.pop() as P | null);
  }
  return fixtures;
}

/** Fisher-Yates shuffle (an unbiased one, unlike sorting by a random number). */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** First Monrad round: random pairs. With an odd number of players, the last one has a bye. */
export function monradFirstRound<P>(players: P[], random: () => number = Math.random): Fixture<P>[] {
  const order = shuffle(players, random);
  const fixtures: Fixture<P>[] = [];
  for (let i = 0; i + 1 < order.length; i += 2) {
    fixtures.push({ id: `r1-m${i / 2 + 1}`, round: 1, player1: order[i], player2: order[i + 1], status: 'pending' });
  }
  return fixtures;
}

/** Rounds needed: n-1 (or n with a bye) for round robin, about log2(n) for Monrad. */
export function roundCount(format: string, players: number): number {
  if (players < 2) return 0;
  if (format === 'round-robin') return players % 2 ? players : players - 1;
  return Math.ceil(Math.log2(players));
}

/**
 * Deterministic random numbers from a string (mulberry32 seeded with a string hash).
 * Used so the server-rendered and the browser-rendered draw are the same.
 */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
