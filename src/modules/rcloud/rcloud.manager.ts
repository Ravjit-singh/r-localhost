import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';

let rcloudProcess: ChildProcess | null = null;
// Exact path to your rcloud server directory in Termux
const RCLOUD_DIR = '/data/data/com.termux/files/home/rcloud/server';

export const rcloudManager = {
  start: (): boolean => {
    if (rcloudProcess) {
      logger.warn('RCloud is already running.', 'RCLOUD');
      return false;
    }

    try {
      logger.info('Igniting RCloud Personal Drive...', 'RCLOUD');
      
      // Spawn npm start specifically inside the rcloud/server directory
      rcloudProcess = spawn('npm', ['start'], {
        cwd: RCLOUD_DIR,
        shell: true, 
        env: process.env 
      });

      logger.success('RCloud engine online.', 'RCLOUD');

      rcloudProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output) logger.info(output, 'RCLOUD-CORE');
      });

      rcloudProcess.stderr?.on('data', (data) => {
        logger.error(data.toString().trim(), 'RCLOUD-CORE');
      });

      rcloudProcess.on('close', (code) => {
        logger.warn(`RCloud terminated with code ${code}`, 'RCLOUD');
        rcloudProcess = null;
      });

      return true;
    } catch (error) {
      logger.error('Failed to boot RCloud', 'RCLOUD', error);
      rcloudProcess = null;
      return false;
    }
  },

  stop: (): boolean => {
    if (!rcloudProcess) {
      logger.warn('No active RCloud server found.', 'RCLOUD');
      return false;
    }

    rcloudProcess.kill('SIGINT');
    rcloudProcess = null;
    logger.success('RCloud shut down.', 'RCLOUD');
    return true;
  },

  status: (): string => {
    return rcloudProcess ? 'running' : 'stopped';
  }
};
