import { Router } from 'express';
import { mcManager } from './mc.manager.js';

const router = Router();

// GET /api/server/status
router.get('/status', (req, res) => {
  res.json({ status: mcManager.status() });
});

// POST /api/server/start
router.post('/start', (req, res) => {
  const success = mcManager.start();
  res.json({ success, status: mcManager.status() });
});

// POST /api/server/stop
router.post('/stop', (req, res) => {
  const success = mcManager.stop();
  res.json({ success, status: mcManager.status() });
});

export default router;
