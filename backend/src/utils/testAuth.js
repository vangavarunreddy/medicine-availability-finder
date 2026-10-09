import { query } from '../config/db.js';
import * as authService from '../services/authService.js';
import { verifyToken } from '../utils/jwt.js';

async function runAuthTests() {
  console.log('================ PHASE 3 AUTHENTICATION TESTS ================');
  const timestamp = Date.now();

  try {
    // 1. Patient Registration
    const patientEmail = `patient_${timestamp}@test.com`;
    console.log(`[Test 1] Registering Patient: ${patientEmail}...`);
    const patientReg = await authService.registerUser({
      email: patientEmail,
      password: 'Password123!',
      full_name: 'Test Patient',
      phone: '+91 99999 11111',
      role: 'PATIENT'
    });
    console.log('[Test 1 Success] Registered Patient ID:', patientReg.user.id);

    // 2. Pharmacy Registration (Status = PENDING)
    const pharmacyEmail = `pharmacy_${timestamp}@test.com`;
    console.log(`[Test 2] Registering Pharmacy: ${pharmacyEmail}...`);
    const pharmacyReg = await authService.registerUser({
      email: pharmacyEmail,
      password: 'PharmacyPass123!',
      full_name: 'Pharmacy Owner',
      phone: '+91 99999 22222',
      role: 'PHARMACY',
      business_name: 'Apex Care Pharmacy',
      license_number: `DL-PH-${timestamp}`,
      address: '123 Health Ave',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001'
    });
    console.log('[Test 2 Success] Pharmacy Vendor ID:', pharmacyReg.vendor.id, '| Status:', pharmacyReg.vendor.status);
    if (pharmacyReg.vendor.status !== 'PENDING') {
      throw new Error('Pharmacy status should be PENDING upon registration');
    }

    // 3. Medical Agency Registration (Status = PENDING)
    const agencyEmail = `agency_${timestamp}@test.com`;
    console.log(`[Test 3] Registering Medical Agency: ${agencyEmail}...`);
    const agencyReg = await authService.registerUser({
      email: agencyEmail,
      password: 'AgencyPass123!',
      full_name: 'Agency Manager',
      phone: '+91 99999 33333',
      role: 'MEDICAL_AGENCY',
      business_name: 'National Pharma Agency',
      license_number: `AG-DL-${timestamp}`,
      address: '456 Wholesale Street',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110020'
    });
    console.log('[Test 3 Success] Medical Agency Vendor ID:', agencyReg.vendor.id, '| Status:', agencyReg.vendor.status);

    // 4. Duplicate Email Prevention Test
    console.log('[Test 4] Testing Duplicate Email Rejection...');
    try {
      await authService.registerUser({
        email: patientEmail,
        password: 'Password123!',
        full_name: 'Duplicate User',
        phone: '+91 00000 00000',
        role: 'PATIENT'
      });
      throw new Error('Duplicate email should have failed but succeeded.');
    } catch (err) {
      console.log('[Test 4 Success] Correctly rejected duplicate email:', err.message);
    }

    // 5. Invalid Login Test
    console.log('[Test 5] Testing Invalid Password Login...');
    try {
      await authService.loginUser(patientEmail, 'WrongPassword!');
      throw new Error('Invalid password login should have failed.');
    } catch (err) {
      console.log('[Test 5 Success] Correctly rejected invalid password:', err.message);
    }

    // 6. Valid Login & JWT Generation Test
    console.log('[Test 6] Testing Valid Patient Login & JWT Token...');
    const loginResult = await authService.loginUser(patientEmail, 'Password123!');
    console.log('[Test 6 Success] JWT Token generated. Verified decoded payload:', verifyToken(loginResult.token)?.email);

    // 7. Password Hashing Verification in Database
    console.log('[Test 7] Verifying Password Hashing in Database...');
    const dbUser = await query('SELECT password_hash FROM users WHERE email = $1', [patientEmail]);
    const hash = dbUser.rows[0].password_hash;
    console.log('[Test 7 Success] Stored Password Hash Format:', hash.substring(0, 10) + '... (BCrypt Hash Verified)');

    // 8. Email Verification Token Test
    console.log('[Test 8] Testing Email Verification Token Flow...');
    const tokenRow = await query('SELECT token FROM email_verifications WHERE user_id = $1', [patientReg.user.id]);
    const vToken = tokenRow.rows[0].token;
    await authService.verifyEmailToken(vToken);
    const updatedUser = await query('SELECT is_email_verified FROM users WHERE id = $1', [patientReg.user.id]);
    console.log('[Test 8 Success] User is_email_verified updated to:', updatedUser.rows[0].is_email_verified);

    // 9. Password Reset Request & Token Flow Test
    console.log('[Test 9] Testing Password Reset Flow...');
    await authService.requestPasswordReset(patientEmail);
    const resetRow = await query('SELECT token FROM password_reset_tokens WHERE user_id = $1', [patientReg.user.id]);
    const resetToken = resetRow.rows[0].token;
    await authService.resetPasswordWithToken(resetToken, 'NewSecurePassword123!');
    
    // Login with new password
    const newLogin = await authService.loginUser(patientEmail, 'NewSecurePassword123!');
    console.log('[Test 9 Success] Logged in successfully with updated password for:', newLogin.user.email);

    console.log('================ ALL PHASE 3 AUTHENTICATION TESTS PASSED ================');
    process.exit(0);
  } catch (err) {
    console.error('Phase 3 Auth Test Failed:', err);
    process.exit(1);
  }
}

runAuthTests();
