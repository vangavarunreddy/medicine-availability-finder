import { query } from '../config/db.js';

/**
 * List catalog medicines with optional search and filters
 */
export const getCatalogMedicines = async ({ search, form, limit = 100, offset = 0 }) => {
  let sql = `
    SELECT id, name, brand, generic_name, dosage, form, manufacturer, description, is_active, created_at, updated_at
    FROM medicines
    WHERE is_active = TRUE
  `;
  const params = [];

  if (form && form !== 'ALL') {
    params.push(form.trim());
    sql += ` AND form = $${params.length}`;
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const searchIdx = params.length;
    params.push(search.trim());
    const exactIdx = params.length;

    sql += ` AND (
      name ILIKE $${searchIdx} OR 
      brand ILIKE $${searchIdx} OR 
      generic_name ILIKE $${searchIdx} OR
      similarity(name || ' ' || brand || ' ' || generic_name, $${exactIdx}) > 0.15
    )`;
  }

  sql += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get catalog medicine details by ID with list of approved vendors offering stock
 */
export const getMedicineById = async (id) => {
  const medicineRes = await query(
    `SELECT id, name, brand, generic_name, dosage, form, manufacturer, description, is_active, created_at, updated_at
     FROM medicines
     WHERE id = $1`,
    [id]
  );

  if (medicineRes.rows.length === 0) {
    throw { statusCode: 404, message: 'Medicine not found in catalog.' };
  }

  const medicine = medicineRes.rows[0];

  // Fetch stock availability from APPROVED vendors only
  const inventoryRes = await query(
    `SELECT i.id as inventory_id, i.stock_quantity, i.price, i.min_stock_level, i.last_updated,
            v.id as vendor_id, v.business_name, v.vendor_type, v.phone, v.email, v.address, v.city, v.state, v.pincode, v.status as vendor_status,
            CASE 
              WHEN i.stock_quantity = 0 THEN 'OUT_OF_STOCK'
              WHEN i.stock_quantity <= i.min_stock_level THEN 'LOW_STOCK'
              ELSE 'AVAILABLE'
            END as stock_status
     FROM inventories i
     JOIN vendors v ON v.id = i.vendor_id
     WHERE i.medicine_id = $1 AND v.status = 'APPROVED'
     ORDER BY 
       CASE WHEN i.stock_quantity > 0 THEN 1 ELSE 2 END,
       i.price ASC`,
    [id]
  );

  return {
    medicine,
    approvedVendors: inventoryRes.rows
  };
};

/**
 * Create a new medicine record in master catalog (Admin Only)
 */
export const createMedicine = async (data) => {
  const { name, brand, generic_name, dosage, form, manufacturer, description } = data;

  if (!name || !brand || !generic_name || !dosage || !form) {
    throw { statusCode: 400, message: 'Medicine name, brand, generic name, dosage, and form are required.' };
  }

  // Check unique specification constraint
  const existing = await query(
    `SELECT id FROM medicines 
     WHERE LOWER(name) = $1 AND LOWER(brand) = $2 AND LOWER(generic_name) = $3 AND LOWER(dosage) = $4 AND LOWER(form) = $5`,
    [name.toLowerCase().trim(), brand.toLowerCase().trim(), generic_name.toLowerCase().trim(), dosage.toLowerCase().trim(), form.toLowerCase().trim()]
  );

  if (existing.rows.length > 0) {
    throw { statusCode: 400, message: 'A medicine with identical name, brand, generic name, dosage, and form already exists in the catalog.' };
  }

  const result = await query(
    `INSERT INTO medicines (name, brand, generic_name, dosage, form, manufacturer, description, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
     RETURNING id, name, brand, generic_name, dosage, form, manufacturer, description, is_active, created_at`,
    [
      name.trim(),
      brand.trim(),
      generic_name.trim(),
      dosage.trim(),
      form.trim(),
      manufacturer ? manufacturer.trim() : null,
      description ? description.trim() : null
    ]
  );

  return result.rows[0];
};

/**
 * Update an existing medicine record (Admin Only)
 */
export const updateMedicine = async (id, data) => {
  const { name, brand, generic_name, dosage, form, manufacturer, description, is_active } = data;

  const current = await query('SELECT * FROM medicines WHERE id = $1', [id]);
  if (current.rows.length === 0) {
    throw { statusCode: 404, message: 'Medicine record not found.' };
  }

  const result = await query(
    `UPDATE medicines
     SET name = COALESCE($1, name),
         brand = COALESCE($2, brand),
         generic_name = COALESCE($3, generic_name),
         dosage = COALESCE($4, dosage),
         form = COALESCE($5, form),
         manufacturer = COALESCE($6, manufacturer),
         description = COALESCE($7, description),
         is_active = COALESCE($8, is_active),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $9
     RETURNING id, name, brand, generic_name, dosage, form, manufacturer, description, is_active, updated_at`,
    [
      name ? name.trim() : null,
      brand ? brand.trim() : null,
      generic_name ? generic_name.trim() : null,
      dosage ? dosage.trim() : null,
      form ? form.trim() : null,
      manufacturer !== undefined ? (manufacturer ? manufacturer.trim() : null) : null,
      description !== undefined ? (description ? description.trim() : null) : null,
      is_active !== undefined ? is_active : null,
      id
    ]
  );

  return result.rows[0];
};

/**
 * Soft delete / deactivate medicine record (Admin Only)
 */
export const deactivateMedicine = async (id) => {
  const result = await query(
    `UPDATE medicines 
     SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING id, name, is_active`,
    [id]
  );

  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Medicine record not found.' };
  }

  return result.rows[0];
};
