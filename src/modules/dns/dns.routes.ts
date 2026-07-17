import { Router } from 'express';
import { getPublicIPv6 } from '../../shared/network.utils.js';
import { getRecordId, updateRecordId, CloudflareConfig } from './dns.service.js';
import { logger } from '../../shared/logger.js';

const router = Router();

let syncInterval: NodeJS.Timeout | null = null;
let autoConfig: { token: string, zoneId: string, subdomains: string[] } | null = null;
let lastKnownIp: string | null = null;

// Core Engine function
async function executeDnsSync(token: string, zoneId: string, subdomains: string[]) {
  const currentIp = await getPublicIPv6();
  if (!currentIp) throw new Error('No IPv6 connectivity detected.');
  
  // Skip update if the IP hasn't changed (saves Cloudflare API limits)
  if (currentIp === lastKnownIp) return { ip: currentIp, updated: false };

  const config: CloudflareConfig = { token, zoneId };
  for (const sub of subdomains) {
    const recordId = await getRecordId(sub, config);
    if (recordId) {
      const success = await updateRecordId(sub, recordId, currentIp, config);
      if (success) logger.success(`Routed ${sub} -> ${currentIp}`, 'DNS');
    }
  }
  lastKnownIp = currentIp;
  return { ip: currentIp, updated: true };
}

// POST /api/dns/sync - Manual Sync
router.post('/sync', async (req, res) => {
  try {
    const { token, zoneId, subdomains } = req.body;
    if (!token || !zoneId || !subdomains) return res.status(400).json({ error: 'Missing credentials' });
    
    const result = await executeDnsSync(token, zoneId, subdomains);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dns/auto - Toggle Background Daemon
router.post('/auto', (req, res) => {
  const { action, token, zoneId, subdomains } = req.body;

  if (action === 'start') {
    if (!token || !zoneId) return res.status(400).json({ error: 'Credentials required for auto-loop' });
    autoConfig = { token, zoneId, subdomains };
    
    if (!syncInterval) {
      logger.info('Auto-DNS daemon engaged. Checking every 60s.', 'DNS');
      syncInterval = setInterval(() => {
        executeDnsSync(autoConfig!.token, autoConfig!.zoneId, autoConfig!.subdomains)
          .catch(err => logger.error('Background sync failed', 'DNS', err));
      }, 60000);
    }
    return res.json({ status: 'running' });
  } 
  
  if (action === 'stop') {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = null;
    autoConfig = null;
    logger.warn('Auto-DNS daemon disengaged.', 'DNS');
    return res.json({ status: 'stopped' });
  }

  res.json({ status: syncInterval ? 'running' : 'stopped' });
});

export default router;
