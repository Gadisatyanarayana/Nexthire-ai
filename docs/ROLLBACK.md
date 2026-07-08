# Rollback Procedure
If production fails:
1. Revert Vercel deployment to previous stable SHA.
2. If database migration failure, run `DROP TABLE sd_certificates;` etc. in Supabase.