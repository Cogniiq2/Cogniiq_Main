// Shapes returned by the client onboarding RPCs (migration 20261124120000).
// The database is authoritative for every rule; these types only describe its answers.

export type IntakeStage = 'business' | 'operations' | 'appointments' | 'knowledge' | 'escalation';
export type IntakeStatus = 'not_started' | 'in_progress' | 'submitted' | 'changes_requested' | 'approved';
export type AnswerStatus = 'draft' | 'submitted' | 'approved' | 'changes_requested';
export type QuestionKind =
  | 'text' | 'textarea' | 'email' | 'phone' | 'url' | 'number' | 'choice' | 'multi_choice' | 'hours';
export type RequestStatus = 'open' | 'answered' | 'accepted' | 'cancelled';
export type MessageKind = 'invitation' | 'reminder' | 'request';
export type MessageStatus = 'sending' | 'accepted' | 'failed';
export type MilestoneState = 'done' | 'current' | 'upcoming';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export interface DayHours { closed: boolean; ranges: Array<[string, string]> }
export type OpeningHours = Partial<Record<DayKey, DayHours>>;

/** A stored answer value. Its JSON shape follows the question kind. */
export type AnswerValue = string | number | string[] | OpeningHours | null;

export interface QuestionOption { value: string; label: string }

export interface Milestone { key: string; label: string; state: MilestoneState }

export interface Question {
  code: string;
  stage: IntakeStage;
  label: string;
  help?: string | null;
  placeholder?: string | null;
  kind: QuestionKind;
  options?: QuestionOption[] | null;
  max_length?: number | null;
  required: boolean;
}

export interface CustomerAnswer {
  value: AnswerValue;
  status: AnswerStatus;
  owner_comment: string | null;
  updated_at: string;
}

export interface CustomerRequest {
  id: string;
  question: string;
  status: RequestStatus;
  response: string | null;
  responded_at: string | null;
  created_at: string;
}

export interface CustomerIntakeSummary {
  engagement_id: string;
  organization_name: string | null;
  company: string | null;
  intake_status: IntakeStatus;
  open_requests: number;
  milestones: Milestone[];
}

export interface CustomerIntake {
  engagement_id: string;
  organization_name: string | null;
  healthcare: boolean;
  can_edit: boolean;
  intake: {
    status: IntakeStatus;
    current_stage: string | null;
    version: number;
    submitted_at: string | null;
    reviewed_at: string | null;
    review_note: string | null;
  };
  questions: Question[];
  answers: Record<string, CustomerAnswer>;
  prefill: Record<string, AnswerValue>;
  requests: CustomerRequest[];
  milestones: Milestone[];
}

/* ------------------------------------------------------------------ owner side */

export interface OwnerQuestion {
  code: string;
  stage: IntakeStage;
  label: string;
  kind: QuestionKind;
  options?: QuestionOption[] | null;
  required: boolean;
  target_field_code: string | null;
  target_field_label: string | null;
  target_is_blocker: boolean | null;
  current_field_value: string | null;
}

export interface OwnerAnswer extends CustomerAnswer {
  approved_value: AnswerValue;
  approved_at: string | null;
  applied_field_code: string | null;
  updated_by_email: string | null;
}

export interface OnboardingInvitation {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  status: 'active' | 'revoked' | 'superseded';
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
  portal_invitation_status: 'pending' | 'accepted' | 'revoked' | 'expired' | null;
  access_active: boolean;
}

export interface OnboardingMessage {
  id: string;
  kind: MessageKind;
  is_test: boolean;
  recipient_email: string;
  subject: string;
  status: MessageStatus;
  error_code: string | null;
  provider_message_id: string | null;
  created_at: string;
  completed_at: string | null;
  /** Which entry link the email carried. Recorded only once the provider accepted it. */
  link_kind: 'activation' | 'login' | 'portal' | null;
  /** Expiry of the EMAIL LINK (activation only) — not of the portal invitation. */
  link_expires_at: string | null;
}

export interface OwnerRequest {
  id: string;
  question: string;
  question_code: string | null;
  task_id: string | null;
  status: RequestStatus;
  response: string | null;
  responded_at: string | null;
  created_at: string;
  closed_at: string | null;
}

export interface OnboardingContact { email: string; name: string | null; source: 'customer' | 'member' | 'portal_invitation' | 'contact' }

export interface SenderDetails { legal_name: string | null; email: string | null; phone: string | null }

export interface OwnerOnboardingDetail {
  engagement_id: string;
  service_key: string;
  healthcare: boolean;
  customer: { id: string; company: string | null; contact_name: string | null; email: string | null; organization_id: string | null };
  organization: { id: string; name: string } | null;
  link_candidates: Array<{ id: string; name: string }>;
  contacts: OnboardingContact[];
  members: Array<{ email: string; role: string; status: string; last_sign_in_at: string | null }>;
  invitations: OnboardingInvitation[];
  messages: OnboardingMessage[];
  intake: {
    id: string; status: IntakeStatus; current_stage: string | null; version: number;
    started_at: string | null; submitted_at: string | null; reviewed_at: string | null; review_note: string | null;
  } | null;
  questions: OwnerQuestion[];
  answers: Record<string, OwnerAnswer>;
  requests: OwnerRequest[];
  sender: SenderDetails | null;
  milestones: Milestone[];
}

export interface ReviewDecision { code: string; action: 'approve' | 'request_changes'; comment?: string; expected_value?: AnswerValue }
