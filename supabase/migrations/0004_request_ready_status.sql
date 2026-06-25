-- ReviewLoop AI — allow the 'ready' staging status on review_requests.
--
-- WHY: the app's request state machine (src/lib/reviews/request-status.ts)
-- treats `ready` as a first-class status (draft → ready → sent), and the
-- requests UI can "Save as ready". But the original CHECK in 0001_init.sql only
-- permitted ('draft','sent','clicked','completed','cancelled'), so writing
-- status='ready' was rejected by Postgres. This widens that CHECK.
--
-- NON-DESTRUCTIVE: only widens an existing CHECK constraint. No table/column
-- drops, no data changes. Existing rows (draft/sent/clicked/completed/cancelled)
-- all remain valid. Idempotent: safe to run more than once.

do $$
declare
  c record;
begin
  -- Drop whatever CHECK constraint currently governs review_requests.status,
  -- regardless of its (auto-generated) name, so we don't end up with two
  -- conflicting CHECKs that AND together.
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'review_requests'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.review_requests drop constraint %I', c.conname);
  end loop;

  alter table public.review_requests
    add constraint review_requests_status_check
    check (status in ('draft','ready','sent','clicked','completed','cancelled'));
end;
$$;
