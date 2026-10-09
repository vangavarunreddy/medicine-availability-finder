import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * Safe CLI Script to Promote an existing user or create a new System Administrator account
 * Usage: node src/utils/createAdmin.js [email] [password] [name]
 */
async function createOrPromoteAdmin() {
  const emailArg = process.argv[2] || 'admin@medfinder.com';
  const passArg = process.argv[3] || 'AdminPass123!';
  const nameArg = process.argv[4] || 'System Administrator';

  console.log(`================ ADMIN ACCOUNT GENERATOR ================`);
  console.log(`Target Email: ${emailArg}`);

  try {
    const existing = await query(`SELECT id, role, email FROM users WHERE LOWER(email) = LOWER($1)`, [emailArg.trim()]);

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      await query(`UPDATE users SET role = 'ADMIN', is_email_verified = TRUE WHERE id = $1`, [user.id]);
      console.log(`[SUCCESS] Existing user "${user.email}" was promoted to ADMIN role.`);
    } else {
      const hash = await bcrypt.hash(passArg, 10);
      const res = await query(
        `INSERT INTO users (email, password_hash, role, full_name, phone, is_email_verified)
         VALUES (LOWER($1), $2, 'ADMIN', $3, '+91 90000 00000', TRUE)
         RETURNING id, email, role`,
        [emailArg.trim(), hash, nameArg.trim()]
      );
      console.log(`[SUCCESS] Created new Administrator account: ${res.rows[0].email} (${res.rows[0].role})`);
    }

    console.log(`You can now log in at /login with:`);
    console.log(`Email: ${emailArg.trim()}`);
    console.log(`Password: ${passArg}`);
    console.log(`========================================================`);
    process.exit(0);
  } catch (err) {
    console.error(`[ERROR] Failed to set admin account:`, err.message);
    process.exit(1);
  }
}

createOrPromoteAdmin();
