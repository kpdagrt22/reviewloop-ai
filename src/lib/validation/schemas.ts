import { z } from "zod";

export const BRAND_TONES = [
  "professional",
  "warm",
  "friendly",
  "premium",
  "casual",
] as const;

export const BUSINESS_TYPES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Salon / Spa",
  "Cleaning",
  "Auto repair / Detailing",
  "Dental / Clinic",
  "Local repair shop",
  "Local agency",
  "Other",
] as const;

const optionalUrl = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .optional()
  .or(z.literal(""));

/** Onboarding / organization creation. */
export const onboardingSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required"),
  ownerName: z.string().trim().min(2, "Owner name is required"),
  email: z.string().trim().email("Valid email required"),
  phone: z.string().trim().optional().or(z.literal("")),
  website: optionalUrl,
  businessType: z.enum(BUSINESS_TYPES),
  country: z.string().trim().min(2, "Country is required"),
  state: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  timezone: z.string().trim().min(1, "Timezone is required"),
  googleReviewLink: optionalUrl,
  facebookReviewLink: optionalUrl,
  otherReviewLink: optionalUrl,
  brandTone: z.enum(BRAND_TONES).default("professional"),
  escalationEmail: z.string().trim().email("Valid email required").or(z.literal("")),
  messagingConsent: z
    .boolean()
    .refine((v) => v === true, "You must confirm you have customer messaging consent"),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

/** Customer create/edit. */
export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  serviceDate: z.string().optional().or(z.literal("")),
  serviceType: z.string().trim().optional().or(z.literal("")),
  consentEmail: z.boolean().default(false),
  consentSms: z.boolean().default(false),
  notes: z.string().trim().optional().or(z.literal("")),
});
export type CustomerInput = z.infer<typeof customerSchema>;

/** Manual review capture. */
export const reviewSchema = z.object({
  platform: z.string().trim().min(1, "Platform is required"),
  rating: z.coerce.number().int().min(1).max(5).nullable().optional(),
  reviewerName: z.string().trim().optional().or(z.literal("")),
  reviewText: z.string().trim().min(3, "Review text is required"),
  reviewUrl: optionalUrl,
  reviewDate: z.string().optional().or(z.literal("")),
  customerId: z.string().uuid().optional().or(z.literal("")),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

/** Auth. */
export const credentialsSchema = z.object({
  email: z.string().trim().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type CredentialsInput = z.infer<typeof credentialsSchema>;
