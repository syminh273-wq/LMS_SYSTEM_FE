export function getWebSocketBaseUrl() {
  const explicitWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (explicitWsUrl) {
    return upgradeToWssIfNeeded(trimTrailingSlash(explicitWsUrl));
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl?.startsWith('https://')) {
    return trimTrailingSlash(apiUrl.replace(/^https:\/\//, 'wss://'));
  }

  if (apiUrl?.startsWith('http://')) {
    return upgradeToWssIfNeeded(trimTrailingSlash(apiUrl.replace(/^http:\/\//, 'ws://')));
  }

  return 'ws://localhost:8000';
}

function upgradeToWssIfNeeded(wsUrl: string): string {
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    wsUrl.startsWith('ws://')
  ) {
    return wsUrl.replace(/^ws:\/\//, 'wss://');
  }
  return wsUrl;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}
