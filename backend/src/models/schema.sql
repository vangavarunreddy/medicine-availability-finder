-- PostgreSQL Schema Definition for Medicine Availability Finder
-- Target Database: Neon PostgreSQL

-- Enable required extensions for UUID generation and Trigram Fuzzy Search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('PATIENT', 'PHARMACY', 'MEDICAL_AGENCY', 'ADMIN')),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. VENDORS TABLE (Pharmacies and Medical Agencies)
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(50) NOT NULL CHECK (vendor_type IN ('PHARMACY', 'MEDICAL_AGENCY')),
    license_number VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. MEDICINES CATALOG TABLE
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    form VARCHAR(100) NOT NULL, -- Tablet, Syrup, Injection, Capsule, Ointment, Drops, Cream, Powder, Other
    manufacturer VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_medicine_spec UNIQUE (name, brand, generic_name, dosage, form)
);

-- 4. INVENTORIES TABLE (Stock & Pricing linked to Vendors)
CREATE TABLE IF NOT EXISTS inventories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    min_stock_level INT NOT NULL DEFAULT 5 CHECK (min_stock_level >= 0),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_vendor_medicine UNIQUE (vendor_id, medicine_id)
);

-- 5. SEARCH HISTORY TABLE
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query_text VARCHAR(255) NOT NULL,
    selected_location VARCHAR(150),
    results_count INT DEFAULT 0,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. MEDICINE REQUESTS TABLE (Reservations/Inquiries)
CREATE TABLE IF NOT EXISTS medicine_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    requested_quantity INT NOT NULL DEFAULT 1 CHECK (requested_quantity > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FULFILLED', 'CANCELLED', 'OUT_OF_STOCK')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. NOTIFY SUBSCRIPTIONS TABLE ("Notify Me When Available")
CREATE TABLE IF NOT EXISTS notify_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    is_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_medicine_vendor_sub UNIQUE (user_id, medicine_id, vendor_id)
);

-- 8. EMAIL VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. PASSWORD RESET TOKENS TABLE
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- LOW_STOCK, AVAILABILITY_RESTOCK, VENDOR_APPROVAL, REQUEST_UPDATE
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE AND FAST SEARCHES

-- Trigram Index for Intelligent Medicine Name, Brand & Generic Search
CREATE INDEX IF NOT EXISTS idx_medicines_trgm 
ON medicines USING gin ((name || ' ' || brand || ' ' || generic_name) gin_trgm_ops);

-- Location & Status Indexes on Vendors
CREATE INDEX IF NOT EXISTS idx_vendors_location_status 
ON vendors(city, vendor_type, status);

CREATE INDEX IF NOT EXISTS idx_vendors_pincode 
ON vendors(pincode);

-- Inventory Quick Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_lookup 
ON inventories(medicine_id, vendor_id);

CREATE INDEX IF NOT EXISTS idx_inventory_stock 
ON inventories(stock_quantity);

-- Request and Subscription Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_requests_vendor_status 
ON medicine_requests(vendor_id, status);

CREATE INDEX IF NOT EXISTS idx_requests_user 
ON medicine_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_notify_pending 
ON notify_subscriptions(medicine_id, is_notified);
