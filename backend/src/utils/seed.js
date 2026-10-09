import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * Safe, Idempotent Development Database Seeder for Medicine Availability Finder
 */
export async function seedDatabase() {
  console.log('================ STARTING SAFE DEVELOPMENT SEED SCRIPT ================');
  try {
    // 1. Ensure `is_demo` columns exist in vendors, medicines, and inventories tables
    await query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;`);
    await query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;`);
    await query(`ALTER TABLE inventories ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;`);

    // 2. Ensure `pg_trgm` extension is enabled for fuzzy search
    await query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    console.log('[Seed Step 1] Database schema & columns verified (is_demo columns active).');

    // Default password hash for demo accounts
    const passwordHash = await bcrypt.hash('DemoPass123!', 10);

    // 3. Seed Demo Users & Approved Vendors
    const vendorDefinitions = [
      {
        email: 'apollo.jubilee@pharmacy-demo.com',
        full_name: 'Apollo Pharmacy Manager',
        phone: '+91 91000 11001',
        role: 'PHARMACY',
        business_name: 'Apollo Pharmacy - Jubilee Hills',
        vendor_type: 'PHARMACY',
        license_number: 'HYD-PHARM-001',
        address: 'Plot 110, Road No 36, Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500033',
        latitude: 17.4319,
        longitude: 78.4071
      },
      {
        email: 'medplus.banjara@pharmacy-demo.com',
        full_name: 'MedPlus Store Incharge',
        phone: '+91 91000 11002',
        role: 'PHARMACY',
        business_name: 'MedPlus Pharmacy - Banjara Hills',
        vendor_type: 'PHARMACY',
        license_number: 'HYD-PHARM-002',
        address: 'Door No 8-2-293, Road No 12, Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500034',
        latitude: 17.4156,
        longitude: 78.4487
      },
      {
        email: 'wellness.madhapur@pharmacy-demo.com',
        full_name: 'Wellness Forever Manager',
        phone: '+91 91000 11003',
        role: 'PHARMACY',
        business_name: 'Wellness Forever - Madhapur',
        vendor_type: 'PHARMACY',
        license_number: 'HYD-PHARM-003',
        address: '101 Hitech City Main Rd, Madhapur',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        latitude: 17.4483,
        longitude: 78.3915
      },
      {
        email: 'care.gachibowli@pharmacy-demo.com',
        full_name: 'Care Pharmacy Owner',
        phone: '+91 91000 11004',
        role: 'PHARMACY',
        business_name: 'Care Pharmacy & Surgical - Gachibowli',
        vendor_type: 'PHARMACY',
        license_number: 'HYD-PHARM-004',
        address: 'Plot 45, Near DLF Cyber City, Gachibowli',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032',
        latitude: 17.4401,
        longitude: 78.3489
      },
      {
        email: 'srisai.ameerpet@pharmacy-demo.com',
        full_name: 'Sri Sai Stores Owner',
        phone: '+91 91000 11005',
        role: 'PHARMACY',
        business_name: 'Sri Sai Medical & General Stores - Ameerpet',
        vendor_type: 'PHARMACY',
        license_number: 'HYD-PHARM-005',
        address: 'Shop 12, Main Commercial Complex, Ameerpet',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500016',
        latitude: 17.4375,
        longitude: 78.4482
      },
      {
        email: 'standard.secunderabad@agency-demo.com',
        full_name: 'Standard Agency Director',
        phone: '+91 91000 11006',
        role: 'MEDICAL_AGENCY',
        business_name: 'Standard Medical Agency - Secunderabad',
        vendor_type: 'MEDICAL_AGENCY',
        license_number: 'HYD-AGNC-001',
        address: 'RP Road, Opp Clock Tower, Secunderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500003',
        latitude: 17.4399,
        longitude: 78.4983
      },
      {
        email: 'apex.kukatpally@agency-demo.com',
        full_name: 'Apex Wholesale Admin',
        phone: '+91 91000 11007',
        role: 'MEDICAL_AGENCY',
        business_name: 'Apex Pharma Wholesale Distributors - Kukatpally',
        vendor_type: 'MEDICAL_AGENCY',
        license_number: 'HYD-AGNC-002',
        address: 'Phase 3, KPHB Colony, Kukatpally',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500072',
        latitude: 17.4849,
        longitude: 78.4010
      }
    ];

    const vendorMap = new Map();

    for (const v of vendorDefinitions) {
      // Upsert User
      let userRes = await query('SELECT id FROM users WHERE email = $1', [v.email]);
      let userId;
      if (userRes.rows.length === 0) {
        userRes = await query(
          `INSERT INTO users (email, password_hash, role, full_name, phone, is_email_verified)
           VALUES ($1, $2, $3, $4, $5, TRUE)
           RETURNING id`,
          [v.email, passwordHash, v.role, v.full_name, v.phone]
        );
      }
      userId = userRes.rows[0].id;

      // Upsert Vendor
      let vendRes = await query('SELECT id FROM vendors WHERE user_id = $1 OR license_number = $2', [userId, v.license_number]);
      let vendorId;
      if (vendRes.rows.length === 0) {
        vendRes = await query(
          `INSERT INTO vendors (user_id, business_name, vendor_type, license_number, phone, email, address, city, state, pincode, latitude, longitude, status, is_demo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'APPROVED', TRUE)
           RETURNING id`,
          [userId, v.business_name, v.vendor_type, v.license_number, v.phone, v.email, v.address, v.city, v.state, v.pincode, v.latitude, v.longitude]
        );
      } else {
        await query(
          `UPDATE vendors SET status = 'APPROVED', is_demo = TRUE WHERE id = $1`,
          [vendRes.rows[0].id]
        );
      }
      vendorId = vendRes.rows[0].id;
      vendorMap.set(v.license_number, vendorId);
    }

    // Also seed 2 Demo Patient Users
    const patientUsers = [
      { email: 'demo_patient1@medfinder.com', name: 'Rahul Sharma', phone: '+91 98765 43210' },
      { email: 'demo_patient2@medfinder.com', name: 'Priya Patel', phone: '+91 98765 43211' }
    ];
    for (const p of patientUsers) {
      const checkP = await query('SELECT id FROM users WHERE email = $1', [p.email]);
      if (checkP.rows.length === 0) {
        await query(
          `INSERT INTO users (email, password_hash, role, full_name, phone, is_email_verified)
           VALUES ($1, $2, 'PATIENT', $3, $4, TRUE)`,
          [p.email, passwordHash, p.name, p.phone]
        );
      }
    }

    console.log(`[Seed Step 2] Seeded 7 Approved Vendors (5 Pharmacies, 2 Agencies) & 2 Demo Patients in Hyderabad.`);

    // 4. Seed 21 Master Medicines
    const medicineDefinitions = [
      { name: 'Paracetamol 500mg', brand: 'Dolo 500', generic_name: 'Paracetamol', dosage: '500mg', form: 'Tablet', manufacturer: 'Micro Labs', description: 'Antipyretic and analgesic tablet used for fever and mild to moderate pain relief.' },
      { name: 'Paracetamol 650mg', brand: 'Dolo 650', generic_name: 'Paracetamol', dosage: '650mg', form: 'Tablet', manufacturer: 'Micro Labs', description: 'Higher strength antipyretic for high fever, dengue body aches, and fever symptoms.' },
      { name: 'Cetirizine 10mg', brand: 'Okacet', generic_name: 'Cetirizine Hydrochloride', dosage: '10mg', form: 'Tablet', manufacturer: 'Cipla', description: 'Non-drowsy antihistamine tablet for allergic rhinitis, sneezing, and skin allergy relief.' },
      { name: 'Amoxicillin 500mg', brand: 'Mox 500', generic_name: 'Amoxicillin Trihydrate', dosage: '500mg', form: 'Capsule', manufacturer: 'Sun Pharma', description: 'Broad-spectrum penicillin antibiotic capsule for bacterial infections.' },
      { name: 'Azithromycin 500mg', brand: 'Azee 500', generic_name: 'Azithromycin', dosage: '500mg', form: 'Tablet', manufacturer: 'Cipla', description: 'Macrolide antibiotic for upper respiratory tract, throat, and sinus infections.' },
      { name: 'Metformin 500mg', brand: 'Glycomet 500', generic_name: 'Metformin Hydrochloride', dosage: '500mg', form: 'Tablet', manufacturer: 'USV Pharma', description: 'First-line oral antidiabetic medication for glycemic control in Type 2 diabetes.' },
      { name: 'Pantoprazole 40mg', brand: 'Pantocid 40', generic_name: 'Pantoprazole Sodium', dosage: '40mg', form: 'Tablet', manufacturer: 'Alkem Labs', description: 'Proton pump inhibitor (PPI) for GERD, acid reflux, gastritis, and peptic ulcers.' },
      { name: 'Ibuprofen 400mg', brand: 'Brufen 400', generic_name: 'Ibuprofen', dosage: '400mg', form: 'Tablet', manufacturer: 'Abbott India', description: 'Non-steroidal anti-inflammatory drug (NSAID) for muscle strain, arthritis, and toothache.' },
      { name: 'Amlodipine 5mg', brand: 'Amlokind 5', generic_name: 'Amlodipine Besylate', dosage: '5mg', form: 'Tablet', manufacturer: 'Mankind Pharma', description: 'Calcium channel blocker antihypertensive tablet for high blood pressure.' },
      { name: 'Atorvastatin 10mg', brand: 'Lipvas 10', generic_name: 'Atorvastatin Calcium', dosage: '10mg', form: 'Tablet', manufacturer: 'Zydus Cadila', description: 'Statin lipid-lowering medication used to manage blood cholesterol and cardiovascular risk.' },
      { name: 'Omeprazole 20mg', brand: 'Omez 20', generic_name: 'Omeprazole', dosage: '20mg', form: 'Capsule', manufacturer: "Dr. Reddy's Labs", description: 'Antacid capsule for suppressing stomach gastric acid secretion.' },
      { name: 'Montelukast 10mg', brand: 'Montair 10', generic_name: 'Montelukast Sodium', dosage: '10mg', form: 'Tablet', manufacturer: 'Cipla', description: 'Leukotriene receptor antagonist for asthma management and seasonal allergies.' },
      { name: 'Ciprofloxacin 500mg', brand: 'Ciplox 500', generic_name: 'Ciprofloxacin', dosage: '500mg', form: 'Tablet', manufacturer: 'Cipla', description: 'Fluoroquinolone antibiotic for urinary tract, typhoid, and GI tract infections.' },
      { name: 'Losartan 50mg', brand: 'Losar 50', generic_name: 'Losartan Potassium', dosage: '50mg', form: 'Tablet', manufacturer: 'Torrent Pharma', description: 'Angiotensin II receptor blocker (ARB) for blood pressure control.' },
      { name: 'Telmisartan 40mg', brand: 'Telma 40', generic_name: 'Telmisartan', dosage: '40mg', form: 'Tablet', manufacturer: 'Glenmark Pharma', description: 'Long-acting ARB antihypertensive medication.' },
      { name: 'Combiflam', brand: 'Combiflam', generic_name: 'Ibuprofen 400mg + Paracetamol 325mg', dosage: 'Combination', form: 'Tablet', manufacturer: 'Sanofi India', description: 'Dual-action analgesic and anti-inflammatory combination tablet.' },
      { name: 'Benadryl Cough Syrup', brand: 'Benadryl DR', generic_name: 'Diphenhydramine 14mg/5ml', dosage: '100ml', form: 'Syrup', manufacturer: 'Johnson & Johnson', description: 'Expectorant cough syrup for soothing dry throat and chest congestion.' },
      { name: 'Limcee 500mg', brand: 'Limcee', generic_name: 'Ascorbic Acid (Vitamin C)', dosage: '500mg', form: 'Tablet', manufacturer: 'Abbott India', description: 'Chewable Vitamin C supplement for immunity boost and antioxidant support.' },
      { name: 'Volini Pain Relief Gel', brand: 'Volini Gel', generic_name: 'Diclofenac Diethylamine 1.16%', dosage: '30g', form: 'Ointment', manufacturer: 'Sun Pharma', description: 'Topical pain relief gel for joint strain, muscle ache, back pain, and sprains.' },
      { name: 'Ciplox Eye Drops', brand: 'Ciplox Drops', generic_name: 'Ciprofloxacin 0.3% w/v', dosage: '10ml', form: 'Drops', manufacturer: 'Cipla', description: 'Antibacterial ophthalmic eye drops for conjunctivitis and red eye infections.' },
      { name: 'Augmentin 625 Duo', brand: 'Augmentin 625', generic_name: 'Amoxicillin 500mg + Clavulanic Acid 125mg', dosage: '625mg', form: 'Tablet', manufacturer: 'GSK', description: 'Penicillin-type antibiotic enhanced with beta-lactamase inhibitor for resistant infections.' }
    ];

    const medicineMap = new Map();

    for (const m of medicineDefinitions) {
      let medRes = await query(
        `SELECT id FROM medicines WHERE name = $1 AND dosage = $2 AND form = $3`,
        [m.name, m.dosage, m.form]
      );

      let medId;
      if (medRes.rows.length === 0) {
        medRes = await query(
          `INSERT INTO medicines (name, brand, generic_name, dosage, form, manufacturer, description, is_active, is_demo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE)
           RETURNING id`,
          [m.name, m.brand, m.generic_name, m.dosage, m.form, m.manufacturer, m.description]
        );
      } else {
        await query(`UPDATE medicines SET is_demo = TRUE WHERE id = $1`, [medRes.rows[0].id]);
      }
      medId = medRes.rows[0].id;
      medicineMap.set(m.name, medId);
    }

    console.log(`[Seed Step 3] Seeded 21 Master Catalog Medicines.`);

    // 5. Seed Inventory Entries for Each Vendor
    const inventoryData = [
      // Apollo Pharmacy - Jubilee Hills
      { lic: 'HYD-PHARM-001', med: 'Paracetamol 500mg', qty: 150, price: 18.50, min: 10 },
      { lic: 'HYD-PHARM-001', med: 'Paracetamol 650mg', qty: 200, price: 32.00, min: 15 },
      { lic: 'HYD-PHARM-001', med: 'Cetirizine 10mg', qty: 85, price: 42.00, min: 10 },
      { lic: 'HYD-PHARM-001', med: 'Amoxicillin 500mg', qty: 60, price: 78.50, min: 10 },
      { lic: 'HYD-PHARM-001', med: 'Azithromycin 500mg', qty: 0, price: 118.00, min: 10 }, // Out of stock
      { lic: 'HYD-PHARM-001', med: 'Pantoprazole 40mg', qty: 110, price: 95.00, min: 10 },
      { lic: 'HYD-PHARM-001', med: 'Combiflam', qty: 5, price: 45.00, min: 10 }, // Low stock
      { lic: 'HYD-PHARM-001', med: 'Augmentin 625 Duo', qty: 40, price: 210.00, min: 5 },

      // MedPlus Pharmacy - Banjara Hills
      { lic: 'HYD-PHARM-002', med: 'Paracetamol 650mg', qty: 180, price: 30.00, min: 15 },
      { lic: 'HYD-PHARM-002', med: 'Amoxicillin 500mg', qty: 95, price: 75.00, min: 10 },
      { lic: 'HYD-PHARM-002', med: 'Metformin 500mg', qty: 220, price: 52.00, min: 20 },
      { lic: 'HYD-PHARM-002', med: 'Atorvastatin 10mg', qty: 70, price: 115.00, min: 10 },
      { lic: 'HYD-PHARM-002', med: 'Montelukast 10mg', qty: 4, price: 140.00, min: 10 }, // Low stock
      { lic: 'HYD-PHARM-002', med: 'Benadryl Cough Syrup', qty: 35, price: 125.00, min: 5 },
      { lic: 'HYD-PHARM-002', med: 'Limcee 500mg', qty: 300, price: 24.50, min: 25 },

      // Wellness Forever - Madhapur
      { lic: 'HYD-PHARM-003', med: 'Cetirizine 10mg', qty: 120, price: 38.00, min: 10 },
      { lic: 'HYD-PHARM-003', med: 'Ibuprofen 400mg', qty: 140, price: 28.00, min: 15 },
      { lic: 'HYD-PHARM-003', med: 'Pantoprazole 40mg', qty: 0, price: 90.00, min: 10 }, // Out of stock
      { lic: 'HYD-PHARM-003', med: 'Amlodipine 5mg', qty: 160, price: 34.00, min: 15 },
      { lic: 'HYD-PHARM-003', med: 'Omeprazole 20mg', qty: 90, price: 62.00, min: 10 },
      { lic: 'HYD-PHARM-003', med: 'Volini Pain Relief Gel', qty: 45, price: 135.00, min: 5 },

      // Care Pharmacy & Surgical - Gachibowli
      { lic: 'HYD-PHARM-004', med: 'Paracetamol 500mg', qty: 250, price: 16.00, min: 20 },
      { lic: 'HYD-PHARM-004', med: 'Azithromycin 500mg', qty: 50, price: 112.00, min: 10 },
      { lic: 'HYD-PHARM-004', med: 'Ciprofloxacin 500mg', qty: 3, price: 82.00, min: 10 }, // Low stock
      { lic: 'HYD-PHARM-004', med: 'Telmisartan 40mg', qty: 130, price: 98.00, min: 10 },
      { lic: 'HYD-PHARM-004', med: 'Combiflam', qty: 180, price: 42.00, min: 15 },
      { lic: 'HYD-PHARM-004', med: 'Ciplox Eye Drops', qty: 65, price: 29.00, min: 5 },

      // Sri Sai Medical Stores - Ameerpet
      { lic: 'HYD-PHARM-005', med: 'Paracetamol 650mg', qty: 100, price: 31.00, min: 10 },
      { lic: 'HYD-PHARM-005', med: 'Cetirizine 10mg', qty: 75, price: 40.00, min: 10 },
      { lic: 'HYD-PHARM-005', med: 'Metformin 500mg', qty: 190, price: 48.00, min: 15 },
      { lic: 'HYD-PHARM-005', med: 'Losartan 50mg', qty: 85, price: 72.00, min: 10 },
      { lic: 'HYD-PHARM-005', med: 'Benadryl Cough Syrup', qty: 0, price: 120.00, min: 5 }, // Out of stock

      // Standard Medical Agency - Secunderabad (Wholesale Agency)
      { lic: 'HYD-AGNC-001', med: 'Paracetamol 500mg', qty: 1200, price: 14.00, min: 100 },
      { lic: 'HYD-AGNC-001', med: 'Amoxicillin 500mg', qty: 800, price: 68.00, min: 50 },
      { lic: 'HYD-AGNC-001', med: 'Azithromycin 500mg', qty: 450, price: 102.00, min: 30 },
      { lic: 'HYD-AGNC-001', med: 'Augmentin 625 Duo', qty: 300, price: 195.00, min: 20 },
      { lic: 'HYD-AGNC-001', med: 'Metformin 500mg', qty: 1500, price: 44.00, min: 100 },

      // Apex Pharma Wholesale Distributors - Kukatpally (Wholesale Agency)
      { lic: 'HYD-AGNC-002', med: 'Pantoprazole 40mg', qty: 950, price: 82.00, min: 50 },
      { lic: 'HYD-AGNC-002', med: 'Atorvastatin 10mg', qty: 600, price: 105.00, min: 30 },
      { lic: 'HYD-AGNC-002', med: 'Telmisartan 40mg', qty: 700, price: 88.00, min: 40 },
      { lic: 'HYD-AGNC-002', med: 'Limcee 500mg', qty: 2500, price: 20.00, min: 200 }
    ];

    let invCount = 0;
    for (const item of inventoryData) {
      const vId = vendorMap.get(item.lic);
      const mId = medicineMap.get(item.med);

      if (!vId || !mId) continue;

      const checkInv = await query(
        `SELECT id FROM inventories WHERE vendor_id = $1 AND medicine_id = $2`,
        [vId, mId]
      );

      if (checkInv.rows.length === 0) {
        await query(
          `INSERT INTO inventories (vendor_id, medicine_id, stock_quantity, price, min_stock_level, last_updated, is_demo)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, TRUE)`,
          [vId, mId, item.qty, item.price, item.min]
        );
        invCount++;
      } else {
        // Safe refresh of demonstration stock without overwriting if vendor manually changed it
        await query(
          `UPDATE inventories SET is_demo = TRUE WHERE id = $1`,
          [checkInv.rows[0].id]
        );
      }
    }

    console.log(`[Seed Step 4] Seeded ${invCount} vendor inventory records.`);
    console.log('================ SEEDING COMPLETED SUCCESSFULLY ================');
  } catch (err) {
    console.error('Seeding Error:', err);
    throw err;
  }
}

// Execute if run directly from command line
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
