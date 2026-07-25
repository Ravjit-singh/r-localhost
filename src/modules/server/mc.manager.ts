import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';

let mcProcess: ChildProcess | null = null;
const MC_DIR = process.env.MC_DIR || 'start-mc';

export const mcManager = {
  start: (): boolean => {
    if (mcProcess) return false;

    try {
      logger.info(`Igniting Container via [${MC_DIR}]...`, 'SERVER');

      // Spawns start-mc directly.
      // stdio: 'inherit' streams full Debian console logs into Master OS terminal.
      mcProcess = spawn(MC_DIR, [], {
        shell: true,
        stdio: 'inherit'
      });

      mcProcess.on('close', (code) => {
        logger.warn(`Container process exited with code ${code}`, 'SERVER');
        mcProcess = null;
      });

      return true;
    } catch (error) {
      logger.error('Failed to trigger container startup script', 'SERVER', error);
      return false;
    }
  },

  stop: (): boolean => {
    if (mcProcess) {
      mcProcess.kill('SIGINT');
      mcProcess = null;
      logger.success('Container connection terminated.', 'SERVER');
      return true;
    }
    return false;
  },

  status: () => ({
    running: mcProcess !== null
  })
};
