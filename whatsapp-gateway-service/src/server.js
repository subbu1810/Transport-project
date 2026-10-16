import { createApp } from './app.js';
import { config } from './config/index.js';
import { runMigrations } from './database/migrate.js';
import { seedDatabase } from './database/seed.js';

async function startServer() {
  try {
    // 1. Ensure DB migrations and sample seeds run
    await runMigrations();
    await seedDatabase();

    // 2. Start Express app
    const app = createApp();
    app.listen(config.port, () => {
      console.log('====================================================');
      console.log(`🚀 WhatsApp Gateway Microservice is running!`);
      console.log(`🌐 Server Port: http://localhost:${config.port}`);
      console.log(`💻 Developer Dashboard: http://localhost:${config.port}/`);
      console.log(`⚙️  Environment: ${config.nodeEnv}`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
