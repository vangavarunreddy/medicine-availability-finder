import { query } from '../config/db.js';
import { sendBrevoEmail } from './emailService.js';

/**
 * Subscribe user to "Notify Me When Available"
 */
export const subscribeNotifyMe = async (userId, data) => {
  const { medicine_id, vendor_id = null } = data;

  if (!medicine_id) {
    throw { statusCode: 400, message: 'Medicine ID is required for notification subscription.' };
  }

  // Check existing subscription to prevent duplicates
  const existing = await query(
    `SELECT id, is_notified FROM notify_subscriptions 
     WHERE user_id = $1 AND medicine_id = $2 AND (vendor_id = $3 OR ($3 IS NULL AND vendor_id IS NULL))`,
    [userId, medicine_id, vendor_id]
  );

  if (existing.rows.length > 0) {
    if (existing.rows[0].is_notified) {
      // Re-reactivate notification if stock drops and patient re-subscribes
      await query(`UPDATE notify_subscriptions SET is_notified = FALSE WHERE id = $1`, [existing.rows[0].id]);
      return { id: existing.rows[0].id, reactivated: true };
    }
    throw { statusCode: 400, message: 'You are already subscribed to receive restock notifications for this medicine.' };
  }

  const result = await query(
    `INSERT INTO notify_subscriptions (user_id, medicine_id, vendor_id, is_notified)
     VALUES ($1, $2, $3, FALSE)
     RETURNING id, user_id, medicine_id, vendor_id, is_notified, created_at`,
    [userId, medicine_id, vendor_id]
  );

  return result.rows[0];
};

/**
 * Get active subscriptions for authenticated patient
 */
export const getUserNotifySubscriptions = async (userId) => {
  const result = await query(
    `SELECT s.id, s.is_notified, s.created_at,
            m.id as medicine_id, m.name as medicine_name, m.brand, m.dosage, m.form,
            v.id as vendor_id, v.business_name as vendor_name, v.city
     FROM notify_subscriptions s
     JOIN medicines m ON m.id = s.medicine_id
     LEFT JOIN vendors v ON v.id = s.vendor_id
     WHERE s.user_id = $1
     ORDER BY s.created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Unsubscribe / Delete notification
 */
export const deleteNotifySubscription = async (userId, subscriptionId) => {
  const result = await query(
    `DELETE FROM notify_subscriptions WHERE id = $1 AND user_id = $2 RETURNING id`,
    [subscriptionId, userId]
  );
  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Subscription record not found.' };
  }
  return { id: subscriptionId, deleted: true };
};

/**
 * Trigger Restock Emails via Brevo when stock is replenished
 */
export const triggerRestockNotifications = async (medicineId, vendorId = null) => {
  try {
    let sql = `
      SELECT s.id as sub_id, u.email, u.full_name, m.name as medicine_name, m.brand, m.dosage, v.business_name as vendor_name
      FROM notify_subscriptions s
      JOIN users u ON u.id = s.user_id
      JOIN medicines m ON m.id = s.medicine_id
      LEFT JOIN vendors v ON v.id = s.vendor_id
      WHERE s.medicine_id = $1 AND s.is_notified = FALSE
    `;
    const params = [medicineId];

    if (vendorId) {
      params.push(vendorId);
      sql += ` AND (s.vendor_id = $2 OR s.vendor_id IS NULL)`;
    }

    const result = await query(sql, params);
    if (result.rows.length === 0) return 0;

    const subIdsToMark = [];

    for (const row of result.rows) {
      subIdsToMark.push(row.sub_id);
      sendBrevoEmail({
        toEmail: row.email,
        toName: row.full_name,
        subject: `Medicine Now Available: ${row.medicine_name}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0F172A; margin-bottom: 8px;">Medicine Availability Finder</h2>
            <h3 style="color: #059669; margin-top: 0;">Stock Availability Alert!</h3>
            <p>Hello ${row.full_name},</p>
            <p>The medicine <strong>${row.medicine_name} (${row.brand} - ${row.dosage})</strong> you requested a restock notification for is now available ${row.vendor_name ? `at <strong>${row.vendor_name}</strong>` : 'at a registered supplier'}.</p>
            <p>Visit the platform to view stock count, price, and submit your reservation request.</p>
          </div>
        `
      });
    }

    if (subIdsToMark.length > 0) {
      await query(`UPDATE notify_subscriptions SET is_notified = TRUE WHERE id = ANY($1)`, [subIdsToMark]);
    }

    return subIdsToMark.length;
  } catch (error) {
    console.error('[Restock Trigger Error]', error.message);
    return 0;
  }
};
