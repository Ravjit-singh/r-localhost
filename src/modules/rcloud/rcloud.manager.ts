import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';

let rcloudProcess: ChildProcess | null = null;
let tunnelProcess: ChildProcess | null = null;
let currentPublicUrl: string | null = null;

// Exact path to your rcloud server
const RCLOUD_DIR = '/data/data/com.termux/files/home/rcloud/server';

// ⚠️ CHANGE THIS to whatever port your RCloud npm start uses (e.g., 3000, 5000, 8080)
const RCLOUD_PORT = 3000; 

export const rcloudManager = {
  start: (): boolean => {
    if (rcloudProcess) return false;

    try {
      logger.info('Igniting RCloud Personal Drive...', 'RCLOUD');
      
      // 1. Start the actual RCloud backend
      rcloudProcess = spawn('npm', ['start'], {
        cwd: RCLOUD_DIR,
        shell: true
      });

      // 2. Start the Cloudflare WAN Tunnel
      logger.info('Establishing Global WAN Link...', 'TUNNEL');
      tunnelProcess = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${RCLOUD_PORT}`], {
        shell: true
      });

      // 3. Scrape the terminal output for the generated URL
      tunnelProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        // Regex to catch the secure trycloudflare URL
        const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        
        if (match && currentPublicUrl !== match[0]) {
          currentPublicUrl = match[0];
          logger.success(`WAN Link Established: ${currentPublicUrl}`, 'TUNNEL');
        }
      });

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
    currentPublicUrl = null;
    logger.success('RCloud and WAN Tunnel cleanly severed.', 'RCLOUD');
    return true;
  },

  status: () => {
    return {
      status: rcloudProcess ? 'running' : 'stopped',
      url: currentPublicUrl
    };
  }
};
