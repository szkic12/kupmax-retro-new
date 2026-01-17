-- Tabela dla źródeł RSS
CREATE TABLE IF NOT EXISTS rss_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domyślne źródła
INSERT INTO rss_sources (name, url, category) VALUES
  ('Hacker News', 'https://hnrss.org/frontpage', 'Tech'),
  ('TechCrunch', 'https://techcrunch.com/feed/', 'Tech'),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'Tech'),
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'Tech')
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE rss_sources ENABLE ROW LEVEL SECURITY;

-- Polityka - wszyscy mogą czytać
CREATE POLICY "Public read rss sources" ON rss_sources
  FOR SELECT USING (true);

-- Polityka - pełny dostęp dla service role
CREATE POLICY "Service role full access rss" ON rss_sources
  FOR ALL USING (true);
