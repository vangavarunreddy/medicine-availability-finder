import pool from '../config/db.js';

async function verifySchema() {
  console.log('========== NEON POSTGRESQL SCHEMA VERIFICATION ==========');
  try {
    // 1. Connection check
    const conn = await pool.query('SELECT current_database(), version();');
    console.log('[1. Connection] Status: CONNECTED');
    console.log(`[1. Connection] Database Name: ${conn.rows[0].current_database}`);

    // 2. Table list verification
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    const tableNames = tablesRes.rows.map(r => r.table_name);
    console.log(`[2. Tables] (${tableNames.length}/10 Verified):`, tableNames.join(', '));

    // 3. Extension check
    const extRes = await pool.query("SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';");
    console.log('[3. Extensions] pg_trgm Enabled:', extRes.rows.length > 0 ? 'YES' : 'NO');

    // 4. Foreign keys check
    const fkRes = await pool.query(`
      SELECT constraint_name, table_name 
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'FOREIGN KEY' AND constraint_schema = 'public';
    `);
    console.log(`[4. Foreign Keys] Verified Total: ${fkRes.rows.length}`);

    // 5. Unique constraints check
    const uqRes = await pool.query(`
      SELECT constraint_name, table_name 
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'UNIQUE' AND constraint_schema = 'public';
    `);
    console.log(`[5. Unique Constraints] Verified Total: ${uqRes.rows.length}`);

    console.log('========================================================');
    process.exit(0);
  } catch (err) {
    console.error('[Verification Failed]:', err.message);
    process.exit(1);
  }
}

verifySchema();
