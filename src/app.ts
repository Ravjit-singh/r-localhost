import express from 'express';
import { proxyManager } from './modules/tunnels/proxy.manager.js';
// ... your other imports ...

const app = express();

// 1. MUST BE FIRST: The Proxy Interceptor
app.use(proxyManager.interceptor);

// 2. Standard Middleware
app.use(express.json());
app.use(express.static('public'));

// 3. Your API Routes
// app.use('/api/dns', dnsRoutes);
// app.use('/api/rcloud', rcloudRoutes);
// ...

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n[MASTER OS] Engine online on port ${PORT}`);
});
