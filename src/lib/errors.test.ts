import { describe, expect, it } from 'vitest';
import { authErrorMessage, errorCode, errorMessage } from './errors';

describe('error helpers', () => {
  it('maps Firebase auth codes to friendly text', () => {
    expect(authErrorMessage({ code: 'auth/invalid-credential' }, 'fallback')).toBe('Wrong email or password.');
    expect(authErrorMessage({ code: 'auth/email-already-in-use' }, 'fallback')).toMatch(/already exists/);
  });

  it('falls back for unknown codes and plain errors', () => {
    expect(authErrorMessage({ code: 'auth/something-new' }, 'fallback')).toBe('fallback');
    expect(authErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
    expect(authErrorMessage(undefined, 'fallback')).toBe('fallback');
  });

  it('reads codes and messages defensively', () => {
    expect(errorCode({ code: 'permission-denied' })).toBe('permission-denied');
    expect(errorCode('nope')).toBeUndefined();
    expect(errorMessage('plain string')).toBe('plain string');
    expect(errorMessage(42, 'fallback')).toBe('fallback');
  });
});
