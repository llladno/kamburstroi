import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearToken, getToken } from '../lib/token';
import * as apiModule from '../lib/api';

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return { ...actual, api: { ...actual.api, post: vi.fn() } };
});

describe('useAuth', () => {
  beforeEach(() => {
    clearToken();
    vi.clearAllMocks();
    // useAuth's module-level `token` ref is only initialized once per module
    // instance; without this, a dynamic import() later in the file reuses
    // the cached instance from an earlier test instead of reading the
    // token freshly from localStorage.
    vi.resetModules();
  });

  it('stores the token on successful login', async () => {
    vi.mocked(apiModule.api.post).mockResolvedValue({ accessToken: 'abc123' });
    const { useAuth } = await import('./useAuth');
    const { login, isAuthenticated } = useAuth();

    await login('admin', 'secret');

    expect(getToken()).toBe('abc123');
    expect(isAuthenticated.value).toBe(true);
  });

  it('clears the token on logout', async () => {
    const { useAuth } = await import('./useAuth');
    const { login, logout, isAuthenticated } = useAuth();
    vi.mocked(apiModule.api.post).mockResolvedValue({ accessToken: 'abc123' });
    await login('admin', 'secret');

    logout();

    expect(getToken()).toBeNull();
    expect(isAuthenticated.value).toBe(false);
  });

  it('reflects an already-stored token as authenticated', async () => {
    const { setToken } = await import('../lib/token');
    setToken('preexisting');
    const { useAuth } = await import('./useAuth');

    expect(useAuth().isAuthenticated.value).toBe(true);
  });
});
