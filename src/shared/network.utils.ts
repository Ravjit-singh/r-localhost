import { logger } from './logger.js';

/**
 * Fetches the current public IPv6 address of the host machine.
 * Returns null if no global IPv6 routing interface is detected.
 */
export async function getPublicIPv6(): Promise<string | null> {
  try {
    const res = await fetch('https://api64.ipify.org?format=json');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const data = (await res.json()) as { ip: string };
    return data.ip;
  } catch (error) {
    logger.error('Failed to resolve public IPv6 address', 'NETWORK');
    return null;
  }
}
