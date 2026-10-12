import { HttpsProxyAgent } from 'https-proxy-agent';
import type { ApiClientOptions } from 'grammy';

export function getTelegramClientOptions(): ApiClientOptions | undefined {
  const proxyUrl = process.env.TELEGRAM_PROXY_URL;
  if (!proxyUrl) return undefined;
  return { baseFetchConfig: { agent: new HttpsProxyAgent(proxyUrl) } };
}
