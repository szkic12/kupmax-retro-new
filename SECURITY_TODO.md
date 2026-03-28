# Security Configuration Checklist

This document outlines critical security tasks that require manual action or configuration.

## Critical: Environment Variables

### 1. Generate NEXTAUTH_SECRET

**Why:** Required to sign session tokens securely. Without this, sessions can be forged.

**How:**
```bash
openssl rand -base64 32
```

**Action:** Add the generated value to `.env.local`:
```
NEXTAUTH_SECRET=<generated-value>
```

**Verification:** Application should not log warnings about NEXTAUTH_SECRET on startup.

---

### 2. Supabase Service Role Key Rotation

**Why:** Service role keys can bypass RLS if exposed. They should be rotated periodically.

**Current location:**
- Supabase Dashboard → Project Settings → API Keys → Service Role Key

**Action:**
1. Go to Supabase Dashboard for your project
2. Navigate to Settings → API
3. Rotate the "Service Role" key
4. Update in `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=<new-key>
   ```
5. Redeploy application

**Rotation schedule:** Every 90 days recommended

---

### 3. AWS Credentials Rotation

**Why:** AWS S3 credentials control access to file storage. Compromised keys allow unauthorized file access.

**Current location:** AWS IAM → Users → [your-user] → Security credentials

**Action:**
1. Go to AWS Console
2. Create new Access Key ID and Secret Access Key
3. Test new credentials work
4. Update `.env.local`:
   ```
   AWS_ACCESS_KEY_ID=<new-key>
   AWS_SECRET_ACCESS_KEY=<new-secret>
   ```
5. Delete old credentials from AWS
6. Redeploy application

**Rotation schedule:** Every 90 days recommended

---

### 4. Anthropic API Key

**Why:** API keys allow direct API calls and consume your account quota.

**Current location:** Anthropic Console → API Keys

**Action:**
1. Go to [Anthropic Console](https://console.anthropic.com)
2. Rotate your API key if needed
3. Update `.env.local`:
   ```
   ANTHROPIC_API_KEY=<new-key>
   ```
4. Redeploy application

**Rotation schedule:** Every 6 months recommended

---

### 5. Google OAuth Credentials

**Why:** Controls who can sign in via Google. Exposed credentials allow unauthorized access.

**Current location:** Google Cloud Console → Credentials

**Action:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to Credentials
3. If needed, create new OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized origins: `https://kupmax.pl`
   - Authorized redirect URIs: `https://kupmax.pl/api/auth/callback/google`
4. Update `.env.local`:
   ```
   GOOGLE_CLIENT_ID=<new-id>
   GOOGLE_CLIENT_SECRET=<new-secret>
   ```
5. If rotating, delete old credentials
6. Redeploy application

**Rotation schedule:** Every 6-12 months recommended

---

## High Priority: Security Monitoring

### 1. Enable Vercel Environment Variable Protection

**In Vercel Dashboard:**
1. Go to Project → Settings → Environment Variables
2. Mark sensitive variables as "Sensitive"
3. This prevents them from being logged in build logs

### 2. Review Supabase RLS Policies

**Action:** Ensure Row Level Security is enabled on all sensitive tables:
- Users table
- Orders table
- Products table
- Payment information

**Verification:** Check Supabase Dashboard → SQL Editor

### 3. Monitor API Usage

**Monthly action:**
- Check AWS CloudWatch for unusual S3 access patterns
- Review Anthropic API logs for unexpected usage
- Check Supabase Analytics for unusual queries

---

## Medium Priority: Code Security

### 1. Input Sanitization

**Status:** ✅ Complete
- Guestbook entries: HTML escaping applied
- Forum posts: HTML escaping applied
- User names: Sanitized

### 2. CSRF Protection

**Status:** ✅ Complete
- NextAuth provides CSRF protection on all POST/PUT/DELETE endpoints
- Automatic when using NextAuth session

### 3. Authentication on Admin Endpoints

**Status:** ✅ Complete
- Admin panel checks ADMIN_EMAILS whitelist
- Guestbook admin endpoints verify admin token
- Forum admin endpoints verify admin token

---

## Deployment Checklist

Before deploying to production, verify:

- [ ] NEXTAUTH_SECRET is set
- [ ] All AWS credentials are valid
- [ ] All API keys are valid
- [ ] Supabase service role key is rotated
- [ ] Google OAuth credentials are configured
- [ ] Environment variables are marked as "Sensitive" in Vercel
- [ ] No secrets are in git history
- [ ] Build completes without errors
- [ ] All tests pass

---

## Emergency Response

### If credentials are exposed:

1. **Immediately:**
   - Rotate the exposed credential
   - Update `.env.local`
   - Redeploy application
   - Monitor for unauthorized access

2. **Within 24 hours:**
   - Review API usage logs
   - Check for unauthorized changes
   - Update password if applicable

3. **Document:**
   - What was exposed
   - When it was rotated
   - Any suspicious activity found

---

## References

- [NextAuth.js Documentation](https://next-auth.js.org)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

Last updated: 2026-03-28
