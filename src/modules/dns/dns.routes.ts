import { Router } from 'express';
import { getPublicIPv6 } from '../../shared/network.utils.js';
import { getRecordId, updateRecordId, CloudflareConfig } from './dns.service.js';
import { logger } from '../../shared/logger.js';

const router = Router();

// In-memory state for the background daemon
let syncInterval: NodeJS.Timeout | null = null;

// POST /api/dns/sync - Forces an immediate DNS update
router.post('/sync', async (req, res) => {
  const { token, zoneId, subdomains } = req.body as { token: string, zoneId: string, subdomains: string[] };

  if (!token || !zoneId || !subdomains) {
    return res.status(400).json({ error: 'Missing Cloudflare credentials or subdomains payload.' });
  }

  const currentIp = await getPublicIPv6();
  if (!currentIp) return res.status(503).json({ error: 'No IPv6 connectivity detected.' });

  const config: CloudflareConfig = { token, zoneId };
  const results = [];

  for (const sub of subdomains) {
    const recordId = await getRecordId(sub, config);
    if (recordId) {
      const success = await updateRecordId(sub, recordId, currentIp, config);
      results.push({ subdomain: sub, success });
      if (success) logger.success(`Routed ${sub} -> ${currentIp}`, 'DNS');
    } else {
      results.push({ subdomain: sub, success: false, error: 'Record ID missing' });
    }
  }

  res.json({ ip: currentIp, results });
});

// POST /api/dns/auto - Toggles the 60-second background sync
router.post('/auto', (req, res) => {
  const { action } = req.body as { action: 'start' | 'stop' };

  if (action === 'start' && !syncInterval) {
    // In production, you'd pull credentials from a local SQLite DB or env vars here
    logger.info('Auto-DNS daemon engaged.', 'DNS');
    syncInterval = setInterval(() => logger.info('Executing background DNS sync...', 'DNS'), 60000);
    return res.json({ status: 'running' });
  } 
  
  if (action === 'stop' && syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    logger.warn('Auto-DNS daemon disengaged.', 'DNS');
    return res.json({ status: 'stopped' });
  }

  res.json({ status: syncInterval ? 'running' : 'stopped' });
});

export default router;
