import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import importRoutes from './routes/import.js';
import reconcileRoutes from './routes/reconcile.js';
import exceptionsRoutes from './routes/exceptions.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/import', importRoutes);
app.use('/api/reconciliation', reconcileRoutes);
app.use('/api/exceptions', exceptionsRoutes);

// Serve static frontend in production
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
