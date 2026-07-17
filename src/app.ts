import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import modules
import mcRoutes from './modules/server/mc.routes.js';
import dnsRoutes from './modules/dns/dns.routes.js';
import rcloudRoutes from './modules/rcloud/rcloud.routes.js';
import { logger } from './shared/logger.js';

// Resolve directory path for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;

// Middleware
app.use(express.json());

// Serve the frontend UI from the public folder
app.use(express.static(path.join(__dirname, '../public')));

// Mount API Endpoints
app.use('/api/server', mcRoutes);
app.use('/api/dns', dnsRoutes);
app.use('/api/rcloud', rcloudRoutes);

// Boot Daemon
app.listen(PORT, () => {
  logger.success(`r-localhost master hypervisor online on port ${PORT}`, 'SYSTEM');
});
