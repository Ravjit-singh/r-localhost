import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from '../../shared/logger.js';
import { exec } from 'child_process';

const MASTER_DOMAIN = process.env.MASTER_DOMAIN || 'ravjit.me';
const TUNNEL_NAME = process.env.MASTER_TUNNEL_NAME;

// Store the port numbers for the UI list
const routePorts = new Map<string, number>();
// Store the actual proxy instances so we reuse them (Fixes the memory leak!)
const activeProxies = new Map<string, any>();

export const proxyManager = {
  mountApp: (subdomainName: string, targetPort: number) => {
    const fullUrl = `${subdomainName}.${MASTER_DOMAIN}`;
    
    // Create the proxy instance exactly ONCE
    const proxyInstance = createProxyMiddleware({
      target: `http://localhost:${targetPort}`,
      changeOrigin: true,
      ws: true,
      xfwd: true,
      logLevel: 'silent'
    });

    activeProxies.set(fullUrl, proxyInstance);
    routePorts.set(fullUrl, targetPort);
    
    logger.success(`Proxy rule engaged: ${fullUrl} -> Local Port ${targetPort}`, 'PROXY');

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
    if (activeProxies.has(fullUrl)) {
      activeProxies.delete(fullUrl);
      routePorts.delete(fullUrl);
      logger.success(`Proxy rule severed: ${fullUrl}`, 'PROXY');
    }
  },

  listActive: () => {
    return Array.from(routePorts.entries()).map(([url, port]) => ({ url, port }));
  },

  interceptor: (req: Request, res: Response, next: NextFunction) => {
    const host = req.headers.host;
    
    if (!host || !host.endsWith(MASTER_DOMAIN)) {
      return next();
    }

    const proxy = activeProxies.get(host);

    if (proxy) {
      // Reuse the cached proxy instance instead of creating a new one
      return proxy(req, res, next);
    }

    res.status(404).send('R-Localhost: Subdomain not mounted or route offline.');
  }
};
