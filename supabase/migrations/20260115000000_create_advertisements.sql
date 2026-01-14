-- Tabela reklam dla KUPMAX Retro
-- Jedna aktywna reklama na raz, zarządzana przez admina

CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dane reklamy
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT,

  -- Informacje o reklamodawcy
  advertiser_name TEXT NOT NULL,
  advertiser_email TEXT,

  -- Daty
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadane
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks na aktywne reklamy
CREATE INDEX IF NOT EXISTS idx_advertisements_active ON advertisements(is_active, end_date);

-- Trigger do aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_advertisements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_advertisements_updated_at ON advertisements;
CREATE TRIGGER trigger_advertisements_updated_at
  BEFORE UPDATE ON advertisements
  FOR EACH ROW
  EXECUTE FUNCTION update_advertisements_updated_at();

-- Wstaw domyślną reklamę (narzeczona - Anna Juszczak Fotografia)
INSERT INTO advertisements (
  image_url,
  title,
  description,
  link_url,
  advertiser_name,
  advertiser_email,
  is_active
) VALUES (
  '/images/slider-1.jpg',
  'Anna Juszczak Fotografia',
  'Profesjonalna fotografia - sesje zdjęciowe, eventy, portrety. Koniec odkładania. Czas tworzenia.',
  'https://www.facebook.com/annajuszczakfotografia/',
  'Anna Juszczak',
  NULL,
  true
);

-- Historia reklam (opcjonalne - do śledzenia zmian)
CREATE TABLE IF NOT EXISTS advertisement_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id UUID REFERENCES advertisements(id) ON DELETE SET NULL,

  -- Kopia danych
  image_url TEXT,
  title TEXT,
  advertiser_name TEXT,
  link_url TEXT,

  -- Okres wyświetlania
  displayed_from TIMESTAMP WITH TIME ZONE,
  displayed_until TIMESTAMP WITH TIME ZONE,

  -- Metadane
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks na historię
CREATE INDEX IF NOT EXISTS idx_advertisement_history_dates ON advertisement_history(displayed_from, displayed_until);
