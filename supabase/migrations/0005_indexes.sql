-- ReviewLoop AI — performance indexes for common filtered queries.
--
-- NON-DESTRUCTIVE and idempotent (create index if not exists). These back the
-- status/customer filters the dashboard, review list, request list, and reply
-- queue run on every page load. Safe to run on an existing database.

-- Reviews are filtered by customer and by status within an org.
create index if not exists idx_reviews_customer
  on public.reviews (customer_id);
create index if not exists idx_reviews_org_status
  on public.reviews (organization_id, status);

-- The reply queue filters drafts by status within an org (e.g. pending = draft).
create index if not exists idx_drafts_org_status
  on public.ai_reply_drafts (organization_id, status);

-- The requests list filters by status within an org.
create index if not exists idx_requests_org_status
  on public.review_requests (organization_id, status);
