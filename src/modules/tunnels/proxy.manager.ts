import httpProxy from 'http-proxy';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/logger.js';
import 'dotenv/config';

// Initialize the ultra-lightweight proxy engine
const proxy = httpProxy.createProxyServer({ ws: true }); 
const MASTER_DOMAIN = process.env.MASTER_DOMAIN || 'ravjit.me';

// This acts as your live database of running apps
const routingTable = new Map<string, number>();

export const proxyManager = {
  // Mounts a new app dynamically (e.g., name: 'cloud', targetPort: 3000)
  mountApp: (name: string, targetPort: number) => {
    const fullUrl = `${name}.${MASTER_DOMAIN}`;
    routingTable.set(fullUrl, targetPort);
    logger.info(`Proxy rule engaged: ${fullUrl} -> Local Port ${targetPort}`, 'PROXY');
    return fullUrl;
  },

  unmountApp: (name: string) => {
    const fullUrl = `${name}.${MASTER_DOMAIN}`;
    routingTable.delete(fullUrl);
    logger.success(`Proxy rule severed: ${fullUrl}`, 'PROXY');
  },

  listActive: () => Array.from(routingTable.entries()).map(([url, port]) => ({ url, port })),

  // The Master Interceptor (Runs on every request)
  interceptor: (req: Request, res: Response, next: NextFunction) => {
    const host = req.headers.host;
    
    // If the request matches a running app, pipe it silently
    if (host && routingTable.has(host)) {
      const targetPort = routingTable.get(host);
      return proxy.web(req, res, { target: `http://localhost:${targetPort}` }, (err) => {
        logger.error(`Proxy failure for ${host}`, 'PROXY', err);
        res.status(502).send('Master Daemon: Target app is currently offline or rebooting.');
      });
    }
    
    // If it doesn't match an app, load the r-localhost UI normally
    next();
  }
};
