import { Router } from 'express';
import { tunnelManager } from './tunnel.manager.js';
import { proxyManager } from './proxy.manager.js';

const router = Router();

// --- 1. MASTER TUNNEL CONTROLS ---
router.get('/status', (req, res) => res.json(tunnelManager.status()));

router.post('/ignite', (req, res) => {
  const success = tunnelManager.ignite();
  res.json({ success, ...tunnelManager.status() });
});

router.post('/kill', (req, res) => {
  const success = tunnelManager.kill();
  res.json({ success, ...tunnelManager.status() });
});

// --- 2. DYNAMIC PROXY CONTROLS ---
router.get('/proxy/list', (req, res) => res.json(proxyManager.listActive()));

router.post('/proxy/mount', (req, res) => {
  const { name, port } = req.body;
  if (!name || !port) return res.status(400).json({ error: 'Name and port required.' });
  
  const url = proxyManager.mountApp(name, Number(port));
  res.json({ success: true, url });
});

router.post('/proxy/unmount', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required.' });

  proxyManager.unmountApp(name);
  res.json({ success: true });
});

export default router;
