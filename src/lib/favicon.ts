import { parse } from 'url';

async function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function getFavicon(url: string): Promise<string> {
  try {
    const { protocol, host } = parse(url);
    console.log('protocol', protocol);
    if (!protocol || !host) {
      return '/images/default-favicon.png';
    }

    // Utiliser directement l'API Google Favicons
    return `https://s2.googleusercontent.com/s2/favicons?domain=${host}`;
  } catch (error) {
    console.error('Error getting favicon:', error);
    return '/images/default-favicon.png';
  }
} 