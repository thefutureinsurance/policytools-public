export interface PublicLeadError {
  field: string | null;
  message: string;
}

export interface PublicStartLeadResponse {
  publicStartLead: {
    success: boolean;
    leadId: string | null;
    metadata: string | null;
    errors?: PublicLeadError[] | null;
  } | null;
}

export interface PublicUpdateHouseholdResponse {
  publicUpdateHousehold: {
    success: boolean;
    metadata: string | null;
    errors?: PublicLeadError[] | null;
  } | null;
}

export interface PublicConfirmPlanResponse {
  publicConfirmPlan: {
    success: boolean;
    metadata: string | null;
    signingLink: string | null;
    errors?: PublicLeadError[] | null;
  } | null;
}

export interface PublicCheckConsentResponse {
  publicCheckConsent: {
    success: boolean;
    status: string | null;
    metadata: string | null;
    errors?: PublicLeadError[] | null;
  } | null;
}

export interface PublicLeadResponse {
  publicLead: string | null;
}

export interface PublicSignatureStatusResponse {
  publicSignatureStatus: string | null;
}
