import {
  HouseholdType,
  LeadHouseholdMember,
  LeadWizardMetadata,
  LeadPlanSelection,
  LeadPlanResults,
  WizardPrimaryApplicant,
} from "../types/leadWizard";

export const emptyMetadata = (): LeadWizardMetadata => ({
    version: 1,
    wizard: { step: "householdType" },
    household: {
      type: null,
      zipCode: null,
      countyFips: null,
      income: null,
      effectiveDate: null,
      size: null,
      updatedAt: null,
      stateId: null,
      stateName: null,
      countyName: null,
    },
    members: [],
    plan: {
      selection: null,
      results: null,
    },
    consent: {
      signatureEntryId: null,
      status: "NOT_REQUESTED",
      requestedAt: null,
      lastChecked: null,
      signedAt: null,
    },
  });

export const parseMetadata = (raw: unknown): LeadWizardMetadata => {
  if (!raw) {
    return emptyMetadata();
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return normalizeMetadata(parsed);
    } catch (error) {
      console.warn("[public] Failed to parse metadata, returning empty.", error);
      return emptyMetadata();
    }
  }

  if (typeof raw === "object") {
    return normalizeMetadata(raw as Record<string, unknown>);
  }

  return emptyMetadata();
};

export const normalizeMetadata = (
  payload: Record<string, unknown>
): LeadWizardMetadata => {
  const base = emptyMetadata();

  const wizard = {
    ...base.wizard,
    ...(typeof payload.wizard === "object" ? payload.wizard : {}),
  } as LeadWizardMetadata["wizard"];

  const household = {
    ...base.household,
    ...(typeof payload.household === "object" ? payload.household : {}),
  };

  const planRaw =
    payload?.plan && typeof payload.plan === "object"
      ? (payload.plan as Record<string, unknown>)
      : {};

  const plan = {
    selection: normalizePlanSelection(planRaw.selection),
    results: normalizePlanResults(planRaw.results),
  };

  const consent = {
    ...base.consent,
    ...(typeof payload.consent === "object" ? payload.consent : {}),
  };

  const membersRaw = Array.isArray(payload.members) ? payload.members : [];
  const members: LeadHouseholdMember[] = membersRaw
    .map((member) => normalizeMember(member as Record<string, unknown>))
    .filter((member) => Boolean(member)) as LeadHouseholdMember[];

  return {
    version: typeof payload.version === "number" ? payload.version : 1,
    wizard,
    household,
    members,
    plan,
    consent,
  };
};

const normalizeMember = (
  member: Record<string, unknown>
): LeadHouseholdMember | null => {
  const role = toUpperString(member.role) as LeadHouseholdMember["role"];
  const firstName = toStringOrNull(member.firstName);
  const lastName = toStringOrNull(member.lastName);
  const gender = toUpperString(member.gender) as "M" | "F" | "X" | null;
  const birthDate = toStringOrNull(member.birthDate);

  if (!role || !firstName || !lastName || !gender || !birthDate) {
    return null;
  }

  return {
    role,
    firstName,
    lastName,
    gender,
    birthDate,
    email: toStringOrNull(member.email),
    phone: toStringOrNull(member.phone),
  };
};

const toStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toUpperString = (value: unknown): string | null => {
  const normalized = toStringOrNull(value);
  return normalized ? normalized.toUpperCase() : null;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePlanSelection = (
  value: unknown
): LeadPlanSelection | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const selection = value as Record<string, unknown>;
  const planId = toStringOrNull(selection.planId);
  if (!planId) {
    return null;
  }

  return {
    planId,
    issuer: toStringOrNull(selection.issuer),
    premium: toNumberOrNull(selection.premium),
    aptc: toNumberOrNull(selection.aptc),
    deductible: toNumberOrNull(selection.deductible),
    metalLevel: toStringOrNull(selection.metalLevel),
    productType: toStringOrNull(selection.productType),
    name: toStringOrNull(selection.name),
  };
};

const normalizePlanResults = (
  value: unknown
): LeadPlanResults | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const results = value as Record<string, unknown>;
  return {
    fetchedAt: toStringOrNull(results.fetchedAt),
    count: toNumberOrNull(results.count),
    filters: results.filters,
  };
};

export const householdNeedsAdditionalMembers = (
  type: HouseholdType | null
): boolean => {
  return type === "PAREJA" || type === "FAMILIA";
};

export const isHouseholdComplete = (
  type: HouseholdType | null,
  members: LeadHouseholdMember[]
): boolean => {
  if (!type) {
    return false;
  }

  if (members.length === 0) {
    return false;
  }

  if (type === "SOLTERO") {
    return members.length === 1;
  }

  if (type === "PAREJA") {
    return (
      members.length === 2 &&
      members.some((member) => member.role === "PRIMARY") &&
      members.some((member) => member.role === "SPOUSE")
    );
  }

  if (type === "FAMILIA") {
    return members.length >= 2;
  }

  return false;
};

export const primaryFromMetadata = (
  metadata: LeadWizardMetadata
): WizardPrimaryApplicant | null => {
  const primaryMember = metadata.members.find(
    (member) => member.role === "PRIMARY"
  );

  if (!primaryMember) {
    return null;
  }

  return {
    firstName: primaryMember.firstName,
    lastName: primaryMember.lastName,
    gender: primaryMember.gender,
    birthDate: primaryMember.birthDate,
    phone: primaryMember.phone ?? "",
    email: primaryMember.email ?? "",
    acceptsTerms: Boolean(metadata.wizard?.termsAcceptedAt),
  };
};
