import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';

// Track the running Bedrock instance globally
let mcProcess: ChildProcess | null = null;

export const mcManager = {
  start: (): boolean => {
    if (mcProcess) {
      logger.warn('Minecraft server is already running.', 'SERVER');
      return false;
    }

    try {
      logger.info('Engaging PRoot container via start-mc...', 'SERVER');
      
      // Execute the global terminal command using the native shell
      mcProcess = spawn('start-mc', [], {
        shell: true, 
        env: process.env // Inherit Termux environment variables
      });

      logger.success('Minecraft Bedrock container ignited.', 'SERVER');

      // Pipe stdout
      mcProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output) logger.info(output, 'MC-CORE');
      });

      // Pipe stderr
      mcProcess.stderr?.on('data', (data) => {
        logger.error(data.toString().trim(), 'MC-CORE');
      });

      // Catch spawn errors (e.g., if start-mc is not found)
      mcProcess.on('error', (err) => {
        logger.error(`Container execution failed: ${err.message}`, 'SERVER');
        mcProcess = null;
      });

      // Handle graceful exits
      mcProcess.on('close', (code) => {
        logger.warn(`Minecraft container terminated with code ${code}`, 'SERVER');
        mcProcess = null;
      });

      return true;
    } catch (error) {
      logger.error('Failed to spawn start-mc script', 'SERVER', error);
      mcProcess = null;
      return false;
    }
  },

  stop: (): boolean => {
    if (!mcProcess) {
      logger.warn('No active Minecraft server found to terminate.', 'SERVER');
      return false;
    }

    // Kill the shell process (and hopefully its child proot process)
    mcProcess.kill('SIGINT');
    mcProcess = null;
    logger.success('Minecraft container shut down signal sent.', 'SERVER');
    return true;
  },

  status: (): string => {
    return mcProcess ? 'running' : 'stopped';
  }
};
