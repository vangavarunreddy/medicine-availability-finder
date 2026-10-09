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
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);

    // Seed Default System Administrator
    const checkAdmin = await query(`SELECT id FROM users WHERE email = 'admin@medfinder.com'`);
    if (checkAdmin.rows.length === 0) {
      await query(
        `INSERT INTO users (email, password_hash, role, full_name, phone, is_email_verified)
         VALUES ('admin@medfinder.com', $1, 'ADMIN', 'System Administrator', '+91 90000 00000', TRUE)`,
        [adminPasswordHash]
      );
      console.log('[Seed Step 1.5] Default Admin account created (admin@medfinder.com).');
    }

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

    console.log(`[Seed Step 2] Seeded 7 Approved Vendors & Demo Patients in Hyderabad.`);

    // 4. Seed 32 Master Medicines across ALL forms: Tablet, Capsule, Syrup, Injection, Cream, Ointment, Drops, Powder
    const medicineDefinitions = [
      // Tablets & Capsules
      { name: 'Paracetamol 500mg', brand: 'Dolo 500', generic_name: 'Paracetamol', dosage: '500mg', form: 'Tablet', manufacturer: 'Micro Labs', description: 'Antipyretic and analgesic tablet used for fever and mild to moderate pain relief.' },
      { name: 'Paracetamol 650mg', brand: 'Dolo 650', generic_name: 'Paracetamol', dosage: '650mg', form: 'Tablet', manufacturer: 'Micro Labs', description: 'Higher strength antipyretic for high fever, dengue body aches, and fever symptoms.' },
      { name: 'Crocin Advance 500mg', brand: 'Crocin', generic_name: 'Paracetamol Fast Release', dosage: '500mg', form: 'Tablet', manufacturer: 'GSK', description: 'Fast acting antipyretic tablet with Optizorb technology.' },
      { name: 'Cetirizine 10mg', brand: 'Okacet', generic_name: 'Cetirizine Hydrochloride', dosage: '10mg', form: 'Tablet', manufacturer: 'Cipla', description: 'Non-drowsy antihistamine tablet for allergic rhinitis, sneezing, and skin allergy relief.' },
      { name: 'Allegra 120mg', brand: 'Allegra', generic_name: 'Fexofenadine Hydrochloride', dosage: '120mg', form: 'Tablet', manufacturer: 'Sanofi India', description: 'Non-sedating second generation antihistamine tablet for seasonal allergies.' },
      { name: 'Amoxicillin 500mg', brand: 'Mox 500', generic_name: 'Amoxicillin Trihydrate', dosage: '500mg', form: 'Capsule', manufacturer: 'Sun Pharma', description: 'Broad-spectrum penicillin antibiotic capsule for bacterial infections.' },
      { name: 'Azithromycin 500mg', brand: 'Azee 500', generic_name: 'Azithromycin', dosage: '500mg', form: 'Tablet', manufacturer: 'Cipla', description: 'Macrolide antibiotic for upper respiratory tract, throat, and sinus infections.' },
      { name: 'Augmentin 625 Duo', brand: 'Augmentin 625', generic_name: 'Amoxicillin 500mg + Clavulanic Acid 125mg', dosage: '625mg', form: 'Tablet', manufacturer: 'GSK', description: 'Penicillin-type antibiotic enhanced with beta-lactamase inhibitor for resistant infections.' },
      { name: 'Metformin 500mg', brand: 'Glycomet 500', generic_name: 'Metformin Hydrochloride', dosage: '500mg', form: 'Tablet', manufacturer: 'USV Pharma', description: 'First-line oral antidiabetic medication for glycemic control in Type 2 diabetes.' },
      { name: 'Pantoprazole 40mg', brand: 'Pantocid 40', generic_name: 'Pantoprazole Sodium', dosage: '40mg', form: 'Tablet', manufacturer: 'Alkem Labs', description: 'Proton pump inhibitor (PPI) for GERD, acid reflux, gastritis, and peptic ulcers.' },
      { name: 'Ibuprofen 400mg', brand: 'Brufen 400', generic_name: 'Ibuprofen', dosage: '400mg', form: 'Tablet', manufacturer: 'Abbott India', description: 'Non-steroidal anti-inflammatory drug (NSAID) for muscle strain, arthritis, and toothache.' },
      { name: 'Combiflam', brand: 'Combiflam', generic_name: 'Ibuprofen 400mg + Paracetamol 325mg', dosage: 'Combination', form: 'Tablet', manufacturer: 'Sanofi India', description: 'Dual-action analgesic and anti-inflammatory combination tablet.' },
      { name: 'Becosules Z Capsules', brand: 'Becosules Z', generic_name: 'B-Complex Vitamins + Zinc', dosage: '1 Capsule', form: 'Capsule', manufacturer: 'Pfizer', description: 'Multivitamin capsule with Vitamin B-Complex and Zinc for energy and mouth ulcer recovery.' },
      { name: 'Shelcal 500 Tablet', brand: 'Shelcal 500', generic_name: 'Elemental Calcium 500mg + Vitamin D3', dosage: '500mg', form: 'Tablet', manufacturer: 'Torrent Pharma', description: 'Calcium and Vitamin D3 supplement for bone health and osteoporosis management.' },

      // Ointments & Creams
      { name: 'Volini Pain Relief Gel', brand: 'Volini Gel', generic_name: 'Diclofenac Diethylamine 1.16%', dosage: '30g', form: 'Ointment', manufacturer: 'Sun Pharma', description: 'Topical pain relief gel for joint strain, muscle ache, back pain, and sprains.' },
      { name: 'Neosporin Antibiotic Ointment', brand: 'Neosporin', generic_name: 'Neomycin + Polymyxin B + Bacitracin', dosage: '5g', form: 'Ointment', manufacturer: 'GSK', description: 'Triple antibiotic ointment for minor cuts, scrapes, and skin infection prevention.' },
      { name: 'Omnigel Topical Gel', brand: 'Omnigel', generic_name: 'Diclofenac + Linseed Oil + Menthol', dosage: '50g', form: 'Ointment', manufacturer: 'Cipla', description: 'Fast absorbing pain relief ointment for arthritis and sports injuries.' },
      { name: 'Quadriderm RF Cream', brand: 'Quadriderm RF', generic_name: 'Beclomethasone + Clotrimazole + Neomycin', dosage: '10g', form: 'Cream', manufacturer: 'Fulford India', description: 'Broad-spectrum anti-inflammatory, antifungal, and antibacterial skin cream.' },
      { name: 'Betnovate-N Cream', brand: 'Betnovate-N', generic_name: 'Betamethasone 0.1% + Neomycin 0.5%', dosage: '20g', form: 'Cream', manufacturer: 'GSK', description: 'Corticosteroic antibacterial cream for eczema, psoriasis, and skin inflammation.' },
      { name: 'Candid B Cream', brand: 'Candid B', generic_name: 'Clotrimazole 1% + Beclomethasone 0.025%', dosage: '20g', form: 'Cream', manufacturer: 'Glenmark Pharma', description: 'Antifungal and steroid cream for fungal skin infections and ringworm.' },

      // Syrups & Liquids
      { name: 'Benadryl Cough Syrup', brand: 'Benadryl DR', generic_name: 'Diphenhydramine 14mg/5ml', dosage: '100ml', form: 'Syrup', manufacturer: 'Johnson & Johnson', description: 'Expectorant cough syrup for soothing dry throat and chest congestion.' },
      { name: 'Ascoril LS Syrup', brand: 'Ascoril LS', generic_name: 'Levosalbutamol + Ambroxol + Guaiphenesin', dosage: '100ml', form: 'Syrup', manufacturer: 'Glenmark Pharma', description: 'Bronchodilator and mucolytic expectorant syrup for wet cough and bronchitis.' },
      { name: 'Grilinctus BM Syrup', brand: 'Grilinctus BM', generic_name: 'Terbutaline + Bromhexine', dosage: '100ml', form: 'Syrup', manufacturer: 'Franco-Indian Pharma', description: 'Mucolytic cough syrup for chest tightness and bronchospasm relief.' },
      { name: 'Cremaffin Pink Emulsion', brand: 'Cremaffin Pink', generic_name: 'Liquid Paraffin + Milk of Magnesia', dosage: '200ml', form: 'Syrup', manufacturer: 'Abbott India', description: 'Laxative liquid syrup for smooth relief from chronic constipation.' },
      { name: 'Zincovit Multivitamin Syrup', brand: 'Zincovit Syrup', generic_name: 'Multivitamins + Minerals + Zinc', dosage: '200ml', form: 'Syrup', manufacturer: 'Apex Laboratories', description: 'Nutritional immunity booster syrup for appetite, health, and vitality.' },
      { name: 'Gelusil MPS Liquid Syrup', brand: 'Gelusil MPS', generic_name: 'Aluminium Hydroxide + Magnesium + Dimethicone', dosage: '200ml', form: 'Syrup', manufacturer: 'Pfizer', description: 'Fast acting antacid syrup for heartburn, acid indigestion, and gas acidity.' },

      // Drops (Eye, Ear, Nasal, Pediatric)
      { name: 'Ciplox Eye Drops', brand: 'Ciplox Drops', generic_name: 'Ciprofloxacin 0.3% w/v', dosage: '10ml', form: 'Drops', manufacturer: 'Cipla', description: 'Antibacterial ophthalmic eye drops for conjunctivitis and red eye infections.' },
      { name: 'Otrivin Nasal Drops', brand: 'Otrivin Adult', generic_name: 'Xylometazoline Hydrochloride 0.1%', dosage: '10ml', form: 'Drops', manufacturer: 'GSK', description: 'Nasal decongestant drops for quick 2-minute relief from blocked nose.' },
      { name: 'Refresh Tears Eye Drops', brand: 'Refresh Tears', generic_name: 'Carboxymethylcellulose 0.5%', dosage: '10ml', form: 'Drops', manufacturer: 'Allergan', description: 'Artificial lubricant eye drops for dry, irritated, and burning eyes.' },

      // Injections
      { name: 'Monocef 1g Injection', brand: 'Monocef 1g', generic_name: 'Ceftriaxone Sodium 1g', dosage: '1000mg', form: 'Injection', manufacturer: 'Aristo Pharmaceuticals', description: 'Third-generation cephalosporin IV/IM antibiotic injection for severe systemic infections.' },
      { name: 'Dynapar AQ Injection', brand: 'Dynapar AQ', generic_name: 'Diclofenac Sodium 75mg/1ml', dosage: '75mg', form: 'Injection', manufacturer: 'Troikaa Pharmaceuticals', description: 'Fast-acting NSAID analgesic IM injection for post-operative and acute pain.' },
      { name: 'Insulin Human 40IU Injection', brand: 'Human Actrapid', generic_name: 'Soluble Insulin Human 40IU/ml', dosage: '10ml Vial', form: 'Injection', manufacturer: 'Novo Nordisk', description: 'Short-acting human insulin injection for diabetes blood sugar control.' },

      // Powders
      { name: 'ORS Oral Rehydration Powder', brand: 'Electral ORS', generic_name: 'Sodium Chloride + Potassium + Dextrose', dosage: '21.8g Sachet', form: 'Powder', manufacturer: 'FDC Limited', description: 'WHO-recommended electrolyte oral rehydration sachet powder for dehydration.' },
      { name: 'Eno Fruit Salt Powder', brand: 'Eno Regular', generic_name: 'Svarjiksara + Nimbukamlam (Antacid)', dosage: '100g Jar', form: 'Powder', manufacturer: 'GSK', description: 'Fast effervescent antacid powder relief from acidity and bloated stomach.' },
      { name: 'Protinex Chocolate Health Powder', brand: 'Protinex', generic_name: 'High Protein Nutrition Powder', dosage: '400g Jar', form: 'Powder', manufacturer: 'Danone', description: 'Fortified protein nutritional powder supplement with essential amino acids.' }
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

    console.log(`[Seed Step 3] Seeded ${medicineDefinitions.length} Master Catalog Medicines across ALL forms (Tablet, Capsule, Syrup, Injection, Cream, Ointment, Drops, Powder).`);

    // 5. Seed Inventory Entries for Vendors
    const inventoryData = [
      // Apollo Pharmacy - Jubilee Hills
      { lic: 'HYD-PHARM-001', med: 'Paracetamol 500mg', qty: 150, price: 18.50, min: 10 },
      { lic: 'HYD-PHARM-001', med: 'Paracetamol 650mg', qty: 200, price: 32.00, min: 15 },
      { lic: 'HYD-PHARM-001', med: 'Cetirizine 10mg', qty: 85, price: 42.00, min: 10 },
      { lic: 'HYD-PHARM-001', med: 'Amoxicillin 500mg', qty: 60, price: 78.50, min: 10 },
      { lic: 'HYD-PHARM-001', med: 'Volini Pain Relief Gel', qty: 40, price: 135.00, min: 5 },
      { lic: 'HYD-PHARM-001', med: 'Benadryl Cough Syrup', qty: 55, price: 125.00, min: 5 },
      { lic: 'HYD-PHARM-001', med: 'Ciplox Eye Drops', qty: 30, price: 29.00, min: 5 },
      { lic: 'HYD-PHARM-001', med: 'ORS Oral Rehydration Powder', qty: 200, price: 21.50, min: 20 },
      { lic: 'HYD-PHARM-001', med: 'Monocef 1g Injection', qty: 15, price: 65.00, min: 5 },

      // MedPlus Pharmacy - Banjara Hills
      { lic: 'HYD-PHARM-002', med: 'Paracetamol 650mg', qty: 180, price: 30.00, min: 15 },
      { lic: 'HYD-PHARM-002', med: 'Amoxicillin 500mg', qty: 95, price: 75.00, min: 10 },
      { lic: 'HYD-PHARM-002', med: 'Ascoril LS Syrup', qty: 45, price: 130.00, min: 5 },
      { lic: 'HYD-PHARM-002', med: 'Neosporin Antibiotic Ointment', qty: 25, price: 95.00, min: 5 },
      { lic: 'HYD-PHARM-002', med: 'Betnovate-N Cream', qty: 50, price: 58.00, min: 10 },
      { lic: 'HYD-PHARM-002', med: 'Otrivin Nasal Drops', qty: 60, price: 68.00, min: 10 },
      { lic: 'HYD-PHARM-002', med: 'Eno Fruit Salt Powder', qty: 120, price: 160.00, min: 15 },

      // Wellness Forever - Madhapur
      { lic: 'HYD-PHARM-003', med: 'Cetirizine 10mg', qty: 120, price: 38.00, min: 10 },
      { lic: 'HYD-PHARM-003', med: 'Ibuprofen 400mg', qty: 140, price: 28.00, min: 15 },
      { lic: 'HYD-PHARM-003', med: 'Candid B Cream', qty: 35, price: 115.00, min: 5 },
      { lic: 'HYD-PHARM-003', med: 'Gelusil MPS Liquid Syrup', qty: 40, price: 145.00, min: 5 },
      { lic: 'HYD-PHARM-003', med: 'Refresh Tears Eye Drops', qty: 25, price: 165.00, min: 5 },
      { lic: 'HYD-PHARM-003', med: 'Dynapar AQ Injection', qty: 20, price: 42.00, min: 5 },

      // Care Pharmacy & Surgical - Gachibowli
      { lic: 'HYD-PHARM-004', med: 'Paracetamol 500mg', qty: 250, price: 16.00, min: 20 },
      { lic: 'HYD-PHARM-004', med: 'Zincovit Multivitamin Syrup', qty: 70, price: 155.00, min: 10 },
      { lic: 'HYD-PHARM-004', med: 'Quadriderm RF Cream', qty: 30, price: 110.00, min: 5 },
      { lic: 'HYD-PHARM-004', med: 'Protinex Chocolate Health Powder', qty: 25, price: 450.00, min: 5 },
      { lic: 'HYD-PHARM-004', med: 'Insulin Human 40IU Injection', qty: 12, price: 185.00, min: 3 },

      // Sri Sai Medical Stores - Ameerpet
      { lic: 'HYD-PHARM-005', med: 'Paracetamol 650mg', qty: 100, price: 31.00, min: 10 },
      { lic: 'HYD-PHARM-005', med: 'Grilinctus BM Syrup', qty: 40, price: 108.00, min: 5 },
      { lic: 'HYD-PHARM-005', med: 'Omnigel Topical Gel', qty: 30, price: 120.00, min: 5 },
      { lic: 'HYD-PHARM-005', med: 'ORS Oral Rehydration Powder', qty: 150, price: 21.00, min: 20 },

      // Standard Medical Agency - Secunderabad (Wholesale Agency)
      { lic: 'HYD-AGNC-001', med: 'Paracetamol 500mg', qty: 1200, price: 14.00, min: 100 },
      { lic: 'HYD-AGNC-001', med: 'Amoxicillin 500mg', qty: 800, price: 68.00, min: 50 },
      { lic: 'HYD-AGNC-001', med: 'Benadryl Cough Syrup', qty: 400, price: 105.00, min: 30 },
      { lic: 'HYD-AGNC-001', med: 'Volini Pain Relief Gel', qty: 300, price: 110.00, min: 20 },
      { lic: 'HYD-AGNC-001', med: 'Monocef 1g Injection', qty: 250, price: 52.00, min: 20 },

      // Apex Pharma Wholesale Distributors - Kukatpally (Wholesale Agency)
      { lic: 'HYD-AGNC-002', med: 'Pantoprazole 40mg', qty: 950, price: 82.00, min: 50 },
      { lic: 'HYD-AGNC-002', med: 'Zincovit Multivitamin Syrup', qty: 500, price: 130.00, min: 30 },
      { lic: 'HYD-AGNC-002', med: 'Betnovate-N Cream', qty: 600, price: 48.00, min: 40 },
      { lic: 'HYD-AGNC-002', med: 'Ciplox Eye Drops', qty: 450, price: 22.00, min: 30 }
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
