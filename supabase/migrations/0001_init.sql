-- ReviewLoop AI — initial schema
-- All app tables are organization-scoped. RLS is added in 0002_rls.sql.

create extension if not exists "pgcrypto";

-- Generic updated_at trigger ----------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles ----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- organizations -----------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  business_type text,
  country text,
  state text,
  city text,
  timezone text,
  website text,
  phone text,
  google_review_link text,
  facebook_review_link text,
  other_review_link text,
  brand_tone text not null default 'professional',
  escalation_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

-- organization_members ----------------------------------------------------
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index if not exists idx_org_members_user on public.organization_members (user_id);
create index if not exists idx_org_members_org on public.organization_members (organization_id);

-- customers ---------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  service_date date,
  service_type text,
  consent_email boolean not null default false,
  consent_sms boolean not null default false,
  opt_out boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_customers_org on public.customers (organization_id);
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

-- review_campaigns --------------------------------------------------------
create table if not exists public.review_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  channel text not null default 'manual' check (channel in ('email','sms','manual','both')),
  timing_days_after_service integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_campaigns_org on public.review_campaigns (organization_id);
create trigger campaigns_updated_at before update on public.review_campaigns
  for each row execute function public.set_updated_at();

-- message_templates -------------------------------------------------------
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  campaign_id uuid references public.review_campaigns (id) on delete set null,
  channel text not null default 'email',
  subject text,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_templates_org on public.message_templates (organization_id);
create trigger templates_updated_at before update on public.message_templates
  for each row execute function public.set_updated_at();

-- review_requests ---------------------------------------------------------
create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  campaign_id uuid references public.review_campaigns (id) on delete set null,
  channel text not null default 'manual',
  status text not null default 'draft' check (status in ('draft','sent','clicked','completed','cancelled')),
  sent_at timestamptz,
  clicked_at timestamptz,
  completed_at timestamptz,
  request_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_requests_org on public.review_requests (organization_id);
create index if not exists idx_requests_customer on public.review_requests (customer_id);
create trigger requests_updated_at before update on public.review_requests
  for each row execute function public.set_updated_at();

-- reviews -----------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  platform text,
  rating integer check (rating between 1 and 5),
  reviewer_name text,
  review_text text,
  review_url text,
  review_date date,
  sentiment text check (sentiment in ('positive','neutral','negative')),
  status text not null default 'new' check (status in ('new','replied','escalated','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_reviews_org on public.reviews (organization_id);
create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- ai_reply_drafts ---------------------------------------------------------
create table if not exists public.ai_reply_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  review_id uuid not null references public.reviews (id) on delete cascade,
  tone text,
  draft_text text,
  status text not null default 'draft' check (status in ('draft','approved','posted','discarded')),
  ai_confidence numeric,
  created_at timestamptz not null default now()
);
create index if not exists idx_drafts_review on public.ai_reply_drafts (review_id);
create index if not exists idx_drafts_org on public.ai_reply_drafts (organization_id);

-- testimonials ------------------------------------------------------------
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  review_id uuid references public.reviews (id) on delete set null,
  quote_text text,
  customer_display_name text,
  service_type text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_testimonials_org on public.testimonials (organization_id);

-- social_posts ------------------------------------------------------------
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  review_id uuid references public.reviews (id) on delete set null,
  platform text,
  post_text text,
  status text not null default 'draft' check (status in ('draft','approved','posted')),
  created_at timestamptz not null default now()
);
create index if not exists idx_social_org on public.social_posts (organization_id);

-- notification_events -----------------------------------------------------
create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_org on public.notification_events (organization_id);

-- ai_review_logs ----------------------------------------------------------
create table if not exists public.ai_review_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  review_id uuid references public.reviews (id) on delete set null,
  provider text,
  model text,
  input_json jsonb,
  output_json jsonb,
  status text,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_logs_org on public.ai_review_logs (organization_id);

-- subscriptions -----------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,
  status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
