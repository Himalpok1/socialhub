import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import { connectRedis } from './config/redis.js';
import authRoutes from './api/routes/auth.js';
import accountRoutes from './api/routes/accounts.js';
import postRoutes from './api/routes/posts.js';
import analyticsRoutes from './api/routes/analytics.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startWorkers } from './jobs/worker.js';
import { autoSeedDemo } from './utils/autoSeed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Security & parsing
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: process.env.DEMO_MODE === 'true' ? 'demo' : 'live' });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Error handler (must be last)
app.use(errorHandler);

async function bootstrap() {
  try {
    await connectDB();

    // Auto-seed demo data if in demo mode
    await autoSeedDemo();

    // Redis is optional — scheduling won't work without it but API will
    try {
      await connectRedis();
      await startWorkers();
    } catch (redisErr) {
      console.warn('⚠️  Redis unavailable — scheduling/workers disabled. Start Redis to enable.');
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 SocialHub API running on http://localhost:${PORT}`);
      console.log(`📦 Mode: ${process.env.DEMO_MODE === 'true' ? '🎭 DEMO' : '🔴 LIVE'}`);
      console.log(`🌐 Frontend: http://localhost:5173`);
      if (process.env.DEMO_MODE === 'true') {
        console.log(`\n🎭 Demo login: demo@socialhub.io / demo1234\n`);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
