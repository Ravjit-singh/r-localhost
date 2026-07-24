import { Router } from 'express';
import { rcloudManager } from '../rcloud/rcloud.manager.js';
import { mcManager } from '../server/mc.manager.js';

const router = Router();

router.get('/modules', (req, res) => {
  res.json({
    rcloudAvailable: Boolean(process.env.RCLOUD_DIR),
    mcAvailable: Boolean(process.env.MC_DIR),
    rcloudStatus: rcloudManager.status(),
    mcStatus: mcManager.status()
  });
});

export default router;
