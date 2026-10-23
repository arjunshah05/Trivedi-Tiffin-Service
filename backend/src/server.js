import app from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

await connectDatabase();
const server = app.listen(env.port, () => console.info(`Trivedi Tiffin API listening on port ${env.port}`));

async function shutdown(signal) {
  console.info(`${signal} received; shutting down gracefully`);
  server.close(async () => {
    const mongoose = await import('mongoose');
    await mongoose.default.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
