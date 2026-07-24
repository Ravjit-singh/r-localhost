import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';

let masterTunnel: ChildProcess | null = null;
const TUNNEL_NAME = process.env.MASTER_TUNNEL_NAME;

export const tunnelManager = {
  ignite: (): boolean => {
    if (masterTunnel) return false;
    
    try {
      logger.info(`Igniting Permanent Tunnel...`, 'TUNNEL');
      
      masterTunnel = spawn(`cloudflared tunnel run ${TUNNEL_NAME}`, { 
        shell: true 
      });

      // Minimalist Clean Log
      setTimeout(() => {
        if (masterTunnel) logger.success('Global Tunnel Routing Online.', 'TUNNEL');
      }, 1500);

      masterTunnel.on('close', (code) => {
        if (code !== 0 && code !== null) {
          logger.error(`Tunnel crashed (Code ${code})`, 'TUNNEL');
        }
        masterTunnel = null;
      });

      return true;
    } catch (error) {
      logger.error('Master Tunnel failure', 'TUNNEL', error);
      return false;
    }
  },

  kill: (): boolean => {
    if (masterTunnel) {
      masterTunnel.kill('SIGINT');
      masterTunnel = null;
      logger.success('Global Tunnel severed. Device dark.', 'TUNNEL');
      return true;
    }
    return false;
  },

  status: () => ({ status: masterTunnel !== null ? 'online' : 'offline' })
};
