export const logger = {
  info: (msg: string, context = 'SYSTEM') => {
    console.log(`[\x1b[36m${context}\x1b[0m] ${msg}`);
  },
  success: (msg: string, context = 'SYSTEM') => {
    console.log(`[\x1b[32m${context}\x1b[0m] ✅ ${msg}`);
  },
  error: (msg: string, context = 'SYSTEM', err?: any) => {
    console.error(`[\x1b[31m${context}\x1b[0m] ❌ ${msg}`, err || '');
  },
  warn: (msg: string, context = 'SYSTEM') => {
    console.warn(`[\x1b[33m${context}\x1b[0m] ⚠️ ${msg}`);
  }
};
