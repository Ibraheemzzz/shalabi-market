// dotenv is already loaded by app.js — no need to call it again here
const app    = require('./app');
const prisma = require('./config/prisma');
const logger = require('./config/logger');

const PORT  = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

const server = app.listen(PORT, () => {
  logger.info(`🚀 Shalabi Market API started`, {
    port:        PORT,
    environment: process.env.NODE_ENV || 'development',
    ...(isDev && { url: `http://localhost:${PORT}` })
  });
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  logger.warn(`${signal} received — shutting down gracefully`);
  await new Promise((resolve) => server.close(resolve));
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected. Bye 👋');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown', { error: err.message });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', async (err) => {
  logger.error('Uncaught Exception — forcing shutdown', { error: err.message, stack: err.stack });
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  logger.error('Unhandled Rejection — forcing shutdown', { reason: String(reason) });
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
