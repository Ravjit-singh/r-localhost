import { Router } from 'express';
import { rcloudManager } from './rcloud.manager.js';

const router = Router();

router.get('/status', (req, res) => {
  res.json({ status: rcloudManager.status() });
});

router.post('/start', (req, res) => {
  const success = rcloudManager.start();
  res.json({ success, status: rcloudManager.status() });
});

router.post('/stop', (req, res) => {
  const success = rcloudManager.stop();
  res.json({ success, status: rcloudManager.status() });
});

export default router;
