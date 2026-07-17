import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';

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
      // UPDATE THIS PATH: Point it to exactly where your 'yourhost' bedrock binary lives
      const serverDir = '/data/data/com.termux/files/home/yourhost/server'; 
      
      mcProcess = spawn('./bedrock_server', {
        cwd: serverDir,
        env: { ...process.env, LD_LIBRARY_PATH: '.' }
      });

      logger.success('Minecraft Bedrock binary ignited.', 'SERVER');

      // Pipe stdout
      mcProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output) logger.info(output, 'MC-CORE');
      });

      // Pipe stderr
      mcProcess.stderr?.on('data', (data) => {
        logger.error(data.toString().trim(), 'MC-CORE');
      });

      // CATCH SPAWN ERRORS so the Express daemon doesn't crash
      mcProcess.on('error', (err) => {
        logger.error(`Binary execution failed: ${err.message}`, 'SERVER');
        mcProcess = null;
      });

      // Handle graceful exits
      mcProcess.on('close', (code) => {
        logger.warn(`Minecraft server terminated with code ${code}`, 'SERVER');
        mcProcess = null;
      });

      return true;
    } catch (error) {
      logger.error('Failed to spawn Bedrock binary setup', 'SERVER', error);
      mcProcess = null;
      return false;
    }
  },

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

  status: (): string => {
    return mcProcess ? 'running' : 'stopped';
  }
};
