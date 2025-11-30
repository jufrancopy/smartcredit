import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasources: {
    db: {
      adapter: 'postgresql',
      url: process.env.DATABASE_URL!,
    },
  },
});
