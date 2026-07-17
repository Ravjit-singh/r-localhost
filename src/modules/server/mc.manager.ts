import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';
import path from 'path';

// Track the running Bedrock instance globally
let mcProcess: ChildProcess | null = null;

export const mcManager = {
  /**
   * Spawns the Minecraft Bedrock binary inside the Termux environment.
   */
  start: (): boolean => {
    if (mcProcess) {
      logger.warn('Minecraft server is already running.', 'SERVER');
      return false;
    }

    try {
      // Set this to the actual absolute path where your bedrock server lives in Termux
      const serverDir = '/data/data/com.termux/files/home/minecraft';
      
      mcProcess = spawn('./bedrock_server', {
        cwd: serverDir,
        env: { ...process.env, LD_LIBRARY_PATH: '.' }
      });

      logger.success('Minecraft Bedrock binary ignited.', 'SERVER');

      // Pipe the native C++ binary outputs directly into our Node logger
      mcProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output) logger.info(output, 'MC-CORE');
      });

      mcProcess.stderr?.on('data', (data) => {
        logger.error(data.toString().trim(), 'MC-CORE');
      });

      mcProcess.on('close', (code) => {
        logger.warn(`Minecraft server terminated with code ${code}`, 'SERVER');
        mcProcess = null;
      });

      return true;
    } catch (error) {
      logger.error('Failed to spawn Bedrock binary', 'SERVER', error);
      mcProcess = null;
      return false;
    }
  },

  /**
   * Gracefully kills the running binary.
   */
  stop: (): boolean => {
    if (!mcProcess) {
      logger.warn('No active Minecraft server found to terminate.', 'SERVER');
      return false;
    }

    mcProcess.kill('SIGINT');
    mcProcess = null;
    logger.success('Minecraft server gracefully shut down.', 'SERVER');
    return true;
  },

  /**
   * Returns current lifecycle state.
   */
  status: (): string => {
    return mcProcess ? 'running' : 'stopped';
  }
};
