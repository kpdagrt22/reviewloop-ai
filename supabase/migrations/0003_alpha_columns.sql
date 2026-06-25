-- ReviewLoop AI — alpha hardening: additive columns.
-- NON-DESTRUCTIVE: only `add column if not exists` + one trigger. No drops, no
-- data loss. Safe to run on an existing 0001/0002 database.

-- organizations: extra review platforms + a default request channel ----------
alter table public.organizations
  add column if not exists yelp_review_link text,
  add column if not exists trustpilot_review_link text,
  add column if not exists default_request_channel text not null default 'manual';

-- Constrain default_request_channel to the known channels (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organizations_default_request_channel_check'
  ) then
    alter table public.organizations
      add constraint organizations_default_request_channel_check
      check (default_request_channel in ('manual','email','sms','both'));
  end if;
end;
$$;

-- reviews: optional link back to the review request that produced it ---------
alter table public.reviews
  add column if not exists review_request_id uuid
    references public.review_requests (id) on delete set null;
create index if not exists idx_reviews_review_request
  on public.reviews (review_request_id);

-- ai_reply_drafts: track edits with updated_at + trigger ---------------------
alter table public.ai_reply_drafts
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists ai_reply_drafts_updated_at on public.ai_reply_drafts;
create trigger ai_reply_drafts_updated_at
  before update on public.ai_reply_drafts
  for each row execute function public.set_updated_at();
