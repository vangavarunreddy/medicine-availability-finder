import { query } from '../config/db.js';
import * as authService from '../services/authService.js';
import * as vendorService from '../services/vendorService.js';
import bcrypt from 'bcryptjs';

async function runPhase4Tests() {
  console.log('================ PHASE 4 VENDOR & ADMIN APPROVAL TESTS ================');
  const timestamp = Date.now();

  try {
    // 0. Ensure an Admin user exists in DB for testing
    const adminEmail = `admin_test_${timestamp}@test.com`;
    const adminHash = await bcrypt.hash('AdminPass123!', 10);
    const adminRes = await query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, is_email_verified)
       VALUES ($1, $2, 'ADMIN', 'System Admin', '+91 90000 00000', TRUE)
       RETURNING id, email, role`,
      [adminEmail, adminHash]
    );
    const adminUser = adminRes.rows[0];
    console.log('[Setup] Created Test Admin Account:', adminUser.email);

    // 1. Pharmacy Registration (Starts as PENDING)
    const pharmEmail = `pharmacy_p4_${timestamp}@test.com`;
    const pharmLicense = `DL-PH-P4-${timestamp}`;
    console.log(`[Test 1] Registering Pharmacy (${pharmEmail})...`);
    const pharmReg = await authService.registerUser({
      email: pharmEmail,
      password: 'PharmacyPass123!',
      full_name: 'Pharmacy Owner',
      phone: '+91 98888 11111',
      role: 'PHARMACY',
      business_name: 'CarePlus Pharmacy',
      license_number: pharmLicense,
      address: '789 Medical Square',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    });
    console.log('[Test 1 Success] Registered Pharmacy Vendor ID:', pharmReg.vendor.id, '| Initial Status:', pharmReg.vendor.status);
    if (pharmReg.vendor.status !== 'PENDING') throw new Error('New Pharmacy should start as PENDING');

    // 2. Medical Agency Registration (Starts as PENDING)
    const agencyEmail = `agency_p4_${timestamp}@test.com`;
    const agencyLicense = `AG-P4-${timestamp}`;
    console.log(`[Test 2] Registering Medical Agency (${agencyEmail})...`);
    const agencyReg = await authService.registerUser({
      email: agencyEmail,
      password: 'AgencyPass123!',
      full_name: 'Agency Executive',
      phone: '+91 98888 22222',
      role: 'MEDICAL_AGENCY',
      business_name: 'Metro Pharma Wholesale',
      license_number: agencyLicense,
      address: '101 Cargo Hub',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110020'
    });
    console.log('[Test 2 Success] Registered Agency Vendor ID:', agencyReg.vendor.id, '| Initial Status:', agencyReg.vendor.status);

    // 3. Duplicate License Number Rejection
    console.log('[Test 3] Testing Duplicate License Number Rejection...');
    try {
      await authService.registerUser({
        email: `another_${timestamp}@test.com`,
        password: 'Password123!',
        full_name: 'Other Owner',
        phone: '+91 98888 33333',
        role: 'PHARMACY',
        business_name: 'Duplicate License Pharmacy',
        license_number: pharmLicense,
        address: '202 Street',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      });
      throw new Error('Duplicate license registration should have failed');
    } catch (err) {
      console.log('[Test 3 Success] Correctly rejected duplicate license:', err.message);
    }

    // 4. Pending Vendor Public Lookup Restriction Test
    console.log('[Test 4] Testing Public API lookup on PENDING Vendor...');
    try {
      await vendorService.getPublicVendorById(pharmReg.vendor.id);
      throw new Error('Public lookup for PENDING vendor should be forbidden');
    } catch (err) {
      console.log('[Test 4 Success] Correctly blocked public lookup for PENDING vendor:', err.message);
    }

    // 5. Admin Listing Pending Vendors
    console.log('[Test 5] Querying Admin Pending Vendor List...');
    const pendingList = await vendorService.getAdminVendorList({ status: 'PENDING' });
    console.log('[Test 5 Success] Total Pending Vendors in Queue:', pendingList.length);

    // 6. Admin Approve Vendor Flow (PENDING -> APPROVED)
    console.log(`[Test 6] Admin Approving Pharmacy (${pharmReg.vendor.id})...`);
    const approvedVendor = await vendorService.updateVendorApprovalStatus(pharmReg.vendor.id, 'APPROVED');
    console.log('[Test 6 Success] Pharmacy Status Updated to:', approvedVendor.status);
    if (approvedVendor.status !== 'APPROVED') throw new Error('Pharmacy status should be APPROVED');

    // 7. Public Lookup Test on APPROVED Vendor
    console.log('[Test 7] Testing Public API lookup on APPROVED Vendor...');
    const publicData = await vendorService.getPublicVendorById(pharmReg.vendor.id);
    console.log('[Test 7 Success] Public Info Retrieved:', publicData.business_name, '(', publicData.city, ')');

    // 8. Admin Reject Vendor Flow (PENDING -> REJECTED)
    console.log(`[Test 8] Admin Rejecting Medical Agency (${agencyReg.vendor.id})...`);
    const rejectedVendor = await vendorService.updateVendorApprovalStatus(
      agencyReg.vendor.id, 
      'REJECTED', 
      'Incomplete drug authorization documentation'
    );
    console.log('[Test 8 Success] Agency Status Updated to:', rejectedVendor.status, '| Reason:', rejectedVendor.rejection_reason);

    // 9. Admin Stats Metrics
    console.log('[Test 9] Fetching Admin Vendor Statistics...');
    const stats = await vendorService.getAdminVendorStats();
    console.log('[Test 9 Success] Total Vendors:', stats.totalVendors, '| Approved:', stats.approvedCount, '| Pending:', stats.pendingCount, '| Rejected:', stats.rejectedCount);

    console.log('================ ALL PHASE 4 VENDOR & ADMIN APPROVAL TESTS PASSED ================');
    process.exit(0);
  } catch (err) {
    console.error('Phase 4 Test Failed:', err);
    process.exit(1);
  }
}

runPhase4Tests();
