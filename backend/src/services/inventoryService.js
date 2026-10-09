import { query } from '../config/db.js';
import { triggerRestockNotifications } from './notifyService.js';

/**
 * Helper to verify vendor status is APPROVED
 */
const verifyApprovedVendor = async (vendorId) => {
  const result = await query('SELECT id, status, business_name FROM vendors WHERE id = $1', [vendorId]);
  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Vendor record not found.' };
  }
  const vendor = result.rows[0];
  if (vendor.status !== 'APPROVED') {
    throw {
      statusCode: 403,
      message: `Vendor account is currently ${vendor.status}. Only APPROVED vendors can publish or manage inventory.`
    };
  }
  return vendor;
};

/**
 * Get vendor inventory list with search, status filters, and stock calculations
 */
export const getVendorInventory = async (vendorId, { search, statusFilter, formFilter }) => {
  await verifyApprovedVendor(vendorId);

  let sql = `
    SELECT i.id, i.vendor_id, i.medicine_id, i.stock_quantity, i.price, i.min_stock_level, i.last_updated, i.created_at,
           m.name as medicine_name, m.brand, m.generic_name, m.dosage, m.form, m.manufacturer, m.description,
           CASE 
             WHEN i.stock_quantity = 0 THEN 'OUT_OF_STOCK'
             WHEN i.stock_quantity <= i.min_stock_level THEN 'LOW_STOCK'
             ELSE 'AVAILABLE'
           END as stock_status
    FROM inventories i
    JOIN medicines m ON m.id = i.medicine_id
    WHERE i.vendor_id = $1 AND m.is_active = TRUE
  `;
  const params = [vendorId];

  if (formFilter && formFilter !== 'ALL') {
    params.push(formFilter.trim());
    sql += ` AND m.form = $${params.length}`;
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const searchIdx = params.length;
    sql += ` AND (m.name ILIKE $${searchIdx} OR m.brand ILIKE $${searchIdx} OR m.generic_name ILIKE $${searchIdx})`;
  }

  if (statusFilter && statusFilter !== 'ALL') {
    if (statusFilter === 'OUT_OF_STOCK') {
      sql += ` AND i.stock_quantity = 0`;
    } else if (statusFilter === 'LOW_STOCK') {
      sql += ` AND i.stock_quantity > 0 AND i.stock_quantity <= i.min_stock_level`;
    } else if (statusFilter === 'AVAILABLE') {
      sql += ` AND i.stock_quantity > i.min_stock_level`;
    }
  }

  sql += ` ORDER BY i.last_updated DESC`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get vendor inventory dashboard overview metrics
 */
export const getVendorInventoryStats = async (vendorId) => {
  await verifyApprovedVendor(vendorId);

  const result = await query(
    `SELECT 
       COUNT(*) as total_items,
       COUNT(*) FILTER (WHERE stock_quantity > min_stock_level) as available_count,
       COUNT(*) FILTER (WHERE stock_quantity > 0 AND stock_quantity <= min_stock_level) as low_stock_count,
       COUNT(*) FILTER (WHERE stock_quantity = 0) as out_of_stock_count
     FROM inventories i
     JOIN medicines m ON m.id = i.medicine_id
     WHERE i.vendor_id = $1 AND m.is_active = TRUE`,
    [vendorId]
  );

  const row = result.rows[0];
  return {
    totalItems: parseInt(row.total_items, 10),
    availableCount: parseInt(row.available_count, 10),
    lowStockCount: parseInt(row.low_stock_count, 10),
    outOfStockCount: parseInt(row.out_of_stock_count, 10)
  };
};

/**
 * Add stock entry for a medicine (Approved Vendor Only)
 */
export const addInventoryItem = async (vendorId, data) => {
  await verifyApprovedVendor(vendorId);

  const { medicine_id, stock_quantity, price, min_stock_level } = data;

  if (!medicine_id || stock_quantity === undefined || price === undefined) {
    throw { statusCode: 400, message: 'Medicine selection, stock quantity, and price are required.' };
  }

  const qty = parseInt(stock_quantity, 10);
  const prc = parseFloat(price);
  const minLvl = min_stock_level !== undefined ? parseInt(min_stock_level, 10) : 5;

  if (isNaN(qty) || qty < 0) {
    throw { statusCode: 400, message: 'Stock quantity must be a non-negative integer.' };
  }
  if (isNaN(prc) || prc < 0) {
    throw { statusCode: 400, message: 'Price must be a non-negative number.' };
  }
  if (isNaN(minLvl) || minLvl < 0) {
    throw { statusCode: 400, message: 'Minimum stock level must be a non-negative integer.' };
  }

  // Check duplicate vendor + medicine inventory
  const existing = await query(
    `SELECT id FROM inventories WHERE vendor_id = $1 AND medicine_id = $2`,
    [vendorId, medicine_id]
  );

  if (existing.rows.length > 0) {
    throw { statusCode: 400, message: 'This medicine is already in your active inventory. Please update the existing stock line instead.' };
  }

  const result = await query(
    `INSERT INTO inventories (vendor_id, medicine_id, stock_quantity, price, min_stock_level, last_updated)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
     RETURNING id, vendor_id, medicine_id, stock_quantity, price, min_stock_level, last_updated, created_at`,
    [vendorId, medicine_id, qty, prc, minLvl]
  );

  const newItem = result.rows[0];

  // Calculate status
  let stock_status = 'AVAILABLE';
  if (newItem.stock_quantity === 0) stock_status = 'OUT_OF_STOCK';
  else if (newItem.stock_quantity <= newItem.min_stock_level) stock_status = 'LOW_STOCK';

  if (newItem.stock_quantity > 0) {
    triggerRestockNotifications(newItem.medicine_id, vendorId);
  }

  return { ...newItem, stock_status };
};

/**
 * Update stock entry (Approved Vendor & Owner Only)
 */
export const updateInventoryItem = async (vendorId, inventoryId, data) => {
  await verifyApprovedVendor(vendorId);

  // Check ownership
  const check = await query(`SELECT * FROM inventories WHERE id = $1`, [inventoryId]);
  if (check.rows.length === 0) {
    throw { statusCode: 404, message: 'Inventory line not found.' };
  }

  const existing = check.rows[0];
  if (existing.vendor_id !== vendorId) {
    throw { statusCode: 403, message: 'Forbidden. You can only modify your own inventory.' };
  }

  const { stock_quantity, price, min_stock_level } = data;

  const newQty = stock_quantity !== undefined ? parseInt(stock_quantity, 10) : existing.stock_quantity;
  const newPrice = price !== undefined ? parseFloat(price) : parseFloat(existing.price);
  const newMin = min_stock_level !== undefined ? parseInt(min_stock_level, 10) : existing.min_stock_level;

  if (isNaN(newQty) || newQty < 0) {
    throw { statusCode: 400, message: 'Stock quantity must be a non-negative integer.' };
  }
  if (isNaN(newPrice) || newPrice < 0) {
    throw { statusCode: 400, message: 'Price must be a non-negative number.' };
  }
  if (isNaN(newMin) || newMin < 0) {
    throw { statusCode: 400, message: 'Minimum stock level must be a non-negative integer.' };
  }

  const result = await query(
    `UPDATE inventories
     SET stock_quantity = $1,
         price = $2,
         min_stock_level = $3,
         last_updated = CURRENT_TIMESTAMP
     WHERE id = $4 AND vendor_id = $5
     RETURNING id, vendor_id, medicine_id, stock_quantity, price, min_stock_level, last_updated`,
    [newQty, newPrice, newMin, inventoryId, vendorId]
  );

  const updatedItem = result.rows[0];

  let stock_status = 'AVAILABLE';
  if (updatedItem.stock_quantity === 0) stock_status = 'OUT_OF_STOCK';
  else if (updatedItem.stock_quantity <= updatedItem.min_stock_level) stock_status = 'LOW_STOCK';

  if (updatedItem.stock_quantity > 0) {
    triggerRestockNotifications(updatedItem.medicine_id, vendorId);
  }

  return { ...updatedItem, stock_status };
};

/**
 * Delete stock entry (Approved Vendor & Owner Only)
 */
export const deleteInventoryItem = async (vendorId, inventoryId) => {
  await verifyApprovedVendor(vendorId);

  const check = await query(`SELECT * FROM inventories WHERE id = $1`, [inventoryId]);
  if (check.rows.length === 0) {
    throw { statusCode: 404, message: 'Inventory line not found.' };
  }

  if (check.rows[0].vendor_id !== vendorId) {
    throw { statusCode: 403, message: 'Forbidden. You can only delete your own inventory.' };
  }

  await query(`DELETE FROM inventories WHERE id = $1 AND vendor_id = $2`, [inventoryId, vendorId]);
  return { id: inventoryId, deleted: true };
};
