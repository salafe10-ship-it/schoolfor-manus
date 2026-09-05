-- Canonical school library catalogue and borrowing ledger.
-- No seed data is included; all rows are created by authenticated workflows.

BEGIN;

CREATE TABLE IF NOT EXISTS public.library (
  id text NOT NULL,
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid,
  code text NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  category text NOT NULL DEFAULT '',
  total_copies integer NOT NULL DEFAULT 0,
  available_copies integer NOT NULL DEFAULT 0,
  location text NOT NULL DEFAULT '',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT pk_library PRIMARY KEY (id),
  CONSTRAINT fk_library_school_scope FOREIGN KEY (tenant_id, school_id)
    REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_library_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
    REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_library_title CHECK (length(btrim(title)) > 0),
  CONSTRAINT ck_library_author CHECK (length(btrim(author)) > 0),
  CONSTRAINT ck_library_copies CHECK (total_copies >= 0 AND available_copies >= 0 AND available_copies <= total_copies)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_library_school_code ON public.library (school_id, code);
CREATE INDEX IF NOT EXISTS idx_library_school_title ON public.library (school_id, title);

CREATE OR REPLACE FUNCTION public.set_library_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT s.tenant_id INTO NEW.tenant_id
    FROM public.schools s
   WHERE s.id = NEW.school_id
     AND s.deleted_at IS NULL;
  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'SCHOOL_SCOPE_NOT_FOUND';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_library_scope ON public.library;
CREATE TRIGGER trg_library_scope BEFORE INSERT OR UPDATE ON public.library
FOR EACH ROW EXECUTE FUNCTION public.set_library_tenant();

CREATE TABLE IF NOT EXISTS public.borrowed_books (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  school_id uuid NOT NULL,
  branch_id uuid,
  book_id text NOT NULL,
  student_id uuid NOT NULL,
  borrowed_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL,
  returned_at timestamptz,
  fine numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT pk_borrowed_books PRIMARY KEY (id),
  CONSTRAINT fk_borrowed_books_school_scope FOREIGN KEY (tenant_id, school_id)
    REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_borrowed_books_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
    REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_borrowed_books_book_scope FOREIGN KEY (book_id)
    REFERENCES public.library (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_borrowed_books_student_scope FOREIGN KEY (tenant_id, school_id, student_id)
    REFERENCES public.students (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_borrowed_books_fine CHECK (fine >= 0),
  CONSTRAINT ck_borrowed_books_status CHECK (status IN ('active', 'returned', 'overdue', 'cancelled')),
  CONSTRAINT ck_borrowed_books_return_state CHECK ((returned_at IS NULL AND status IN ('active', 'overdue')) OR (returned_at IS NOT NULL AND status IN ('returned', 'cancelled')))
);

CREATE INDEX IF NOT EXISTS idx_borrowed_books_school_status ON public.borrowed_books (school_id, status);
CREATE INDEX IF NOT EXISTS idx_borrowed_books_student ON public.borrowed_books (school_id, student_id, borrowed_at DESC);

DROP TRIGGER IF EXISTS trg_borrowed_books_scope ON public.borrowed_books;
CREATE TRIGGER trg_borrowed_books_scope BEFORE INSERT OR UPDATE ON public.borrowed_books
FOR EACH ROW EXECUTE FUNCTION public.set_library_tenant();

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['library', 'borrowed_books'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_name);
    EXECUTE format('DROP POLICY IF EXISTS p_%s_select_scope ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY p_%s_select_scope ON public.%I FOR SELECT TO authenticated USING (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true))', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS p_%s_insert_scope ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY p_%s_insert_scope ON public.%I FOR INSERT TO authenticated WITH CHECK (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true))', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS p_%s_update_scope ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY p_%s_update_scope ON public.%I FOR UPDATE TO authenticated USING (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true)) WITH CHECK (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true))', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS p_%s_delete_scope ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY p_%s_delete_scope ON public.%I FOR DELETE TO authenticated USING (tenant_id::text = current_setting(''app.tenant_id'', true) AND school_id::text = current_setting(''app.school_id'', true))', table_name, table_name);
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
COMMIT;
