# NextHire Enterprise Placement Platform — Operations & Incident Response Runbook

Standard Operating Procedures (SOP), Emergency Response Playbooks, and Disaster Recovery Procedures for Production Operations.

---

## 📞 Incident Response Escalation & SLA Matrix

| Severity Level | Definition | Response Time SLA | Resolution Target | Escalation Target |
| :--- | :--- | :--- | :--- | :--- |
| **SEV-1 (Critical Outage)** | Online Judge broken, Auth down, or platform-wide HTTP 5xx | `< 5 Minutes` | `< 15 Minutes` | Lead DevOps & Lead Architect |
| **SEV-2 (Major Impact)** | Single learning module down, elevated API latencies (`> 1s`) | `< 15 Minutes` | `< 60 Minutes` | Backend Lead & Infra Team |
| **SEV-3 (Minor Degradation)**| Non-blocking UI glitch, slow analytics rendering | `< 1 Hour` | `< 24 Hours` | On-Call Frontend Engineer |

---

## 🚨 Emergency Rollback & Recovery Procedures
**Target Rollback Execution Window: `< 10 Minutes` (RTO)**

### 1. Vercel Instant Deployment Rollback
If a deployment fails smoke tests or causes runtime exceptions:
```bash
# Option A: Rollback via Vercel CLI
npx vercel rollback dpl_verified_stable_v1

# Option B: Re-deploy previous stable Git commit
git checkout 34acfe0
git push origin framework-stable --force
```

### 2. Database Recovery & Point-in-Time Snapshot Restoration
If database corruption or destructive migration occurs:
```bash
# Step 1: Lock write access / enable maintenance mode
# Step 2: Restore latest automated snapshot from Supabase Dashboard
# Step 3: Run schema integrity validation
node -e "require('./src/scripts/verify_db.js')"
```

### 3. Online Judge Queue Reset & Recovery
If code execution sandboxes hang or memory leaks lock up judge workers:
```bash
# Drain and restart stuck Docker / Lambda execution containers
docker stop $(docker ps -a -q --filter ancestor=nexthire-judge-runner)
docker system prune -f --volumes
```

---

## 🛠️ Outage & Failover Playbooks

### A. Supabase Database Outage / Connection Exhaustion
1. **Symptoms**: API returns `500 Internal Server Error` with `connection pool exhausted` or `Connection timeout`.
2. **Immediate Action**:
   - Enable Supabase Supavisor connection pooling mode (Transaction pool, Port `6543`).
   - Purge idle client connections: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';`.

### B. Google OAuth Login Failure (`redirect_uri_mismatch`)
1. **Symptoms**: Sign-in page redirects with OAuth error code.
2. **Immediate Action**:
   - Open Google Cloud Console → Credentials → Authorized Redirect URIs.
   - Verify `https://nexthire-ai.vercel.app/api/auth/callback/google` is registered.
   - Ensure `NEXTAUTH_URL=https://nexthire-ai.vercel.app` is set in Vercel environment variables.

### C. Vercel Function Memory Threshold Exceeded
1. **Symptoms**: Vercel logs log `Server is approaching the used memory threshold, restarting...`.
2. **Immediate Action**:
   - Confirm `/api/questions` returns lightweight paginated JSON (strip heavy `testcases` arrays).
   - Ensure `Cache-Control` header `public, s-maxage=60, stale-while-revalidate=120` is active.

---

## ⏱️ Weekly & Monthly Maintenance Checklist

- [ ] **Database Vacuum & Re-Index**: Run `VACUUM ANALYZE` on `submissions`, `user_activity`, and `questions` tables.
- [ ] **Secret Rotation**: Rotate `NEXTAUTH_SECRET` and service role keys every 90 days.
- [ ] **Log Retention & Purge**: Archive user activity logs older than 180 days.
- [ ] **Dry-Run Disaster Rollback**: Execute mock rollback to staging target once per month.
