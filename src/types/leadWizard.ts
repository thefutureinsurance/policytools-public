export type HouseholdType = "SOLTERO" | "PAREJA" | "FAMILIA";

export type HouseholdRole = "PRIMARY" | "SPOUSE" | "DEPENDENT";

export type ConsentStatus = "PENDING" | "SIGNED" | "DECLINED" | "NOT_REQUESTED";

export interface LeadHouseholdMember {
  role: HouseholdRole;
  firstName: string;
  lastName: string;
  gender: "M" | "F" | "X";
  birthDate: string;
  email?: string | null;
  phone?: string | null;
}

export interface LeadHousehold {
  type: HouseholdType | null;
  zipCode: string | null;
  countyFips: string | null;
  income: number | null;
  effectiveDate?: string | null;
  size?: number | null;
  updatedAt?: string | null;
  stateId?: string | null;
  stateName?: string | null;
  countyName?: string | null;
}

export interface LeadPlanSelection {
  planId: string;
  issuer?: string | null;
  premium?: number | null;
  aptc?: number | null;
  deductible?: number | null;
  metalLevel?: string | null;
  productType?: string | null;
  name?: string | null;
}

export interface LeadPlanResults {
  fetchedAt?: string | null;
  filters?: unknown;
  count?: number | null;
}

export interface LeadConsent {
  signatureEntryId?: number | null;
  status?: ConsentStatus | null;
  requestedAt?: string | null;
  lastChecked?: string | null;
  signedAt?: string | null;
}

export interface LeadWizardMetadata {
  version?: number;
  wizard?: {
    step?: string | null;
    termsAcceptedAt?: string | null;
    [key: string]: unknown;
  };
  household: LeadHousehold;
  members: LeadHouseholdMember[];
  plan: {
    selection?: LeadPlanSelection | null;
    results?: LeadPlanResults | null;
  };
  consent: LeadConsent;
}

export interface WizardPrimaryApplicant {
  firstName: string;
  lastName: string;
  gender: "M" | "F" | "X";
  birthDate: string;
  phone: string;
  email: string;
  acceptsTerms: boolean;
}

export interface WizardState {
  leadId: string | null;
  metadata: LeadWizardMetadata;
  primaryApplicant: WizardPrimaryApplicant | null;
  signingLink?: string | null;
}

export type WizardStep =
  | "householdType"
  | "householdBasics"
  | "primary"
  | "members"
  | "plans"
  | "summary"
  | "consent"
  | "extra";
