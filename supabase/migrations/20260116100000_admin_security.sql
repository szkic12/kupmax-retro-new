-- Admin Security Tables for KUPMAX
-- 2FA authentication, session management, and logging

-- Admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions (token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions (expires_at);

-- Admin login logs table (for security monitoring)
CREATE TABLE IF NOT EXISTS admin_login_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT,
  success BOOLEAN NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for monitoring
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_ip ON admin_login_logs (ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_login_logs_created ON admin_login_logs (created_at);

-- Verification codes table (for 2FA)
CREATE TABLE IF NOT EXISTS admin_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  code TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false
);

-- Cleanup function - remove expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
  DELETE FROM admin_verification_codes WHERE expires_at < NOW();
  DELETE FROM admin_login_logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_verification_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables
CREATE POLICY "Service role only - admin_sessions" ON admin_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role only - admin_login_logs" ON admin_login_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role only - admin_verification_codes" ON admin_verification_codes
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE admin_sessions IS 'Active admin sessions with tokens';
COMMENT ON TABLE admin_login_logs IS 'Log of all admin login attempts for security monitoring';
COMMENT ON TABLE admin_verification_codes IS 'Temporary 2FA codes for admin authentication';
