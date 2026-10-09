import { query } from '../config/db.js';

/**
 * Public Medicine Availability Search Engine
 */
export const searchMedicineAvailability = async ({
  q,
  location,
  vendor_type,
  availability,
  form,
  dosage,
  sortBy = 'availability',
  userId = null,
  limit = 50,
  offset = 0
}) => {
  let sql = `
    SELECT i.id as inventory_id, i.stock_quantity, i.price, i.min_stock_level, i.last_updated, COALESCE(i.is_demo, FALSE) as is_demo,
           m.id as medicine_id, m.name as medicine_name, m.brand, m.generic_name, m.dosage, m.form, m.manufacturer, m.description,
           v.id as vendor_id, v.business_name as vendor_name, v.vendor_type, v.phone as vendor_phone, v.email as vendor_email,
           v.address, v.city, v.state, v.pincode, v.latitude, v.longitude, COALESCE(v.is_demo, FALSE) as vendor_is_demo,
           CASE 
             WHEN i.stock_quantity = 0 THEN 'OUT_OF_STOCK'
             WHEN i.stock_quantity <= i.min_stock_level THEN 'LOW_STOCK'
             ELSE 'AVAILABLE'
           END as stock_status,
           GREATEST(
             similarity(m.name, COALESCE($1, '')),
             similarity(m.brand, COALESCE($1, '')),
             similarity(m.generic_name, COALESCE($1, ''))
           ) as match_similarity
    FROM inventories i
    JOIN medicines m ON m.id = i.medicine_id
    JOIN vendors v ON v.id = i.vendor_id
    WHERE v.status = 'APPROVED' AND m.is_active = TRUE
  `;

  const params = [q ? q.trim() : ''];

  if (q && q.trim()) {
    params.push(`%${q.trim()}%`);
    const searchParamIdx = params.length;

    sql += ` AND (
      m.name ILIKE $${searchParamIdx} OR 
      m.brand ILIKE $${searchParamIdx} OR 
      m.generic_name ILIKE $${searchParamIdx} OR
      m.dosage ILIKE $${searchParamIdx} OR
      m.form ILIKE $${searchParamIdx} OR
      similarity(m.name || ' ' || m.brand || ' ' || m.generic_name, $1) > 0.15
    )`;
  }

  if (location && location.trim()) {
    params.push(`%${location.trim()}%`);
    const locIdx = params.length;
    sql += ` AND (v.city ILIKE $${locIdx} OR v.pincode ILIKE $${locIdx} OR v.state ILIKE $${locIdx} OR v.address ILIKE $${locIdx})`;
  }

  if (vendor_type && vendor_type !== 'ALL') {
    params.push(vendor_type.toUpperCase());
    sql += ` AND v.vendor_type = $${params.length}`;
  }

  if (form && form !== 'ALL') {
    params.push(form.trim());
    sql += ` AND m.form = $${params.length}`;
  }

  if (dosage && dosage !== 'ALL') {
    params.push(dosage.trim());
    sql += ` AND m.dosage = $${params.length}`;
  }

  if (availability && availability !== 'ALL') {
    if (availability === 'OUT_OF_STOCK') {
      sql += ` AND i.stock_quantity = 0`;
    } else if (availability === 'LOW_STOCK') {
      sql += ` AND i.stock_quantity > 0 AND i.stock_quantity <= i.min_stock_level`;
    } else if (availability === 'AVAILABLE') {
      sql += ` AND i.stock_quantity > i.min_stock_level`;
    }
  }

  // Sorting logic
  if (sortBy === 'price_low') {
    sql += ` ORDER BY i.price ASC, i.stock_quantity DESC`;
  } else if (sortBy === 'price_high') {
    sql += ` ORDER BY i.price DESC, i.stock_quantity DESC`;
  } else if (sortBy === 'recent') {
    sql += ` ORDER BY i.last_updated DESC`;
  } else {
    // Default: Sort by stock availability priority first, then similarity match
    sql += ` ORDER BY 
      CASE WHEN i.stock_quantity > 0 THEN 1 ELSE 2 END,
      match_similarity DESC,
      i.stock_quantity DESC,
      i.price ASC`;
  }

  params.push(limit, offset);
  sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const result = await query(sql, params);

  // Record search history if search query is non-empty
  if (q && q.trim()) {
    try {
      await query(
        `INSERT INTO search_history (user_id, query_text, selected_location, results_count)
         VALUES ($1, $2, $3, $4)`,
        [userId || null, q.trim(), location ? location.trim() : null, result.rows.length]
      );
    } catch (err) {
      console.error('[Search History Record Error]', err.message);
    }
  }

  return result.rows;
};

/**
 * Get Search History for User
 */
export const getUserSearchHistory = async (userId) => {
  const result = await query(
    `SELECT id, query_text, selected_location, results_count, searched_at
     FROM search_history
     WHERE user_id = $1
     ORDER BY searched_at DESC LIMIT 20`,
    [userId]
  );
  return result.rows;
};
