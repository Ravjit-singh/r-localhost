import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from '../../shared/logger.js';
import { exec } from 'child_process';

const MASTER_DOMAIN = process.env.MASTER_DOMAIN || 'ravjit.me';
const TUNNEL_NAME = process.env.MASTER_TUNNEL_NAME;

// Store our active memory routes mapping Subdomain -> Port
const activeRoutes = new Map<string, number>();

export const proxyManager = {
  mountApp: (subdomainName: string, targetPort: number) => {
    const fullUrl = `${subdomainName}.${MASTER_DOMAIN}`;
    activeRoutes.set(fullUrl, targetPort);
    logger.success(`Proxy rule engaged: ${fullUrl} -> Local Port ${targetPort}`, 'PROXY');

    // Automatically tell Cloudflare to create the public DNS record
    if (TUNNEL_NAME) {
      exec(`cloudflared tunnel route dns ${TUNNEL_NAME} ${fullUrl}`, (error) => {
        if (error && !error.message.includes('already exists')) {
          logger.error(`Failed to bind DNS for ${fullUrl}`, 'PROXY');
        } else {
          logger.success(`Cloudflare DNS linked to ${fullUrl}`, 'PROXY');
        }
      });
    }
  },

  unmountApp: (subdomainName: string) => {
    const fullUrl = `${subdomainName}.${MASTER_DOMAIN}`;
    if (activeRoutes.has(fullUrl)) {
      activeRoutes.delete(fullUrl);
      logger.success(`Proxy rule severed: ${fullUrl}`, 'PROXY');
    }
  },

  // FIXED: Renamed to listActive to match tunnel.routes.ts
  listActive: () => {
    return Array.from(activeRoutes.entries()).map(([url, port]) => ({ url, port }));
  },

  interceptor: (req: Request, res: Response, next: NextFunction) => {
    const host = req.headers.host;
    
    if (!host || !host.endsWith(MASTER_DOMAIN)) {
      return next();
    }

    const targetPort = activeRoutes.get(host);

    if (targetPort) {
      const proxy = createProxyMiddleware({
        target: `http://localhost:${targetPort}`,
        changeOrigin: true,
        ws: true,
        logLevel: 'silent' // Keeps terminal clean
      });
      return proxy(req, res, next);
    }

    res.status(404).send('R-Localhost: Subdomain not mounted or route offline.');
  }
};
