import { logger } from '../../shared/logger.js';

export interface CloudflareConfig {
  token: string;
  zoneId: string;
}

/**
 * Dynamically queries Cloudflare to retrieve the internal Record ID for a given AAAA record.
 */
export async function getRecordId(subdomain: string, config: CloudflareConfig): Promise<string | null> {
  try {
    const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records?name=${subdomain}&type=AAAA`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json() as any;
    
    if (data.success && data.result && data.result.length > 0) {
      return data.result[0].id;
    }
    
    logger.warn(`No pre-existing AAAA record found for ${subdomain}`, 'DNS');
    return null;
  } catch (error) {
    logger.error(`Failed querying Cloudflare API for ${subdomain}`, 'DNS', error);
    return null;
  }
}

/**
 * Performs a PATCH update to point a specific Record ID to a new public IPv6 address.
 */
export async function updateRecordId(
  subdomain: string, 
  recordId: string, 
  newIp: string, 
  config: CloudflareConfig
): Promise<boolean> {
  try {
    const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records/${recordId}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: newIp,
        type: 'AAAA',
        proxied: false, // Disables the HTTP proxy layer to support massive file sizes and UDP
        ttl: 1          // 1 represents 'Automatic' TTL
      })
    });

    const data = await res.json() as any;
    return !!data.success;
  } catch (error) {
    logger.error(`Critical network failure patching ${subdomain}`, 'DNS', error);
    return false;
  }
}
