import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon WebSocket with error handling
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with robust connection settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500,
  allowExitOnIdle: false
});

// Add connection error handling
pool.on('error', (err) => {
  console.warn('Database pool error:', err.message);
});

export const db = drizzle({ client: pool, schema });