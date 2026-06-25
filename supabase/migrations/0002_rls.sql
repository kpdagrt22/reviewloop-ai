-- ReviewLoop AI — Row Level Security
-- Principle: a user can only access rows belonging to an organization they are
-- a member of. No cross-org leakage. Profiles are self-scoped.

-- Helper: is the current user a member of an organization?
-- SECURITY DEFINER so it can read organization_members without triggering that
-- table's own RLS (which would otherwise recurse).
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
  );
$$;

-- When an organization is created, enroll the owner as a member automatically.
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (organization_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_organization_created on public.organizations;
create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

-- Enable RLS on every table -------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.organizations       enable row level security;
alter table public.organization_members enable row level security;
alter table public.customers           enable row level security;
alter table public.review_campaigns    enable row level security;
alter table public.message_templates   enable row level security;
alter table public.review_requests     enable row level security;
alter table public.reviews             enable row level security;
alter table public.ai_reply_drafts     enable row level security;
alter table public.testimonials        enable row level security;
alter table public.social_posts        enable row level security;
alter table public.notification_events enable row level security;
alter table public.ai_review_logs      enable row level security;
alter table public.subscriptions       enable row level security;

-- profiles: self only -------------------------------------------------------
create policy "profiles_select_self" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());

-- organizations: members can read; owner can create/update/delete -----------
create policy "orgs_select_member" on public.organizations
  for select using (public.is_org_member(id));
create policy "orgs_insert_owner" on public.organizations
  for insert with check (owner_id = auth.uid());
create policy "orgs_update_owner" on public.organizations
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "orgs_delete_owner" on public.organizations
  for delete using (owner_id = auth.uid());

-- organization_members ------------------------------------------------------
-- A user can always see their own membership rows; members can see co-members.
create policy "members_select" on public.organization_members
  for select using (user_id = auth.uid() or public.is_org_member(organization_id));
-- Only the org owner may add/remove members.
create policy "members_write_owner" on public.organization_members
  for all
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_id and o.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organizations o
      where o.id = organization_id and o.owner_id = auth.uid()
    )
  );

-- Generic org-scoped policy applied to every data table ---------------------
-- Members of the organization get full CRUD on its rows.
-- NOTE: `subscriptions` is intentionally EXCLUDED here. Subscription state is
-- billing/entitlement data and must never be member-writable (a member could
-- otherwise self-grant a paid plan via the anon client). It is written only by
-- the Stripe webhook using the service-role client, which bypasses RLS.
do $$
declare
  t text;
  org_tables text[] := array[
    'customers','review_campaigns','message_templates','review_requests',
    'reviews','ai_reply_drafts','testimonials','social_posts',
    'notification_events','ai_review_logs'
  ];
begin
  foreach t in array org_tables loop
    execute format(
      'create policy %I on public.%I for all '
      || 'using (public.is_org_member(organization_id)) '
      || 'with check (public.is_org_member(organization_id));',
      t || '_org_member', t
    );
  end loop;
end;
$$;

-- subscriptions: members may READ their org's billing state, but never write it.
create policy "subscriptions_select_member" on public.subscriptions
  for select using (public.is_org_member(organization_id));
