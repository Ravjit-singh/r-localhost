import 'dotenv/config'; // MUST BE LINE 1
import express from 'express';
import { proxyManager } from './modules/tunnels/proxy.manager.js';
import tunnelRoutes from './modules/tunnels/tunnel.routes.js';
import workspaceRoutes from './modules/workspace/workspace.routes.js';
import rcloudRoutes from './modules/rcloud/rcloud.routes.js';
import mcRoutes from './modules/server/mc.routes.js';

const app = express();

// 1. MUST BE FIRST: Proxy Interceptor
app.use(proxyManager.interceptor);

// 2. Standard Middleware
app.use(express.json());
app.use(express.static('public'));

// 3. Mount API Routes
app.use('/api/tunnels', tunnelRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/rcloud', rcloudRoutes);
app.use('/api/mc', mcRoutes);

// 4. Server Boot
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n[MASTER OS] Engine online on port ${PORT}`);
});
