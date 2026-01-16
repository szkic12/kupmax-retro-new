-- Clippy Q&A Table - baza wiedzy dla asystenta Clippy
-- Używana gdy API jest niedostępne (fallback)

CREATE TABLE IF NOT EXISTS clippy_qa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  category VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster keyword search
CREATE INDEX IF NOT EXISTS idx_clippy_qa_keywords ON clippy_qa USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_clippy_qa_active ON clippy_qa (is_active);
CREATE INDEX IF NOT EXISTS idx_clippy_qa_category ON clippy_qa (category);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_clippy_qa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clippy_qa_updated_at ON clippy_qa;
CREATE TRIGGER clippy_qa_updated_at
  BEFORE UPDATE ON clippy_qa
  FOR EACH ROW
  EXECUTE FUNCTION update_clippy_qa_updated_at();

-- Enable RLS
ALTER TABLE clippy_qa ENABLE ROW LEVEL SECURITY;

-- Policy: everyone can read active Q&A
CREATE POLICY "Anyone can read active clippy_qa" ON clippy_qa
  FOR SELECT USING (is_active = true);

-- Policy: service role can do everything
CREATE POLICY "Service role full access to clippy_qa" ON clippy_qa
  FOR ALL USING (true) WITH CHECK (true);

-- Insert some initial Q&A data
INSERT INTO clippy_qa (question, answer, keywords, category, priority) VALUES
  ('Co to jest KUPMAX?', 'KUPMAX to retro-stylowa strona portfolio i showcase w stylu Windows 95! 🖥️ Znajdziesz tu sklep, galerię, forum, chat i wiele więcej!', ARRAY['kupmax', 'co to', 'strona', 'portfolio'], 'about', 10),
  ('Gdzie jest sklep?', 'Sklep znajdziesz klikając ikonę 🛒 Shop.exe na pulpicie! Tam są wszystkie produkty do kupienia.', ARRAY['sklep', 'shop', 'kupić', 'produkty'], 'navigation', 10),
  ('Jak działa forum?', 'Forum 🗨️ Forum.exe pozwala tworzyć wątki i dyskutować z innymi użytkownikami. Kliknij ikonę na pulpicie!', ARRAY['forum', 'wątek', 'dyskusja', 'posty'], 'navigation', 8),
  ('Gdzie są zdjęcia?', 'Galeria zdjęć jest pod ikoną 📸 Photos.exe na pulpicie! Możesz tam przeglądać wszystkie obrazy.', ARRAY['zdjęcia', 'photos', 'galeria', 'obrazy', 'foto'], 'navigation', 8),
  ('Jak używać chatu?', 'Chat 💬 Chat.exe to czat w czasie rzeczywistym. Kliknij ikonę, wybierz nick i rozmawiaj!', ARRAY['chat', 'czat', 'rozmowa', 'pisać'], 'navigation', 8),
  ('Co to Mentor?', 'Mentor.exe 🎓 to narzędzie do nauki programowania! Możesz wgrać kod i dostać pomoc w nauce. Sprawdza też czy kod z kursów jest aktualny.', ARRAY['mentor', 'nauka', 'programowanie', 'kod', 'kurs'], 'features', 9),
  ('Jak pobrać pliki?', 'Sekcja Downloads 💾 zawiera pliki do pobrania. Kliknij ikonę Downloads na pulpicie!', ARRAY['download', 'pobierz', 'pliki', 'ściągnąć'], 'navigation', 8),
  ('Gdzie jest radio?', 'Radio retro 📻 Radio.exe pozwala słuchać muzyki. Kliknij ikonę na pulpicie!', ARRAY['radio', 'muzyka', 'słuchać'], 'navigation', 7),
  ('Jak grać w grę?', 'Mamy BlockBlitz 🕹️ (Tetris)! Kliknij ikonę BlockBlitz.exe na pulpicie i graj!', ARRAY['gra', 'tetris', 'blockblitz', 'grać'], 'features', 7),
  ('Kim jest Clippy?', 'Jestem Clippy! 📎 Oryginalny Clippy był asystentem w Microsoft Office 97-2003. Teraz pomagam na KUPMAX w stylu retro!', ARRAY['clippy', 'kim jesteś', 'asystent'], 'about', 5)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE clippy_qa IS 'Knowledge base for Clippy assistant - used as fallback when AI API is unavailable';
