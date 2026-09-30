import { describe, it, expect } from 'vitest';
import { resolveRedirect } from './guard';

describe('resolveRedirect', () => {
  it('redirects an unauthenticated visitor to /login', () => {
    expect(resolveRedirect(false, '/objects')).toBe('/login');
  });

  it('does not redirect an unauthenticated visitor already on /login', () => {
    expect(resolveRedirect(false, '/login')).toBeNull();
  });

  it('redirects an authenticated visitor away from /login', () => {
    expect(resolveRedirect(true, '/login')).toBe('/');
  });

  it('does not redirect an authenticated visitor elsewhere', () => {
    expect(resolveRedirect(true, '/objects')).toBeNull();
  });
});
