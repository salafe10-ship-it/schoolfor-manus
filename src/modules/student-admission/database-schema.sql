-- Student Admission Schema

CREATE TABLE admission_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    school_id UUID NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'INQUIRY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admission_inquiries_tenant_id ON admission_inquiries(tenant_id);
CREATE INDEX idx_admission_inquiries_school_id ON admission_inquiries(school_id);

-- Enable RLS
ALTER TABLE admission_inquiries ENABLE ROW LEVEL SECURITY;

-- Security policy: tenant and school must both match the trusted Supabase JWT.
DROP POLICY IF EXISTS admission_inquiries_isolation_policy ON admission_inquiries;
CREATE POLICY admission_inquiries_isolation_policy ON admission_inquiries
    FOR ALL
    USING (
        tenant_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        AND school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
    )
    WITH CHECK (
        tenant_id::text = (auth.jwt()->'app_metadata'->>'school_id')
        AND school_id::text = (auth.jwt()->'app_metadata'->>'school_id')
    );
