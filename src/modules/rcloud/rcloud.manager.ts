import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';
import { proxyManager } from '../tunnels/proxy.manager.js';

let rcloudProcess: ChildProcess | null = null;

const RCLOUD_DIR = process.env.RCLOUD_DIR;
const RCLOUD_PORT = Number(process.env.RCLOUD_PORT) || 3000;

export const rcloudManager = {
  start: (): boolean => {
    if (rcloudProcess) return false;
    if (!RCLOUD_DIR) {
      logger.error('RCLOUD_DIR not specified in .env', 'RCLOUD');
      return false;
    }

    try {
      logger.info('Igniting RCloud Storage Engine...', 'RCLOUD');
      
      rcloudProcess = spawn('npm start', {
        cwd: RCLOUD_DIR,
        shell: true
      });

      // Minimalist Clean Log
      setTimeout(() => {
        if (rcloudProcess) logger.success(`RCloud active on Port ${RCLOUD_PORT}`, 'RCLOUD');
      }, 1500);

      proxyManager.mountApp('cloud', RCLOUD_PORT);
      return true;
    } catch (error) {
      logger.error('Failed to boot RCloud', 'RCLOUD', error);
      return false;
    }
  },

  stop: (): boolean => {
    if (rcloudProcess) {
      rcloudProcess.kill('SIGINT');
      rcloudProcess = null;
      proxyManager.unmountApp('cloud');
      logger.success('RCloud engine halted.', 'RCLOUD');
      return true;
    }
    return false;
  },

  status: () => ({
    running: rcloudProcess !== null,
    port: RCLOUD_PORT
  })
};
