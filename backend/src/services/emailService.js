import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@medicinefinder.com';
const SENDER_NAME = process.env.SENDER_NAME || 'Medicine Availability Finder';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Generic Brevo transactional email sender
 */
const sendBrevoEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  if (!BREVO_API_KEY || BREVO_API_KEY === 'dev_dummy_brevo_key') {
    console.log(`[Email Service (Dev Simulation)] To: ${toEmail} | Subject: "${subject}"`);
    return { success: true, simulated: true };
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: toEmail, name: toName || toEmail }],
        subject,
        htmlContent
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return { success: true, messageId: response.data?.messageId };
  } catch (error) {
    console.error('[Email Service Warning] Delivery failed or API key unconfigured:', error.response?.data?.message || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send email verification token
 */
export const sendVerificationEmail = async (email, name, token) => {
  const verificationLink = `${CLIENT_URL}/verify-email?token=${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0F172A; margin-bottom: 8px;">Medicine Availability Finder</h2>
      <h3 style="color: #0D9488; margin-top: 0;">Verify Your Account Email</h3>
      <p>Hello ${name},</p>
      <p>Thank you for registering on Medicine Availability Finder. Please verify your email address to activate your platform features.</p>
      <div style="margin: 25px 0;">
        <a href="${verificationLink}" style="background-color: #0D9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="font-size: 12px; color: #64748b;">Or copy this link to your browser: <br/><a href="${verificationLink}">${verificationLink}</a></p>
    </div>
  `;

  return sendBrevoEmail({
    toEmail: email,
    toName: name,
    subject: 'Verify your Medicine Availability Finder account',
    htmlContent
  });
};

/**
 * Send password reset token link
 */
export const sendPasswordResetEmail = async (email, name, token) => {
  const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0F172A; margin-bottom: 8px;">Medicine Availability Finder</h2>
      <h3 style="color: #0D9488; margin-top: 0;">Password Reset Request</h3>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password. Click the button below to set a new password. This link will expire in 1 hour.</p>
      <div style="margin: 25px 0;">
        <a href="${resetLink}" style="background-color: #0F172A; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
    </div>
  `;

  return sendBrevoEmail({
    toEmail: email,
    toName: name,
    subject: 'Reset your Medicine Availability Finder password',
    htmlContent
  });
};

/**
 * Send Vendor Account Approval Email Notification
 */
export const sendVendorApprovalEmail = async (email, name, businessName, vendorType) => {
  const loginLink = `${CLIENT_URL}/login`;
  const typeLabel = vendorType === 'PHARMACY' ? 'Pharmacy' : 'Medical Agency';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0F172A; margin-bottom: 8px;">Medicine Availability Finder</h2>
      <h3 style="color: #059669; margin-top: 0;">Vendor Account Approved!</h3>
      <p>Hello ${name},</p>
      <p>We are pleased to inform you that your registration for <strong>${businessName}</strong> (${typeLabel}) has been <strong>APPROVED</strong> by the platform administrator.</p>
      <p>You can now log in to publish searchable medicine inventory and receive stock reservation requests from patients.</p>
      <div style="margin: 25px 0;">
        <a href="${loginLink}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Vendor Dashboard</a>
      </div>
    </div>
  `;

  return sendBrevoEmail({
    toEmail: email,
    toName: name,
    subject: 'Your Medicine Availability Finder vendor account has been approved',
    htmlContent
  });
};

/**
 * Send Vendor Account Rejection Email Notification
 */
export const sendVendorRejectionEmail = async (email, name, businessName, reason) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0F172A; margin-bottom: 8px;">Medicine Availability Finder</h2>
      <h3 style="color: #DC2626; margin-top: 0;">Vendor Registration Update</h3>
      <p>Hello ${name},</p>
      <p>Your vendor registration request for <strong>${businessName}</strong> requires attention and could not be approved at this time.</p>
      ${reason ? `<div style="padding: 12px; background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #991B1B;"><strong>Reason:</strong> ${reason}</div>` : ''}
      <p>Please contact support or re-verify your registration documentation if you wish to appeal.</p>
    </div>
  `;

  return sendBrevoEmail({
    toEmail: email,
    toName: name,
    subject: 'Your vendor registration requires attention',
    htmlContent
  });
};
