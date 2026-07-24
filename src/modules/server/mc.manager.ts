import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';

let mcProcess: ChildProcess | null = null;
const MC_DIR = process.env.MC_DIR;

export const mcManager = {
  start: (): boolean => {
    if (mcProcess) return false;
    if (!MC_DIR) {
      logger.error('MC_DIR not specified in .env', 'SERVER');
      return false;
    }

    try {
      logger.info('Igniting Bedrock Server Core...', 'SERVER');
      
      mcProcess = spawn('./bedrock_server', {
        cwd: MC_DIR,
        shell: true
      });

      // Minimalist Clean Log
      setTimeout(() => {
        if (mcProcess) logger.success('Bedrock Server Online.', 'SERVER');
      }, 1500);

      return true;
    } catch (error) {
      logger.error('Failed to boot Bedrock server', 'SERVER', error);
      return false;
    }
  },

  stop: (): boolean => {
    if (mcProcess) {
      mcProcess.kill('SIGINT');
      mcProcess = null;
      logger.success('Bedrock server offline.', 'SERVER');
      return true;
    }
    return false;
  },

  status: () => ({
    running: mcProcess !== null
  })
};
