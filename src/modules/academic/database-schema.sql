-- Academic Management Schema

CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    credits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_academic_years_tenant_id ON academic_years(tenant_id);
CREATE INDEX idx_courses_tenant_id ON courses(tenant_id);

-- Enable RLS
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Canonical academic catalogue. These tables are intentionally tenant/school scoped
-- so the UI can migrate away from the legacy JSON academic_structure setting without
-- losing compatibility during the transition.
CREATE TABLE IF NOT EXISTS academic_stages (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL,
    school_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS academic_grades (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL,
    school_id UUID NOT NULL,
    stage_id TEXT NOT NULL REFERENCES academic_stages(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS academic_classes (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL,
    school_id UUID NOT NULL,
    grade_id TEXT NOT NULL REFERENCES academic_grades(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS academic_subjects (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id),
    grade_id TEXT REFERENCES academic_grades(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    credit_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
    weekly_periods INTEGER NOT NULL DEFAULT 0 CHECK (weekly_periods BETWEEN 0 AND 60),
    passing_score NUMERIC(5,2) NOT NULL DEFAULT 50,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
    assigned_teacher_id UUID,
    is_elective BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, academic_year_id, code),
    UNIQUE (school_id, academic_year_id, grade_id, name)
);

CREATE TABLE IF NOT EXISTS academic_timetable_entries (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    class_id TEXT NOT NULL REFERENCES academic_classes(id),
    subject_id TEXT NOT NULL REFERENCES academic_subjects(id),
    teacher_id UUID NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 20),
    room_name VARCHAR(120),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, academic_year_id, class_id, day_of_week, period_number)
);

CREATE INDEX IF NOT EXISTS idx_academic_grades_school ON academic_grades(school_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_academic_classes_school ON academic_classes(school_id, grade_id);
CREATE INDEX IF NOT EXISTS idx_academic_subjects_school_year ON academic_subjects(school_id, academic_year_id, grade_id);
CREATE INDEX IF NOT EXISTS idx_academic_timetable_school_year ON academic_timetable_entries(school_id, academic_year_id, day_of_week, period_number);

ALTER TABLE academic_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_timetable_entries ENABLE ROW LEVEL SECURITY;
