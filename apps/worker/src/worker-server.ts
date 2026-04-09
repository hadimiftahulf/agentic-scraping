import express from 'express';
import { createLogger } from 'pino';
import healthRoutes from './routes/health';

const logger = createLogger();
const app = express();
const PORT = process.env.WORKER_HEALTH_PORT || 3002;

// Health check routes
app.use('/', healthRoutes);

// Start health check server
app.listen(PORT, () => {
  logger.info(`Worker health check server listening on port ${PORT}`);
});

export default app;
