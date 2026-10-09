import { query } from '../config/db.js';
import { sendBrevoEmail } from './emailService.js';

/**
 * Patient submits a medicine availability reservation request
 */
export const createMedicineRequest = async (userId, data) => {
  const { vendor_id, medicine_id, requested_quantity = 1, notes = '' } = data;

  if (!vendor_id || !medicine_id) {
    throw { statusCode: 400, message: 'Vendor ID and Medicine ID are required.' };
  }

  const qty = parseInt(requested_quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    throw { statusCode: 400, message: 'Requested quantity must be at least 1.' };
  }

  // Verify vendor is APPROVED
  const vendorRes = await query('SELECT id, business_name, email, phone, status FROM vendors WHERE id = $1', [vendor_id]);
  if (vendorRes.rows.length === 0 || vendorRes.rows[0].status !== 'APPROVED') {
    throw { statusCode: 400, message: 'Cannot submit request to unapproved or inactive vendor.' };
  }
  const vendor = vendorRes.rows[0];

  // Verify medicine exists
  const medRes = await query('SELECT id, name, brand, dosage, form FROM medicines WHERE id = $1 AND is_active = TRUE', [medicine_id]);
  if (medRes.rows.length === 0) {
    throw { statusCode: 404, message: 'Medicine specification not found.' };
  }
  const medicine = medRes.rows[0];

  const result = await query(
    `INSERT INTO medicine_requests (user_id, vendor_id, medicine_id, requested_quantity, status, notes)
     VALUES ($1, $2, $3, $4, 'PENDING', $5)
     RETURNING id, user_id, vendor_id, medicine_id, requested_quantity, status, notes, created_at`,
    [userId, vendor_id, medicine_id, qty, notes ? notes.trim() : null]
  );

  const requestRecord = result.rows[0];

  // Fetch patient profile
  const userRes = await query('SELECT full_name, email, phone FROM users WHERE id = $1', [userId]);
  const patient = userRes.rows[0];

  // Notify vendor by Brevo Email (Async)
  sendBrevoEmail({
    toEmail: vendor.email,
    toName: vendor.business_name,
    subject: `New Medicine Reservation Request - ${medicine.name}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0F172A; margin-bottom: 8px;">Medicine Availability Finder</h2>
        <h3 style="color: #0D9488; margin-top: 0;">New Reservation Request Received</h3>
        <p>Hello <strong>${vendor.business_name}</strong>,</p>
        <p>A patient has submitted a reservation request for <strong>${medicine.name} (${medicine.brand} - ${medicine.dosage})</strong>.</p>
        <ul style="font-size: 14px; color: #334155;">
          <li><strong>Patient Name:</strong> ${patient.full_name}</li>
          <li><strong>Phone:</strong> ${patient.phone}</li>
          <li><strong>Requested Quantity:</strong> ${qty} units</li>
          ${notes ? `<li><strong>Patient Notes:</strong> ${notes}</li>` : ''}
        </ul>
        <p>Please log in to your Vendor Portal to update the order status.</p>
      </div>
    `
  });

  return {
    ...requestRecord,
    medicine_name: medicine.name,
    brand: medicine.brand,
    dosage: medicine.dosage,
    vendor_name: vendor.business_name
  };
};

/**
 * Get requests submitted by patient or received by vendor
 */
export const getUserOrVendorRequests = async (user) => {
  if (user.role === 'PATIENT') {
    const result = await query(
      `SELECT r.id, r.requested_quantity, r.status, r.notes, r.created_at, r.updated_at,
              m.id as medicine_id, m.name as medicine_name, m.brand, m.dosage, m.form,
              v.id as vendor_id, v.business_name as vendor_name, v.phone as vendor_phone, v.address, v.city
       FROM medicine_requests r
       JOIN medicines m ON m.id = r.medicine_id
       JOIN vendors v ON v.id = r.vendor_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [user.id]
    );
    return result.rows;
  }

  if (user.role === 'PHARMACY' || user.role === 'MEDICAL_AGENCY') {
    if (!user.vendor_id) return [];
    const result = await query(
      `SELECT r.id, r.requested_quantity, r.status, r.notes, r.created_at, r.updated_at,
              m.id as medicine_id, m.name as medicine_name, m.brand, m.dosage, m.form,
              u.full_name as patient_name, u.email as patient_email, u.phone as patient_phone
       FROM medicine_requests r
       JOIN medicines m ON m.id = r.medicine_id
       JOIN users u ON u.id = r.user_id
       WHERE r.vendor_id = $1
       ORDER BY r.created_at DESC`,
      [user.vendor_id]
    );
    return result.rows;
  }

  if (user.role === 'ADMIN') {
    const result = await query(
      `SELECT r.id, r.requested_quantity, r.status, r.notes, r.created_at,
              m.name as medicine_name, m.brand,
              v.business_name as vendor_name, v.vendor_type,
              u.full_name as patient_name
       FROM medicine_requests r
       JOIN medicines m ON m.id = r.medicine_id
       JOIN vendors v ON v.id = r.vendor_id
       JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC LIMIT 100`
    );
    return result.rows;
  }

  return [];
};

/**
 * Vendor updates reservation request status (FULFILLED, CANCELLED, OUT_OF_STOCK)
 */
export const updateRequestStatus = async (vendorId, requestId, status) => {
  const validStatuses = ['FULFILLED', 'CANCELLED', 'OUT_OF_STOCK'];
  if (!validStatuses.includes(status)) {
    throw { statusCode: 400, message: 'Invalid request status.' };
  }

  const reqCheck = await query('SELECT * FROM medicine_requests WHERE id = $1', [requestId]);
  if (reqCheck.rows.length === 0) {
    throw { statusCode: 404, message: 'Request not found.' };
  }

  const reqRecord = reqCheck.rows[0];
  if (reqRecord.vendor_id !== vendorId) {
    throw { statusCode: 403, message: 'Forbidden. You can only manage requests submitted to your vendor account.' };
  }

  const result = await query(
    `UPDATE medicine_requests 
     SET status = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING *`,
    [status, requestId]
  );

  const updatedReq = result.rows[0];

  // Notify patient of status update via Brevo email (Async)
  const patientRes = await query('SELECT full_name, email FROM users WHERE id = $1', [updatedReq.user_id]);
  const medRes = await query('SELECT name, brand FROM medicines WHERE id = $1', [updatedReq.medicine_id]);
  const vendRes = await query('SELECT business_name FROM vendors WHERE id = $1', [vendorId]);

  if (patientRes.rows.length > 0 && medRes.rows.length > 0) {
    const patient = patientRes.rows[0];
    const medicine = medRes.rows[0];
    const vendor = vendRes.rows[0];

    sendBrevoEmail({
      toEmail: patient.email,
      toName: patient.full_name,
      subject: `Order Status Update: ${medicine.name} - ${status}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0F172A; margin-bottom: 8px;">Medicine Availability Finder</h2>
          <h3 style="color: #0D9488; margin-top: 0;">Reservation Status Update</h3>
          <p>Hello ${patient.full_name},</p>
          <p>Your medicine reservation request for <strong>${medicine.name} (${medicine.brand})</strong> with <strong>${vendor.business_name}</strong> has been updated to: <strong style="color: #0D9488;">${status}</strong>.</p>
        </div>
      `
    });
  }

  return updatedReq;
};
