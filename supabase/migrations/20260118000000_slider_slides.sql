-- Tabela dla slajdów na stronie głównej
CREATE TABLE IF NOT EXISTS slider_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT DEFAULT '#',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domyślne slajdy
INSERT INTO slider_slides (title, image_url, link_url, order_index) VALUES
  ('Witaj w KUPMAX', '/images/slider-1.jpg', '#', 0),
  ('Odkryj nasze produkty', '/images/slider-2.jpg', '/shop', 1),
  ('Dołącz do społeczności', '/images/slider-3.jpg', '/forum', 2);

-- RLS
ALTER TABLE slider_slides ENABLE ROW LEVEL SECURITY;

-- Polityka - wszyscy mogą czytać aktywne slajdy
CREATE POLICY "Public read active slides" ON slider_slides
  FOR SELECT USING (is_active = true);

-- Polityka - pełny dostęp dla service role
CREATE POLICY "Service role full access slides" ON slider_slides
  FOR ALL USING (true);
