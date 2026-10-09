import { query } from '../config/db.js';
import { sendVendorApprovalEmail, sendVendorRejectionEmail } from './emailService.js';

/**
 * Get vendor profile by user_id (for authenticated vendor)
 */
export const getVendorByUserId = async (userId) => {
  const result = await query(
    `SELECT v.*, u.full_name as owner_name, u.email as user_email
     FROM vendors v
     JOIN users u ON u.id = v.user_id
     WHERE v.user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Vendor profile not found for this user.' };
  }

  return result.rows[0];
};

/**
 * Get public vendor details by vendor_id
 * Only returns details if vendor status is APPROVED
 */
export const getPublicVendorById = async (vendorId) => {
  const result = await query(
    `SELECT id, business_name, vendor_type, license_number, phone, email, address, city, state, pincode, status, created_at
     FROM vendors
     WHERE id = $1`,
    [vendorId]
  );

  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Vendor not found.' };
  }

  const vendor = result.rows[0];

  if (vendor.status !== 'APPROVED') {
    throw { statusCode: 403, message: 'Vendor account is currently pending administrative verification.' };
  }

  return vendor;
};

/**
 * Admin: List vendors with optional filters
 */
export const getAdminVendorList = async ({ status, vendor_type, search }) => {
  let sql = `
    SELECT v.id, v.user_id, v.business_name, v.vendor_type, v.license_number, 
           v.phone, v.email, v.address, v.city, v.state, v.pincode, 
           v.status, v.rejection_reason, v.created_at, v.updated_at,
           u.full_name as owner_name, u.email as owner_email, u.is_email_verified
    FROM vendors v
    JOIN users u ON u.id = v.user_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    params.push(status.toUpperCase());
    sql += ` AND v.status = $${params.length}`;
  }

  if (vendor_type) {
    params.push(vendor_type.toUpperCase());
    sql += ` AND v.vendor_type = $${params.length}`;
  }

  if (search) {
    params.push(`%${search.trim()}%`);
    sql += ` AND (v.business_name ILIKE $${params.length} OR v.license_number ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR v.city ILIKE $${params.length})`;
  }

  sql += ` ORDER BY v.created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Admin: Get aggregated vendor metrics
 */
export const getAdminVendorStats = async () => {
  const result = await query(`
    SELECT 
      COUNT(*) as total_vendors,
      COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
      COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_count,
      COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count,
      COUNT(*) FILTER (WHERE vendor_type = 'PHARMACY') as pharmacy_count,
      COUNT(*) FILTER (WHERE vendor_type = 'MEDICAL_AGENCY') as agency_count
    FROM vendors
  `);

  const row = result.rows[0];
  return {
    totalVendors: parseInt(row.total_vendors, 10),
    pendingCount: parseInt(row.pending_count, 10),
    approvedCount: parseInt(row.approved_count, 10),
    rejectedCount: parseInt(row.rejected_count, 10),
    pharmacyCount: parseInt(row.pharmacy_count, 10),
    agencyCount: parseInt(row.agency_count, 10)
  };
};

/**
 * Admin: Approve or Reject a Vendor Account
 */
export const updateVendorApprovalStatus = async (vendorId, newStatus, rejectionReason = null) => {
  if (!['APPROVED', 'REJECTED'].includes(newStatus)) {
    throw { statusCode: 400, message: 'Invalid approval status. Must be APPROVED or REJECTED.' };
  }

  // Fetch current vendor & user info
  const checkResult = await query(
    `SELECT v.*, u.full_name as owner_name, u.email as user_email
     FROM vendors v
     JOIN users u ON u.id = v.user_id
     WHERE v.id = $1`,
    [vendorId]
  );

  if (checkResult.rows.length === 0) {
    throw { statusCode: 404, message: 'Vendor record not found.' };
  }

  const vendor = checkResult.rows[0];

  // Update status in DB
  const updateResult = await query(
    `UPDATE vendors 
     SET status = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING id, business_name, vendor_type, status, rejection_reason, updated_at`,
    [newStatus, newStatus === 'REJECTED' ? (rejectionReason || 'Documentation requirements not met') : null, vendorId]
  );

  const updatedVendor = updateResult.rows[0];

  // Dispatch Brevo Email Notification (Async)
  if (newStatus === 'APPROVED') {
    sendVendorApprovalEmail(vendor.user_email, vendor.owner_name, vendor.business_name, vendor.vendor_type);
  } else {
    sendVendorRejectionEmail(vendor.user_email, vendor.owner_name, vendor.business_name, updatedVendor.rejection_reason);
  }

  return updatedVendor;
};
