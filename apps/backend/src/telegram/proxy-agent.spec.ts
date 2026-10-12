import { getTelegramClientOptions } from './proxy-agent';

describe('getTelegramClientOptions', () => {
  const originalEnv = process.env.TELEGRAM_PROXY_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.TELEGRAM_PROXY_URL;
    } else {
      process.env.TELEGRAM_PROXY_URL = originalEnv;
    }
  });

  it('returns undefined when TELEGRAM_PROXY_URL is not set', () => {
    delete process.env.TELEGRAM_PROXY_URL;
    expect(getTelegramClientOptions()).toBeUndefined();
  });

  it('returns client options with a proxy agent when TELEGRAM_PROXY_URL is set', () => {
    process.env.TELEGRAM_PROXY_URL = 'http://telegram-proxy:1080';
    const options = getTelegramClientOptions();
    expect(options?.baseFetchConfig?.agent).toBeDefined();
  });
});
