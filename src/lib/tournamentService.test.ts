import { describe, expect, it, vi } from 'vitest';

// The service imports the Firebase app; these tests only cover the pure helpers.
vi.mock('./firebase', () => ({ db: () => null }));

const { cleanPlayerName, publicName, registrationState, MAX_PLAYER_NAME } = await import('./tournamentService');

describe('registrationState', () => {
  const open = { status: 'registration', maxPlayers: 4 };

  it('is open while there is room', () => {
    expect(registrationState(open, 3, false)).toBe('open');
    expect(registrationState({ status: 'registration' }, 50, false)).toBe('open');
  });

  it('is full at capacity', () => {
    expect(registrationState(open, 4, false)).toBe('full');
  });

  it('reports joined before anything else', () => {
    expect(registrationState(open, 4, true)).toBe('joined');
  });

  it('is not open for drafts and closed once play has started', () => {
    expect(registrationState({ status: 'draft' }, 0, false)).toBe('not-open');
    expect(registrationState({ status: 'active' }, 0, false)).toBe('closed');
    expect(registrationState({ status: 'completed' }, 0, false)).toBe('closed');
  });
});

describe('cleanPlayerName', () => {
  it('trims and collapses whitespace', () => {
    expect(cleanPlayerName('  Nour   El  Sherbini ')).toBe('Nour El Sherbini');
  });

  it('caps the length to what the rules accept', () => {
    expect(cleanPlayerName('x'.repeat(100))).toHaveLength(MAX_PLAYER_NAME);
  });

  it('returns an empty string for blank input', () => {
    expect(cleanPlayerName('   ')).toBe('');
  });
});

describe('publicName', () => {
  it('uses the display name and never the email', () => {
    expect(publicName({ displayName: 'Tarm' })).toBe('Tarm');
    expect(publicName({ displayName: null })).toBe('Host');
    expect(publicName({ displayName: '  ' }, 'Player')).toBe('Player');
  });
});
