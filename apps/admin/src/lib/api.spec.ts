import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError, setUnauthorizedHandler } from './api';
import { setToken, clearToken } from './token';

describe('api', () => {
  beforeEach(() => {
    clearToken();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setUnauthorizedHandler(null);
  });

  it('sends no Authorization header when there is no token', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await api.get('/settings');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.has('Authorization')).toBe(false);
  });

  it('adds a Bearer Authorization header when a token is stored', async () => {
    setToken('test-token');
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await api.get('/admin/leads');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('throws ApiError with the backend message on a non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Неверный логин или пароль' }), { status: 401 }),
    );

    await expect(api.post('/admin/auth/login', { login: 'x', password: 'y' })).rejects.toMatchObject(
      { status: 401, message: 'Неверный логин или пароль' } satisfies Partial<ApiError>,
    );
  });

  it('calls the unauthorized handler on a 401 response', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 401 }));

    await expect(api.get('/admin/leads')).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('sends a FormData upload without a JSON Content-Type header', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ url: 'http://x/y.webp' }), { status: 200 }),
    );
    const file = new File(['data'], 'photo.png', { type: 'image/png' });

    const result = await api.upload<{ url: string }>('/admin/uploads', file);

    expect(result.url).toBe('http://x/y.webp');
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.has('Content-Type')).toBe(false);
    expect(init?.body).toBeInstanceOf(FormData);
  });
});
