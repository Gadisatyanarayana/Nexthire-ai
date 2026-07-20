-- NextHire AI - Milestone 10 (Enterprise Integrations & SDK)
-- Schema Extensions for API Keys, Webhooks, OAuth, and Idempotency

-- 1. API Keys Table
create table if not exists platform_api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  prefix text not null check (prefix in ('nh_live', 'nh_test', 'nh_dev')),
  key_id text not null unique,
  key_hash text not null,
  scopes text[] not null default '{}'::text[],
  created_by text not null,
  rotated_from uuid references platform_api_keys(id),
  last_ip text,
  last_user_agent text,
  created_at timestamp default now(),
  expires_at timestamp,
  last_used_at timestamp,
  revoked_at timestamp
);

-- Index for fast lookup by key_id
create index if not exists idx_api_keys_key_id on platform_api_keys(key_id);
create index if not exists idx_api_keys_tenant on platform_api_keys(tenant_id);

-- 2. Webhook Subscriptions
create table if not exists platform_webhooks (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  url text not null,
  secret text not null,
  active boolean default true,
  events text[] not null default '{}'::text[],
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_webhooks_tenant on platform_webhooks(tenant_id);

-- 3. Webhook Deliveries (Tracking & Dead-letter)
do $$ begin
    create type webhook_delivery_status as enum ('pending', 'queued', 'processing', 'delivered', 'failed', 'dead-letter');
exception
    when duplicate_object then null;
end $$;

create table if not exists platform_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references platform_webhooks(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  status webhook_delivery_status default 'pending',
  attempts integer default 0,
  next_retry_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_webhook_deliveries_status on platform_webhook_deliveries(status, next_retry_at);

-- 4. Idempotency Keys
create table if not exists platform_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  key text not null,
  request_hash text not null,
  response jsonb,
  status text not null check (status in ('processing', 'completed', 'failed')),
  created_at timestamp default now(),
  expires_at timestamp not null
);

create unique index if not exists idx_idempotency_tenant_key on platform_idempotency_keys(tenant_id, key);

-- 5. OAuth Connections
create table if not exists platform_oauth_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  provider text not null,
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  scopes text[] not null default '{}'::text[],
  metadata jsonb default '{}'::jsonb,
  expires_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create unique index if not exists idx_oauth_tenant_provider on platform_oauth_connections(tenant_id, provider);

-- 6. Outbox for Events
create table if not exists platform_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null,
  tenant_id text,
  status text default 'pending' check (status in ('pending', 'processed', 'failed')),
  created_at timestamp default now(),
  processed_at timestamp
);

create index if not exists idx_outbox_status on platform_outbox(status);
