import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';
import 'dotenv/config';

let masterTunnel: ChildProcess | null = null;
const MASTER_PORT = process.env.PORT || 4000;

export const tunnelManager = {
  ignite: (): boolean => {
    if (masterTunnel) return false;
    
    try {
      logger.info('Igniting Global Master Tunnel Engine...', 'TUNNEL');
      
      // We route a single quick tunnel to the Master Daemon itself
      masterTunnel = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${MASTER_PORT}`, 'run', 'master-rcloud'], { 
        shell: true 
      });

      logger.success('Global Tunnel Node Online and Routing.', 'TUNNEL');
      return true;
    } catch (error) {
      logger.error('Master Tunnel catastrophic failure', 'TUNNEL', error);
      return false;
    }
  },

  kill: (): boolean => {
    if (masterTunnel) masterTunnel.kill('SIGINT');
    masterTunnel = null;
    logger.success('Global Tunnel severed. Device dark.', 'TUNNEL');
    return true;
  },

  status: () => ({ status: masterTunnel ? 'online' : 'offline' })
};
