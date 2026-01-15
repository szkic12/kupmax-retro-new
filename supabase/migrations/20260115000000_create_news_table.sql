-- Tabela News dla KUPMAX Retro
-- Kategorie: Niesamowite Historie, Nowoczesne Technologie, Eksperckie Poradniki (jak BossXD)
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  author TEXT DEFAULT 'Admin',
  category TEXT DEFAULT 'Niesamowite Historie' CHECK (category IN ('Niesamowite Historie', 'Nowoczesne Technologie', 'Eksperckie Poradniki')),
  is_published BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  -- SEO fields
  slug TEXT UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  -- Cross-linking
  related_product_ids TEXT[],
  ai_kupmax_link TEXT,
  -- Engagement
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);

-- Funkcja do generowania slug z tytułu
CREATE OR REPLACE FUNCTION generate_news_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(NEW.title, '[ąĄ]', 'a', 'g'),
          '[ęĘ]', 'e', 'g'
        ),
        '[^a-zA-Z0-9]+', '-', 'g'
      )
    );
    NEW.slug := trim(both '-' from NEW.slug);
    -- Dodaj timestamp jeśli slug już istnieje
    IF EXISTS (SELECT 1 FROM news WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      NEW.slug := NEW.slug || '-' || extract(epoch from now())::integer;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_news_slug ON news;
CREATE TRIGGER trigger_news_slug
  BEFORE INSERT OR UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION generate_news_slug();

-- Trigger do aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_news_updated_at ON news;
CREATE TRIGGER trigger_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_news_updated_at();

-- Przykładowe newsy dla każdej kategorii
INSERT INTO news (title, content, excerpt, author, category, is_published)
VALUES
(
  'Witamy w KUPMAX Retro!',
  'Witamy na naszej platformie w stylu Windows 98! KUPMAX Retro to nostalgiczny powrót do złotej ery internetu. Zapraszamy do przeglądania produktów w naszym Sklepie, dodawania ogłoszeń na Forum oraz śledzenia najnowszych informacji w sekcji News.',
  'Witamy na naszej platformie w stylu Windows 98! Nostalgiczny powrót do złotej ery internetu...',
  'Admin',
  'Niesamowite Historie',
  true
),
(
  'Windows 98 - Ikona Ery PC',
  'Windows 98 to jeden z najbardziej kultowych systemów operacyjnych Microsoft. Wprowadził USB plug-and-play, Internet Explorer 4.0 zintegrowany z eksploratorem, oraz charakterystyczny wygląd który do dziś budzi nostalgię.',
  'Windows 98 to jeden z najbardziej kultowych systemów operacyjnych...',
  'Admin',
  'Nowoczesne Technologie',
  true
),
(
  'Jak korzystać z Forum KUPMAX Retro',
  'Poradnik dla nowych użytkowników Forum. Dowiedz się jak dodawać wątki, odpowiadać na posty innych użytkowników i budować społeczność retro-entuzjastów.',
  'Poradnik dla nowych użytkowników Forum KUPMAX Retro...',
  'Admin',
  'Eksperckie Poradniki',
  true
)
ON CONFLICT DO NOTHING;

SELECT 'Tabela news utworzona pomyślnie z kategoriami BossXD!' as status;
