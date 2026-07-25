import { spawn, ChildProcess } from 'child_process';
import { logger } from '../../shared/logger.js';
import path from 'path';
import fs from 'fs';

let playitProcess: ChildProcess | null = null;

export const playitManager = {
  start: (): boolean => {
    if (playitProcess) return false;
    
    try {
      logger.info('Igniting UDP Game Tunnel...', 'PLAYIT');
      
      const dataDir = path.join(process.cwd(), 'data');
      const tempDir = path.join(dataDir, 'temp'); // Our isolated socket directory
      const secretPath = path.join(dataDir, 'playit.toml');

      // Ensure the directories exist before booting
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      // UNIVERSAL FIX: We inject isolated Temp folder paths into the process environment.
      // This forces Playit to create its IPC sockets locally, bypassing /tmp crashes on Android
      // while remaining 100% native and compatible with Windows, Mac, and standard Linux.
      const customEnv = {
        ...process.env,
        TMPDIR: tempDir,
        TMP: tempDir,
        TEMP: tempDir
      };

      playitProcess = spawn('playit', ['--secret-path', secretPath], { 
        shell: true,
        env: customEnv // Pass the overridden environment
      });

      setTimeout(() => {
        if (playitProcess) logger.success('Playit UDP Routing Online.', 'PLAYIT');
      }, 1500);

      playitProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
          logger.error(`Tunnel crashed (Code ${code})`, 'PLAYIT');
        }
        playitProcess = null;
      });

      return true;
    } catch (error) {
      logger.error('Playit Tunnel failure', 'PLAYIT', error);
      return false;
    }
  },

  stop: (): boolean => {
    if (playitProcess) {
      playitProcess.kill('SIGINT');
      playitProcess = null;
      logger.success('UDP Game Tunnel severed.', 'PLAYIT');
      return true;
    }
    return false;
  },

  status: () => ({
    running: playitProcess !== null
  })
};
