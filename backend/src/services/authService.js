import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../config/db.js';
import { generateToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';

/**
 * Register User (Patient, Pharmacy, or Medical Agency)
 */
export const registerUser = async (data) => {
  const {
    email,
    password,
    full_name,
    phone,
    role,
    // Vendor Fields (optional if PATIENT)
    business_name,
    license_number,
    address,
    city,
    state,
    pincode,
    vendor_type
  } = data;

  const validRoles = ['PATIENT', 'PHARMACY', 'MEDICAL_AGENCY'];
  if (!validRoles.includes(role)) {
    throw { statusCode: 400, message: 'Invalid registration role. Must be PATIENT, PHARMACY, or MEDICAL_AGENCY.' };
  }

  // Check duplicate email
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (existingUser.rows.length > 0) {
    throw { statusCode: 400, message: 'Email address is already registered.' };
  }

  // Validate Vendor Fields if Pharmacy/Agency
  let normalizedVendorType = null;
  if (role === 'PHARMACY' || role === 'MEDICAL_AGENCY') {
    normalizedVendorType = role;
    if (!business_name || !license_number || !address || !city || !state || !pincode) {
      throw { statusCode: 400, message: 'All business and address fields are required for vendor registration.' };
    }

    const existingVendor = await query('SELECT id FROM vendors WHERE license_number = $1', [license_number.trim()]);
    if (existingVendor.rows.length > 0) {
      throw { statusCode: 400, message: 'Vendor license number is already registered.' };
    }
  }

  // Hash Password securely
  const password_hash = await bcrypt.hash(password, 10);

  // Begin DB transaction/queries
  const userResult = await query(
    `INSERT INTO users (email, password_hash, role, full_name, phone, is_email_verified)
     VALUES ($1, $2, $3, $4, $5, FALSE)
     RETURNING id, email, role, full_name, phone, is_email_verified, created_at`,
    [email.toLowerCase().trim(), password_hash, role, full_name.trim(), phone.trim()]
  );

  const newUser = userResult.rows[0];
  let vendorData = null;

  if (role === 'PHARMACY' || role === 'MEDICAL_AGENCY') {
    const vendorResult = await query(
      `INSERT INTO vendors 
        (user_id, business_name, vendor_type, license_number, phone, email, address, city, state, pincode, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
       RETURNING id, business_name, vendor_type, license_number, status, city, state, pincode`,
      [
        newUser.id,
        business_name.trim(),
        normalizedVendorType,
        license_number.trim(),
        phone.trim(),
        email.toLowerCase().trim(),
        address.trim(),
        city.trim(),
        state.trim(),
        pincode.trim()
      ]
    );
    vendorData = vendorResult.rows[0];
  }

  // Generate Email Verification Token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await query(
    `INSERT INTO email_verifications (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [newUser.id, verificationToken, expiresAt]
  );

  // Trigger Brevo verification email (async)
  sendVerificationEmail(newUser.email, newUser.full_name, verificationToken);

  return {
    user: newUser,
    vendor: vendorData
  };
};

/**
 * Authenticate User Login
 */
export const loginUser = async (email, password) => {
  if (!email || !password) {
    throw { statusCode: 400, message: 'Email and password are required.' };
  }

  const userResult = await query(
    `SELECT u.id, u.email, u.password_hash, u.role, u.full_name, u.phone, u.is_email_verified,
            v.id as vendor_id, v.business_name, v.vendor_type, v.status as vendor_status
     FROM users u
     LEFT JOIN vendors v ON v.user_id = u.id
     WHERE LOWER(u.email) = $1`,
    [email.toLowerCase().trim()]
  );

  if (userResult.rows.length === 0) {
    throw { statusCode: 401, message: 'Invalid email or password.' };
  }

  const user = userResult.rows[0];

  // Compare Password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid email or password.' };
  }

  // Generate JWT Token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    vendorId: user.vendor_id || null
  });

  const { password_hash, ...userProfile } = user;

  return {
    token,
    user: userProfile
  };
};

/**
 * Verify Email Token
 */
export const verifyEmailToken = async (token) => {
  if (!token) {
    throw { statusCode: 400, message: 'Verification token is required.' };
  }

  const tokenResult = await query(
    `SELECT user_id, expires_at FROM email_verifications WHERE token = $1`,
    [token]
  );

  if (tokenResult.rows.length === 0) {
    throw { statusCode: 400, message: 'Invalid or expired verification token.' };
  }

  const record = tokenResult.rows[0];
  if (new Date(record.expires_at) < new Date()) {
    await query('DELETE FROM email_verifications WHERE token = $1', [token]);
    throw { statusCode: 400, message: 'Verification token has expired. Please request a new one.' };
  }

  // Update user as verified
  await query('UPDATE users SET is_email_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [record.user_id]);
  await query('DELETE FROM email_verifications WHERE user_id = $1', [record.user_id]);

  return true;
};

/**
 * Request Password Reset Email Token
 */
export const requestPasswordReset = async (email) => {
  if (!email) {
    throw { statusCode: 400, message: 'Email address is required.' };
  }

  const userResult = await query('SELECT id, full_name, email FROM users WHERE LOWER(email) = $1', [email.toLowerCase().trim()]);

  // Generic message to prevent enumeration
  const genericResponse = { message: 'If an account with that email exists, a password reset link has been sent.' };

  if (userResult.rows.length === 0) {
    return genericResponse;
  }

  const user = userResult.rows[0];
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, resetToken, expiresAt]
  );

  sendPasswordResetEmail(user.email, user.full_name, resetToken);

  return genericResponse;
};

/**
 * Reset Password using Token
 */
export const resetPasswordWithToken = async (token, newPassword) => {
  if (!token || !newPassword) {
    throw { statusCode: 400, message: 'Reset token and new password are required.' };
  }

  if (newPassword.length < 6) {
    throw { statusCode: 400, message: 'Password must be at least 6 characters long.' };
  }

  const tokenResult = await query(
    `SELECT user_id, expires_at, is_used FROM password_reset_tokens WHERE token = $1`,
    [token]
  );

  if (tokenResult.rows.length === 0 || tokenResult.rows[0].is_used) {
    throw { statusCode: 400, message: 'Invalid or already used password reset token.' };
  }

  const record = tokenResult.rows[0];
  if (new Date(record.expires_at) < new Date()) {
    throw { statusCode: 400, message: 'Password reset token has expired.' };
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update password & mark token as used
  await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newPasswordHash, record.user_id]);
  await query('UPDATE password_reset_tokens SET is_used = TRUE WHERE token = $1', [token]);

  return true;
};
