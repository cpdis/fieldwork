export type CohortStatus = 'draft' | 'open' | 'closed' | 'cancelled';
export type BookingStatus = 'pending' | 'paid' | 'comp' | 'cancelled' | 'refunded' | 'expired';
export type EmailKind = 'confirmation' | 'pre_course' | 'follow_up' | 'seat_offer';

export interface Cohort {
  id: string;
  slug: string;
  title: string;
  starts_at: Date;
  ends_at: Date;
  venue_name: string | null;
  venue_address: string | null;
  joining_notes: string | null;
  capacity: number;
  price_cents: number;
  currency: string;
  status: CohortStatus;
  pre_course_days: number;
  follow_up_days: number;
  created_at: Date;
  updated_at: Date;
}

export interface CohortWithCounts extends Cohort {
  seats_taken: number;
  seats_held: number;
  seats_left: number;
  waitlist_count: number;
}

export interface Booking {
  id: string;
  cohort_id: string;
  status: BookingStatus;
  source: 'stripe' | 'manual';
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  abn: string | null;
  abn_valid: boolean | null;
  dietary: string | null;
  admin_notes: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_total_cents: number | null;
  currency: string | null;
  hold_expires_at: Date | null;
  paid_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface WaitlistEntry {
  id: string;
  cohort_id: string;
  name: string;
  email: string;
  company: string | null;
  note: string | null;
  offered_at: Date | null;
  removed_at: Date | null;
  created_at: Date;
}

export interface EmailLogRow {
  id: string;
  booking_id: string | null;
  waitlist_id: string | null;
  kind: EmailKind;
  to_email: string;
  status: 'sending' | 'sent' | 'failed' | 'logged';
  provider_id: string | null;
  error: string | null;
  created_at: Date;
  sent_at: Date | null;
}
