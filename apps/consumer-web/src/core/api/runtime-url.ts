export function getWebSocketBaseUrl() {
  const explicitWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (explicitWsUrl) return trimTrailingSlash(explicitWsUrl);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl?.startsWith('https://')) {
    return trimTrailingSlash(apiUrl.replace(/^https:\/\//, 'wss://'));
  }

  if (apiUrl?.startsWith('http://')) {
    return trimTrailingSlash(apiUrl.replace(/^http:\/\//, 'ws://'));
  }

  return 'ws://localhost:8000';
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}
