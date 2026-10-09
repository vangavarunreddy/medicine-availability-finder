import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { checkDbConnection } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeDatabase = async () => {
  console.log('[DB Init] Checking Neon PostgreSQL Connection...');
  const connCheck = await checkDbConnection();

  if (!connCheck.connected) {
    console.error('[DB Init Error]', connCheck.message);
    return false;
  }

  console.log(`[DB Init] Connected to database "${connCheck.database}" (${connCheck.latencyMs}ms). Initializing schema...`);

  try {
    const schemaPath = path.join(__dirname, '../models/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(sql);
    console.log('[DB Init Success] Database schema and indexes initialized successfully.');
    return true;
  } catch (error) {
    console.error('[DB Init Error] Failed to apply schema script:', error.message);
    throw error;
  }
};

// Allow CLI execution if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then((success) => {
      if (success) console.log('[DB Init] Complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB Init Failed]', err);
      process.exit(1);
    });
}
