-- Migration: Create Student Affairs portal auxiliary tables with real foreign keys and RLS rules.
-- This SQL file defines the schema to be executed on the Supabase / PostgreSQL instance.

-- 1. Create Guardians table
CREATE TABLE IF NOT EXISTS guardians (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    national_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    occupation TEXT,
    address TEXT,
    app_access BOOLEAN DEFAULT FALSE,
    app_account_status TEXT DEFAULT 'pending' CHECK (app_account_status IN ('active', 'pending', 'blocked'))
);

-- Index for school partitioning / performance
CREATE INDEX IF NOT EXISTS idx_guardians_school ON guardians(school_id);

-- 2. Create Student Guardians Join Table
CREATE TABLE IF NOT EXISTS student_guardians (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id TEXT NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    financial_liability BOOLEAN DEFAULT FALSE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    UNIQUE(student_id, guardian_id)
);

CREATE INDEX IF NOT EXISTS idx_student_guardians_student ON student_guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_student_guardians_guardian ON student_guardians(guardian_id);

-- 3. Create Student Medical Records Table
CREATE TABLE IF NOT EXISTS student_medical_records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    blood_type TEXT,
    chronic_diseases TEXT,
    allergies TEXT,
    vaccines_taken BOOLEAN DEFAULT FALSE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_notes TEXT
);

-- 4. Create Student Transportation Details Table
CREATE TABLE IF NOT EXISTS student_transportation (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    route_number TEXT,
    pickup_point TEXT,
    dropoff_point TEXT,
    monthly_fees NUMERIC(10, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- 5. Create Student Library Accounts Table
CREATE TABLE IF NOT EXISTS student_library_accounts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    library_card_number TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    books_borrowed_count INT DEFAULT 0,
    unpaid_fines NUMERIC(10, 2) DEFAULT 0.00
);

-- 6. Create Student Uniform Accounts Table
CREATE TABLE IF NOT EXISTS student_uniform_accounts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    uniform_size TEXT,
    pieces_received_count INT DEFAULT 0,
    total_fees NUMERIC(10, 2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial'))
);

-- 7. Create Student Assets Custody Table (iPads, Chromebooks, etc.)
CREATE TABLE IF NOT EXISTS student_assets (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    serial_number TEXT,
    received_date TEXT NOT NULL,
    returned_date TEXT,
    condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'damaged'))
);

CREATE INDEX IF NOT EXISTS idx_student_assets_student ON student_assets(student_id);

-- 8. Create Student Secured Documents Vault Table
CREATE TABLE IF NOT EXISTS student_documents (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('national_id', 'passport', 'birth_cert', 'transcript', 'medical', 'other')),
    file_name TEXT NOT NULL,
    file_size TEXT NOT NULL,
    access_permission TEXT NOT NULL DEFAULT 'admins',
    ocr_processed BOOLEAN DEFAULT FALSE,
    ocr_extracted_name TEXT,
    uploaded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_documents_student ON student_documents(student_id);

-- 9. Create Student Contacts Emergency Registry Table
CREATE TABLE IF NOT EXISTS student_contacts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_relation TEXT NOT NULL,
    is_emergency BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_student_contacts_student ON student_contacts(student_id);

-- Enable Row Level Security (RLS) for all Student Affairs tables.
-- The tenant claim is read only from Supabase Auth app_metadata. No request
-- header, query parameter, body field, or client-selected school is trusted.
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_transportation ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_library_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_uniform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_contacts ENABLE ROW LEVEL SECURITY;

-- Versioned RLS isolation policies. Explicit WITH CHECK clauses protect
-- INSERT and UPDATE from school_id/relationship spoofing.
DROP POLICY IF EXISTS students_tenant_isolation ON students;
CREATE POLICY students_tenant_isolation ON students
    FOR ALL
    USING (school_id::text = (auth.jwt()->'app_metadata'->>'school_id'))
    WITH CHECK (school_id::text = (auth.jwt()->'app_metadata'->>'school_id'));

DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    FOR ALL
    USING (school_id::text = (auth.jwt()->'app_metadata'->>'school_id'))
    WITH CHECK (school_id::text = (auth.jwt()->'app_metadata'->>'school_id'));

DROP POLICY IF EXISTS guardians_tenant_isolation ON guardians;
CREATE POLICY guardians_tenant_isolation ON guardians
    FOR ALL
    USING (school_id = (auth.jwt()->'app_metadata'->>'school_id'))
    WITH CHECK (school_id = (auth.jwt()->'app_metadata'->>'school_id'));

DROP POLICY IF EXISTS student_guardians_tenant_isolation ON student_guardians;
CREATE POLICY student_guardians_tenant_isolation ON student_guardians
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_guardians.student_id 
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
        AND EXISTS (
            SELECT 1 FROM guardians
            WHERE guardians.id = student_guardians.guardian_id
            AND guardians.school_id = (auth.jwt()->'app_metadata'->>'school_id')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = student_guardians.student_id
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
        AND EXISTS (
            SELECT 1 FROM guardians
            WHERE guardians.id = student_guardians.guardian_id
            AND guardians.school_id = (auth.jwt()->'app_metadata'->>'school_id')
        )
    );

DROP POLICY IF EXISTS student_medical_tenant_isolation ON student_medical_records;
CREATE POLICY student_medical_tenant_isolation ON student_medical_records
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_medical_records.student_id 
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = student_medical_records.student_id
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    );

DROP POLICY IF EXISTS student_transportation_tenant_isolation ON student_transportation;
CREATE POLICY student_transportation_tenant_isolation ON student_transportation
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_transportation.student_id 
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = student_transportation.student_id
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    );

DROP POLICY IF EXISTS student_library_tenant_isolation ON student_library_accounts;
CREATE POLICY student_library_tenant_isolation ON student_library_accounts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_library_accounts.student_id 
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = student_library_accounts.student_id
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    );

DROP POLICY IF EXISTS student_uniform_tenant_isolation ON student_uniform_accounts;
CREATE POLICY student_uniform_tenant_isolation ON student_uniform_accounts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_uniform_accounts.student_id 
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = student_uniform_accounts.student_id
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    );

DROP POLICY IF EXISTS student_assets_tenant_isolation ON student_assets;
CREATE POLICY student_assets_tenant_isolation ON student_assets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_assets.student_id 
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = student_assets.student_id
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    );

DROP POLICY IF EXISTS student_documents_tenant_isolation ON student_documents;
CREATE POLICY student_documents_tenant_isolation ON student_documents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_documents.student_id 
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = student_documents.student_id
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    );

DROP POLICY IF EXISTS student_contacts_tenant_isolation ON student_contacts;
CREATE POLICY student_contacts_tenant_isolation ON student_contacts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id = student_contacts.student_id 
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = student_contacts.student_id
            AND students.school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        )
    );
