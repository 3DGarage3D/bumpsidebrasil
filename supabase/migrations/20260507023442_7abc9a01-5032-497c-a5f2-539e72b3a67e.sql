
-- Public read for store
CREATE POLICY "public read products" ON public.products FOR SELECT TO anon USING (true);
CREATE POLICY "public read categories" ON public.categories FOR SELECT TO anon USING (true);

-- Public can create their own customer record (signup)
CREATE POLICY "public insert customers" ON public.customers FOR INSERT TO anon WITH CHECK (true);

-- Resellers table
CREATE TABLE public.resellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  instagram text DEFAULT '',
  whatsapp text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read resellers" ON public.resellers FOR SELECT USING (true);
CREATE POLICY "auth manage resellers" ON public.resellers FOR ALL TO authenticated USING (true) WITH CHECK (true);
