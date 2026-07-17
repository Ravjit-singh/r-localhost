import express from 'express';
import cors from 'cors';

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());

// Serves the front-end dashboard UI
app.use(express.static('public'));

// Base health status check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'operational', 
    timestamp: new Date().toISOString() 
  });
});

// TODO: Mount modular feature routes here
// app.use('/api/dns', dnsRoutes);

export default app;
