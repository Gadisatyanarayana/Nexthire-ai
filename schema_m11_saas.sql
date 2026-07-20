-- NextHire AI - Milestone 11 (Multi-tenant SaaS)
-- Schema Extensions for Tenancy, Branding, and Billing

do $$ begin
    create type tenant_deployment_mode as enum ('POOL', 'BRIDGE', 'SILO');
    create type tenant_status as enum ('provisioning', 'active', 'grace_period', 'read_only', 'suspended', 'archived', 'deleted');
exception
    when duplicate_object then null;
end $$;

-- 1. SaaS Tenants
create table if not exists platform_tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  deployment_mode tenant_deployment_mode not null default 'POOL',
  status tenant_status not null default 'provisioning',
  billing_provider text, -- e.g. 'stripe', 'paddle'
  billing_customer_id text,
  region text not null default 'us-east-1',
  timezone text not null default 'UTC',
  locale text not null default 'en-US',
  created_by text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_tenants_slug on platform_tenants(slug);
create index if not exists idx_tenants_status on platform_tenants(status);

-- 2. Tenant Branding (White-Labeling)
create table if not exists platform_tenant_branding (
  tenant_id uuid primary key references platform_tenants(id) on delete cascade,
  custom_domain text unique,
  logo_url text,
  favicon_url text,
  primary_color text default '#000000',
  font_family text default 'Inter',
  dark_mode_palette jsonb default '{}'::jsonb,
  email_branding jsonb default '{}'::jsonb,
  login_background_url text,
  support_url text,
  privacy_policy_url text,
  terms_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_tenant_branding_domain on platform_tenant_branding(custom_domain);

-- 3. Tenant Subscriptions (Entitlements Base)
create table if not exists platform_tenant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references platform_tenants(id) on delete cascade,
  plan_id text not null, -- Links to application-level entitlement config
  status text not null, -- 'active', 'past_due', 'canceled'
  current_period_start timestamp not null,
  current_period_end timestamp not null,
  cancel_at_period_end boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create unique index if not exists idx_tenant_subs_active on platform_tenant_subscriptions(tenant_id) where status = 'active';

-- 4. Tenant Usage Metering
create table if not exists platform_tenant_usage_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references platform_tenants(id) on delete cascade,
  event_type text not null, -- e.g. 'interview_completed', 'ai_tokens_consumed'
  quantity numeric not null,
  idempotency_key text unique,
  timestamp timestamp default now()
);

create index if not exists idx_usage_events_tenant_time on platform_tenant_usage_events(tenant_id, timestamp);

-- Example RLS Policy demonstrating Pool Isolation
-- Note: In a real migration, we would apply this to ALL domain tables (Assessments, Submissions, etc.)
/*
ALTER TABLE platform_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON platform_assessments
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
*/
