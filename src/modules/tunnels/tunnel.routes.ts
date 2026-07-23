import { Router } from 'express';
// Crucial: Import from your specific frp.manager.js file
import { tunnelManager } from './frp.manager.js';

const router = Router();

router.get('/status', (req, res) => res.json(tunnelManager.status()));

router.post('/start', (req, res) => {
  const { mode, customIp, port } = req.body;
  if (!port) return res.status(400).json({ error: 'Port required' });
  
  const targetIp = mode === 'device' ? 'localhost' : customIp;
  const success = tunnelManager.start(targetIp, port);
  res.json({ success, ...tunnelManager.status() });
});

router.post('/stop', (req, res) => {
  const success = tunnelManager.stop();
  res.json({ success, ...tunnelManager.status() });
});

export default router;
