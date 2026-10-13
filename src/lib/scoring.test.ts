import { describe, expect, it } from 'vitest';
import { escapeHtml, formatDuration, gamesToWin, isGameWon, isMatchWon, playRally, type RallyState } from './scoring';

const start: RallyState = { player1: 'Ana', player2: 'Ben', server: 'Ana', servingSide: 'right', score1: 0, score2: 0 };

describe('isGameWon', () => {
  it('needs 11 points and a two-point lead', () => {
    expect(isGameWon(11, 9)).toBe(true);
    expect(isGameWon(11, 10)).toBe(false);
    expect(isGameWon(10, 8)).toBe(false);
    expect(isGameWon(12, 10)).toBe(true);
    expect(isGameWon(9, 11)).toBe(true);
  });

  it('is capped at 15 after 10-10 (the rule shown on the scoring screen)', () => {
    expect(isGameWon(14, 13)).toBe(false);
    expect(isGameWon(15, 14)).toBe(true);
    expect(isGameWon(14, 15)).toBe(true);
  });

  it('can play to two clear with no cap', () => {
    expect(isGameWon(15, 14, 11, Infinity)).toBe(false);
    expect(isGameWon(16, 14, 11, Infinity)).toBe(true);
  });
});

describe('matches', () => {
  it('best of 3 needs 2 games, best of 5 needs 3', () => {
    expect(gamesToWin('best-of-3')).toBe(2);
    expect(gamesToWin('best-of-5')).toBe(3);
    expect(isMatchWon(2, 1, 'best-of-3')).toBe(true);
    expect(isMatchWon(2, 1, 'best-of-5')).toBe(false);
    expect(isMatchWon(1, 3, 'best-of-5')).toBe(true);
  });
});

describe('playRally', () => {
  it('server wins: point to the server, server switches sides', () => {
    const out = playRally(start, 'Ana');
    expect(out).toMatchObject({ score1: 1, score2: 0, handout: false, server: 'Ana', servingSide: 'left', gameWon: false });
  });

  it('receiver wins: point to the receiver, hand-out, new server picks a side', () => {
    const out = playRally(start, 'Ben');
    expect(out).toMatchObject({ score1: 0, score2: 1, handout: true, server: 'Ben', servingSide: null });
  });

  it('reports the game winner on the deciding rally', () => {
    const out = playRally({ ...start, score1: 10, score2: 9 }, 'Ana');
    expect(out).toMatchObject({ gameWon: true, gameWinner: 'Ana', score1: 11 });
    const handoutWin = playRally({ ...start, score1: 9, score2: 10 }, 'Ben');
    expect(handoutWin).toMatchObject({ gameWon: true, gameWinner: 'Ben', handout: true });
  });

  it('does not change the state it was given', () => {
    const state = { ...start };
    playRally(state, 'Ben');
    expect(state).toEqual(start);
  });

  it('rejects someone who is not playing', () => {
    expect(() => playRally(start, 'Cat')).toThrow();
  });

  it('a whole game played out alternates sides only while the server holds', () => {
    let state = { ...start };
    const sides: (string | null)[] = [];
    for (const winner of ['Ana', 'Ana', 'Ben', 'Ben']) {
      const out = playRally(state, winner);
      sides.push(out.servingSide);
      state = { ...state, score1: out.score1, score2: out.score2, server: out.server, servingSide: out.servingSide ?? 'right' };
    }
    expect(sides).toEqual(['left', 'right', null, 'left']);
  });
});

describe('formatDuration', () => {
  it('formats minutes and hours', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3723)).toBe('1:02:03');
  });
});

describe('escapeHtml', () => {
  it('neutralises markup in player names', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(escapeHtml("O'Brien & Co")).toBe('O&#39;Brien &amp; Co');
  });
});
