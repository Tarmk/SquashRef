import { describe, expect, it } from 'vitest';
import { loginHref, safeNext } from './redirect';

describe('safeNext', () => {
  it('keeps same-site paths', () => {
    expect(safeNext('/tournament/join/abc')).toBe('/tournament/join/abc');
  });

  it('falls back for missing, absolute and protocol-relative targets', () => {
    expect(safeNext(null)).toBe('/dashboard');
    expect(safeNext('')).toBe('/dashboard');
    expect(safeNext('https://evil.example')).toBe('/dashboard');
    expect(safeNext('//evil.example')).toBe('/dashboard');
    expect(safeNext('/\\evil.example')).toBe('/dashboard');
  });
});

describe('loginHref', () => {
  it('encodes the return path', () => {
    expect(loginHref('/tournament/join/a b')).toBe('/auth/login?next=%2Ftournament%2Fjoin%2Fa%20b');
    expect(loginHref('/x', 'signup')).toBe('/auth/signup?next=%2Fx');
  });
});
