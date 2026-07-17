import express from 'express';
import cors from 'cors';

// Import Feature Modules (Note the .js extension for NodeNext resolution)
import dnsRoutes from './modules/dns/dns.routes.js';
import mcRoutes from './modules/server/mc.routes.js';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Serve the compiled Tailwind/HTML UI dashboard
app.use(express.static('public'));

// Core Infrastructure Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    service: 'r-localhost',
    status: 'operational', 
    timestamp: new Date().toISOString() 
  });
});

// Mount the modular APIs
app.use('/api/dns', dnsRoutes);
app.use('/api/server', mcRoutes);

// You can add the Layer 4 Tunnel routes (FRP) here later
// app.use('/api/tunnels', tunnelRoutes);

export default app;
