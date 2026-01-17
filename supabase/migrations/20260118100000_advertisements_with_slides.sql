-- Tabela dla obrazków reklamy (slajdy)
CREATE TABLE IF NOT EXISTS advertisement_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks dla szybkiego pobierania slajdów reklamy
CREATE INDEX IF NOT EXISTS idx_ad_slides_advertisement ON advertisement_slides(advertisement_id);

-- RLS
ALTER TABLE advertisement_slides ENABLE ROW LEVEL SECURITY;

-- Polityka - wszyscy mogą czytać
CREATE POLICY "Public read ad slides" ON advertisement_slides
  FOR SELECT USING (true);

-- Polityka - pełny dostęp dla service role
CREATE POLICY "Service role full access ad slides" ON advertisement_slides
  FOR ALL USING (true);
