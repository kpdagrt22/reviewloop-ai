/**
 * Hand-maintained Supabase database types. Regenerate with:
 *   supabase gen types typescript --local > src/lib/supabase/types.ts
 * Kept in sync with supabase/migrations/0001_init.sql.
 */

type Timestamp = string;
type UUID = string;

export interface Database {
  public: {
    Tables: {
      profiles: Row<{
        id: UUID;
        full_name: string | null;
        email: string | null;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
      organizations: Row<{
        id: UUID;
        owner_id: UUID;
        name: string;
        business_type: string | null;
        country: string | null;
        state: string | null;
        city: string | null;
        timezone: string | null;
        website: string | null;
        phone: string | null;
        google_review_link: string | null;
        facebook_review_link: string | null;
        yelp_review_link: string | null;
        trustpilot_review_link: string | null;
        other_review_link: string | null;
        brand_tone: string;
        escalation_email: string | null;
        default_request_channel: string;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
      organization_members: Row<{
        id: UUID;
        organization_id: UUID;
        user_id: UUID;
        role: "owner" | "admin" | "member";
        created_at: Timestamp;
      }>;
      customers: Row<{
        id: UUID;
        organization_id: UUID;
        name: string;
        email: string | null;
        phone: string | null;
        service_date: string | null;
        service_type: string | null;
        consent_email: boolean;
        consent_sms: boolean;
        opt_out: boolean;
        notes: string | null;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
      review_campaigns: Row<{
        id: UUID;
        organization_id: UUID;
        name: string;
        channel: "email" | "sms" | "manual" | "both";
        timing_days_after_service: number;
        active: boolean;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
      message_templates: Row<{
        id: UUID;
        organization_id: UUID;
        campaign_id: UUID | null;
        channel: string;
        subject: string | null;
        body: string;
        active: boolean;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
      review_requests: Row<{
        id: UUID;
        organization_id: UUID;
        customer_id: UUID | null;
        campaign_id: UUID | null;
        channel: string;
        status: string;
        sent_at: Timestamp | null;
        clicked_at: Timestamp | null;
        completed_at: Timestamp | null;
        request_url: string | null;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
      reviews: Row<{
        id: UUID;
        organization_id: UUID;
        customer_id: UUID | null;
        review_request_id: UUID | null;
        platform: string | null;
        rating: number | null;
        reviewer_name: string | null;
        review_text: string | null;
        review_url: string | null;
        review_date: string | null;
        sentiment: string | null;
        status: string;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
      ai_reply_drafts: Row<{
        id: UUID;
        organization_id: UUID;
        review_id: UUID;
        tone: string | null;
        draft_text: string | null;
        status: string;
        ai_confidence: number | null;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
      testimonials: Row<{
        id: UUID;
        organization_id: UUID;
        review_id: UUID | null;
        quote_text: string | null;
        customer_display_name: string | null;
        service_type: string | null;
        approved: boolean;
        created_at: Timestamp;
      }>;
      social_posts: Row<{
        id: UUID;
        organization_id: UUID;
        review_id: UUID | null;
        platform: string | null;
        post_text: string | null;
        status: string;
        created_at: Timestamp;
      }>;
      notification_events: Row<{
        id: UUID;
        organization_id: UUID;
        event_type: string;
        metadata: Record<string, unknown> | null;
        created_at: Timestamp;
      }>;
      ai_review_logs: Row<{
        id: UUID;
        organization_id: UUID;
        review_id: UUID | null;
        provider: string | null;
        model: string | null;
        input_json: Record<string, unknown> | null;
        output_json: Record<string, unknown> | null;
        status: string | null;
        error_message: string | null;
        created_at: Timestamp;
      }>;
      subscriptions: Row<{
        id: UUID;
        organization_id: UUID;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        plan: string | null;
        status: string | null;
        current_period_end: Timestamp | null;
        created_at: Timestamp;
        updated_at: Timestamp;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

/**
 * Helper that derives Insert/Update shapes (all optional) from a Row. The
 * `Relationships: []` field is required by @supabase/supabase-js's GenericTable
 * constraint — without it the client resolves every query result to `never`.
 */
type Row<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
