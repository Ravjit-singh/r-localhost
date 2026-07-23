import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';

let tunnelProcess: ChildProcess | null = null;
let currentUrl: string | null = null;

export const tunnelManager = {
  start: (ip: string, port: string): boolean => {
    if (tunnelProcess) return false;
    
    try {
      const target = `http://${ip}:${port}`;
      logger.info(`Routing Custom WAN Tunnel to ${target}...`, 'TUNNEL');
      
      tunnelProcess = spawn('cloudflared', ['tunnel', '--url', target], { shell: true });
      
      tunnelProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && currentUrl !== match[0]) {
          currentUrl = match[0];
          logger.success(`Custom WAN Link Established: ${currentUrl}`, 'TUNNEL');
        }
      });
      return true;
    } catch (error) {
      logger.error('Failed to boot custom tunnel', 'TUNNEL', error);
      return false;
    }
  },

  stop: (): boolean => {
    if (tunnelProcess) tunnelProcess.kill('SIGINT');
    tunnelProcess = null;
    currentUrl = null;
    logger.success('Custom WAN Tunnel severed.', 'TUNNEL');
    return true;
  },

  status: () => ({ status: tunnelProcess ? 'running' : 'stopped', url: currentUrl })
};
