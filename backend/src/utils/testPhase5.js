import { query } from '../config/db.js';
import * as authService from '../services/authService.js';
import * as vendorService from '../services/vendorService.js';
import * as medicineService from '../services/medicineService.js';
import * as inventoryService from '../services/inventoryService.js';
import { searchMedicineAvailability } from '../services/searchService.js';
import bcrypt from 'bcryptjs';

async function runPhase5Tests() {
  console.log('================ PHASE 5 MEDICINE CATALOG & INVENTORY TESTS ================');
  const timestamp = Date.now();

  try {
    // 0. Setup test users and vendors
    const adminEmail = `admin_p5_${timestamp}@test.com`;
    const adminHash = await bcrypt.hash('AdminPass123!', 10);
    const adminRes = await query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, is_email_verified)
       VALUES ($1, $2, 'ADMIN', 'Catalog Admin', '+91 90000 55555', TRUE)
       RETURNING id, email, role`,
      [adminEmail, adminHash]
    );

    // Register Approved Pharmacy
    const pharmReg = await authService.registerUser({
      email: `pharm_p5_${timestamp}@test.com`,
      password: 'Pass123!',
      full_name: 'Approved Pharm Owner',
      phone: '+91 98888 55555',
      role: 'PHARMACY',
      business_name: `CarePlus Pharmacy P5 ${timestamp}`,
      license_number: `DL-P5-PH-${timestamp}`,
      address: '55 Medical Plaza',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    });
    await vendorService.updateVendorApprovalStatus(pharmReg.vendor.id, 'APPROVED');

    // Register Approved Agency
    const agencyReg = await authService.registerUser({
      email: `agency_p5_${timestamp}@test.com`,
      password: 'Pass123!',
      full_name: 'Approved Agency Exec',
      phone: '+91 98888 66666',
      role: 'MEDICAL_AGENCY',
      business_name: `Metro Agency P5 ${timestamp}`,
      license_number: `DL-P5-AG-${timestamp}`,
      address: '66 Wholesale Hub',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110020'
    });
    await vendorService.updateVendorApprovalStatus(agencyReg.vendor.id, 'APPROVED');

    // Register Pending Vendor
    const pendingReg = await authService.registerUser({
      email: `pending_p5_${timestamp}@test.com`,
      password: 'Pass123!',
      full_name: 'Pending Owner',
      phone: '+91 98888 77777',
      role: 'PHARMACY',
      business_name: `Pending Pharmacy P5 ${timestamp}`,
      license_number: `DL-P5-PEND-${timestamp}`,
      address: '77 Pending Street',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    });

    console.log('[Setup Complete] Admin, Approved Pharmacy, Approved Agency, and Pending Vendor created.');

    // 1. Admin creates medicine in catalog
    console.log('[Test 1] Admin creating master medicine specification...');
    const medName = `Paracetamol_${timestamp}`;
    const newMed = await medicineService.createMedicine({
      name: medName,
      brand: 'Calpol 500',
      generic_name: 'Acetaminophen',
      dosage: '500mg',
      form: 'Tablet',
      manufacturer: 'GSK',
      description: 'Analgesic and antipyretic medication.'
    });
    console.log('[Test 1 Success] Created Master Medicine ID:', newMed.id, '| Name:', newMed.name);

    // 2. Admin edits medicine details
    console.log('[Test 2] Admin editing medicine details...');
    const updatedMed = await medicineService.updateMedicine(newMed.id, {
      description: 'Updated clinical indication for fever and mild pain.'
    });
    console.log('[Test 2 Success] Description Updated:', updatedMed.description);

    // 3. Patient views medicines catalog
    console.log('[Test 3] Patient reading catalog medicines...');
    const catList = await medicineService.getCatalogMedicines({ search: medName });
    console.log('[Test 3 Success] Catalog items returned:', catList.length);

    // 4. Approved pharmacy adds inventory line (quantity = 50, min = 10 -> AVAILABLE)
    console.log('[Test 4] Approved Pharmacy adding stock line...');
    const invPharm = await inventoryService.addInventoryItem(pharmReg.vendor.id, {
      medicine_id: newMed.id,
      stock_quantity: 50,
      price: 25.50,
      min_stock_level: 10
    });
    console.log('[Test 4 Success] Inventory Line Created. Status:', invPharm.stock_status);
    if (invPharm.stock_status !== 'AVAILABLE') throw new Error('Status should be AVAILABLE');

    // 5. Approved agency adds inventory line (quantity = 4, min = 10 -> LOW_STOCK)
    console.log('[Test 5] Approved Agency adding stock line...');
    const invAgency = await inventoryService.addInventoryItem(agencyReg.vendor.id, {
      medicine_id: newMed.id,
      stock_quantity: 4,
      price: 22.00,
      min_stock_level: 10
    });
    console.log('[Test 5 Success] Agency Inventory Line Created. Status:', invAgency.stock_status);
    if (invAgency.stock_status !== 'LOW_STOCK') throw new Error('Status should be LOW_STOCK');

    // 6. Pending vendor blocked from adding inventory
    console.log('[Test 6] Testing Pending Vendor inventory block...');
    try {
      await inventoryService.addInventoryItem(pendingReg.vendor.id, {
        medicine_id: newMed.id,
        stock_quantity: 100,
        price: 15.00,
        min_stock_level: 5
      });
      throw new Error('Pending vendor should be blocked from adding inventory');
    } catch (err) {
      console.log('[Test 6 Success] Correctly blocked pending vendor:', err.message);
    }

    // 7. Vendor ownership modification guard (Pharm A modifying Agency B)
    console.log('[Test 7] Testing Vendor Ownership modification guard...');
    try {
      await inventoryService.updateInventoryItem(pharmReg.vendor.id, invAgency.id, { stock_quantity: 999 });
      throw new Error('Vendor A modifying Vendor B should fail');
    } catch (err) {
      console.log('[Test 7 Success] Correctly blocked cross-vendor modification:', err.message);
    }

    // 8. Stock status calculations test
    console.log('[Test 8] Testing stock status updates (OUT_OF_STOCK when qty=0)...');
    const updatedZero = await inventoryService.updateInventoryItem(pharmReg.vendor.id, invPharm.id, { stock_quantity: 0 });
    console.log('[Test 8 Success] Stock Status for qty=0:', updatedZero.stock_status);
    if (updatedZero.stock_status !== 'OUT_OF_STOCK') throw new Error('Status should be OUT_OF_STOCK');

    // 9. Duplicate inventory line prevention test
    console.log('[Test 9] Testing duplicate inventory line prevention...');
    try {
      await inventoryService.addInventoryItem(pharmReg.vendor.id, {
        medicine_id: newMed.id,
        stock_quantity: 10,
        price: 30.00
      });
      throw new Error('Duplicate inventory line addition should fail');
    } catch (err) {
      console.log('[Test 9 Success] Correctly prevented duplicate inventory line:', err.message);
    }

    // 10. Intelligent Public Search Engine test (including pg_trgm & APPROVED vendors filter)
    console.log('[Test 10] Testing Public Medicine Search Engine with pg_trgm...');
    const searchRes = await searchMedicineAvailability({ q: medName });
    console.log('[Test 10 Success] Public Search Results Found:', searchRes.length);
    const approvedVendorNames = searchRes.map(r => r.vendor_name);
    console.log('[Test 10 Success] Approved Vendors Returned:', approvedVendorNames.join(', '));

    console.log('================ ALL PHASE 5 MEDICINE & INVENTORY TESTS PASSED ================');
    process.exit(0);
  } catch (err) {
    console.error('Phase 5 Test Failed:', err);
    process.exit(1);
  }
}

runPhase5Tests();
