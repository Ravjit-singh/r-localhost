import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';

let rcloudProcess: ChildProcess | null = null;
let tunnelProcess: ChildProcess | null = null;

// Exact path to your rcloud server
const RCLOUD_DIR = '/data/data/com.termux/files/home/rcloud/server';
const RCLOUD_PORT = 3000; 

// Your new permanent domain
const STATIC_URL = 'https://cloud.ravjit.me';

export const rcloudManager = {
  start: (): boolean => {
    if (rcloudProcess) return false;

    try {
      logger.info('Igniting RCloud Personal Drive...', 'RCLOUD');
      
      rcloudProcess = spawn('npm', ['start'], {
        cwd: RCLOUD_DIR,
        shell: true
      });

      logger.info('Establishing Persistent WAN Link...', 'TUNNEL');
      // We now use the 'run' command and target your 'master-rcloud' tunnel
      tunnelProcess = spawn('cloudflared', ['tunnel', 'run', '--url', `http://localhost:${RCLOUD_PORT}`, 'master-rcloud'], {
        shell: true
      });

      logger.success(`Persistent WAN Link Locked: ${STATIC_URL}`, 'TUNNEL');
      return true;
    } catch (error) {
      logger.error('Failed to boot RCloud', 'RCLOUD', error);
      return false;
    }
  },

  stop: (): boolean => {
    if (rcloudProcess) rcloudProcess.kill('SIGINT');
    if (tunnelProcess) tunnelProcess.kill('SIGINT');
    rcloudProcess = null;
    tunnelProcess = null;
    logger.success('RCloud and WAN Tunnel cleanly severed.', 'RCLOUD');
    return true;
  },

  status: () => {
    return {
      status: rcloudProcess ? 'running' : 'stopped',
      url: rcloudProcess ? STATIC_URL : null
    };
  }
};
