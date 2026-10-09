import { query } from '../config/db.js';
import * as authService from '../services/authService.js';
import * as vendorService from '../services/vendorService.js';
import * as medicineService from '../services/medicineService.js';
import * as inventoryService from '../services/inventoryService.js';
import * as requestService from '../services/requestService.js';
import * as notifyService from '../services/notifyService.js';
import { searchMedicineAvailability, getUserSearchHistory } from '../services/searchService.js';
import bcrypt from 'bcryptjs';

async function runCompleteApplicationTests() {
  console.log('================ FINAL COMPLETE APPLICATION INTEGRATION TEST SUITE ================');
  const timestamp = Date.now();

  try {
    // 1. Setup Admin Account
    const adminEmail = `admin_full_${timestamp}@test.com`;
    const adminHash = await bcrypt.hash('AdminPass123!', 10);
    const adminRes = await query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, is_email_verified)
       VALUES ($1, $2, 'ADMIN', 'System Admin', '+91 90000 88888', TRUE)
       RETURNING id, email, role`,
      [adminEmail, adminHash]
    );
    const adminUser = adminRes.rows[0];
    console.log('[Step 1] Admin Account verified:', adminUser.email);

    // 2. Setup Patient Account
    const patientReg = await authService.registerUser({
      email: `patient_full_${timestamp}@test.com`,
      password: 'PatientPass123!',
      full_name: 'John Patient',
      phone: '+91 98888 88888',
      role: 'PATIENT'
    });
    console.log('[Step 2] Patient Account verified:', patientReg.user.email);

    // 3. Setup Approved Pharmacy Account
    const pharmReg = await authService.registerUser({
      email: `pharmacy_full_${timestamp}@test.com`,
      password: 'PharmPass123!',
      full_name: 'Pharm Owner',
      phone: '+91 97777 77777',
      role: 'PHARMACY',
      business_name: `Apollo Care Pharmacy ${timestamp}`,
      license_number: `DL-FULL-PH-${timestamp}`,
      address: '100 Medical Center',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    });
    await vendorService.updateVendorApprovalStatus(pharmReg.vendor.id, 'APPROVED');
    console.log('[Step 3] Approved Pharmacy verified:', pharmReg.vendor.id);

    // 4. Admin creates Medicine Specification in Catalog
    const medName = `Amoxicillin_${timestamp}`;
    const newMed = await medicineService.createMedicine({
      name: medName,
      brand: 'Mox 500',
      generic_name: 'Amoxicillin Trihydrate',
      dosage: '500mg',
      form: 'Capsule',
      manufacturer: 'Ranbaxy',
      description: 'Broad spectrum antibiotic capsule.'
    });
    console.log('[Step 4] Master Catalog Medicine Created:', newMed.id, '| Name:', newMed.name);

    // 5. Approved Pharmacy adds stock item (Initial stock = 0 -> OUT_OF_STOCK)
    const invItem = await inventoryService.addInventoryItem(pharmReg.vendor.id, {
      medicine_id: newMed.id,
      stock_quantity: 0,
      price: 45.00,
      min_stock_level: 10
    });
    console.log('[Step 5] Pharmacy Inventory Line added. Initial Status:', invItem.stock_status);
    if (invItem.stock_status !== 'OUT_OF_STOCK') throw new Error('Initial status should be OUT_OF_STOCK');

    // 6. Patient subscribes to "Notify Me When Available" for out-of-stock medicine
    console.log('[Step 6] Patient subscribing to "Notify Me When Available"...');
    const subRecord = await notifyService.subscribeNotifyMe(patientReg.user.id, {
      medicine_id: newMed.id,
      vendor_id: pharmReg.vendor.id
    });
    console.log('[Step 6 Success] Notification Subscription ID:', subRecord.id);

    // 7. Pharmacy replenishes stock (qty = 50 -> AVAILABLE). Restock notification email triggered!
    console.log('[Step 7] Pharmacy replenishing stock to 50 units...');
    const updatedInv = await inventoryService.updateInventoryItem(pharmReg.vendor.id, invItem.id, {
      stock_quantity: 50
    });
    console.log('[Step 7 Success] Replenished Stock Status:', updatedInv.stock_status);

    // Verify subscription marked is_notified = TRUE
    const checkSub = await query('SELECT is_notified FROM notify_subscriptions WHERE id = $1', [subRecord.id]);
    console.log('[Step 7 Success] Subscription is_notified updated to:', checkSub.rows[0].is_notified);
    if (!checkSub.rows[0].is_notified) throw new Error('Subscription should be marked is_notified = true upon restock');

    // 8. Patient submits medicine reservation request
    console.log('[Step 8] Patient submitting medicine reservation request...');
    const reqRecord = await requestService.createMedicineRequest(patientReg.user.id, {
      vendor_id: pharmReg.vendor.id,
      medicine_id: newMed.id,
      requested_quantity: 2,
      notes: 'Urgent prescription requirement'
    });
    console.log('[Step 8 Success] Reservation Request Submitted. ID:', reqRecord.id, '| Status:', reqRecord.status);

    // 9. Pharmacy fulfills reservation request
    console.log('[Step 9] Pharmacy fulfilling reservation request...');
    const fulfilledReq = await requestService.updateRequestStatus(pharmReg.vendor.id, reqRecord.id, 'FULFILLED');
    console.log('[Step 9 Success] Request Status Updated to:', fulfilledReq.status);

    // 10. Intelligent Public Search Engine Query & Search History Recording
    console.log('[Step 10] Patient performing public availability search for fuzzy term "amoxicilin"...');
    const searchRes = await searchMedicineAvailability({
      q: 'amoxicilin',
      location: 'Delhi',
      userId: patientReg.user.id
    });
    console.log('[Step 10 Success] Search Engine returned results count:', searchRes.length);
    if (searchRes.length === 0) throw new Error('Fuzzy search using pg_trgm should have matched Amoxicillin');

    // Verify search history recorded
    const historyRes = await getUserSearchHistory(patientReg.user.id);
    console.log('[Step 10 Success] Search History Recorded entries:', historyRes.length, '| Term:', historyRes[0].query_text);

    console.log('================ ALL 10 INTEGRATION TESTS PASSED SUCCESSFULLY ================');
    process.exit(0);
  } catch (err) {
    console.error('Final Integration Test Failed:', err);
    process.exit(1);
  }
}

runCompleteApplicationTests();
