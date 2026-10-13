import { describe, expect, it } from 'vitest';
import { monradFirstRound, roundCount, roundRobin, seededRandom, shuffle } from './schedule';

function pairKey(a: string, b: string) {
  return [a, b].sort().join('-');
}

describe('roundRobin', () => {
  for (const n of [2, 3, 4, 5, 6, 7, 8]) {
    it(`${n} players: everyone meets once, nobody plays twice in a round`, () => {
      const players = Array.from({ length: n }, (_, i) => `P${i + 1}`);
      const fixtures = roundRobin(players);
      expect(fixtures).toHaveLength((n * (n - 1)) / 2);

      const pairs = new Set(fixtures.map((f) => pairKey(f.player1, f.player2)));
      expect(pairs.size).toBe(fixtures.length);

      const rounds = new Map<number, string[]>();
      for (const f of fixtures) rounds.set(f.round, [...(rounds.get(f.round) ?? []), f.player1, f.player2]);
      for (const inRound of rounds.values()) expect(new Set(inRound).size).toBe(inRound.length);
      expect(rounds.size).toBe(roundCount('round-robin', n));
    });
  }

  it('returns nothing for fewer than two players', () => {
    expect(roundRobin([])).toEqual([]);
    expect(roundRobin(['Solo'])).toEqual([]);
  });
});

describe('monradFirstRound', () => {
  it('pairs everyone once; an odd player out gets a bye', () => {
    const fixtures = monradFirstRound(['A', 'B', 'C', 'D', 'E'], seededRandom('x'));
    expect(fixtures).toHaveLength(2);
    const seen = fixtures.flatMap((f) => [f.player1, f.player2]);
    expect(new Set(seen).size).toBe(4);
  });

  it('is reproducible with the same seed', () => {
    const players = ['A', 'B', 'C', 'D', 'E', 'F'];
    expect(monradFirstRound(players, seededRandom('abc'))).toEqual(monradFirstRound(players, seededRandom('abc')));
  });
});

describe('shuffle', () => {
  it('keeps every item and does not touch the input', () => {
    const items = [1, 2, 3, 4, 5];
    const out = shuffle(items, seededRandom('seed'));
    expect([...out].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it('is unbiased enough: each item lands first about equally often', () => {
    const random = seededRandom('fairness');
    const firsts = [0, 0, 0, 0];
    for (let i = 0; i < 8000; i++) firsts[shuffle([0, 1, 2, 3], random)[0]]++;
    for (const count of firsts) expect(count).toBeGreaterThan(1800);
  });
});
