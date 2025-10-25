import client from "../apolloClient";
import { Plan } from "../types";
import { Language } from "../i18n/translations";
import { PublicQuoteFormState } from "../gql/types/IPQuote";
import { PUBLIC_MARKETPLACE_2 } from "../gql/publicMarketplace";
import {
  MarketplacePlan,
  MarketplaceResponse,
} from "../gql/types/IMarketplace";
import { LeadWizardMetadata } from "../types/leadWizard";
import { ZipcodeByZip } from "../gql/types/IResponseZipCode";

interface PublicMarketplace2Response {
  publicMarketplace2: string | null;
}

const BASE_PLANS: Plan[] = [
  {
    id: "silver-plus",
    name: "Silver Plus",
    carrier: "TFI Health",
    monthlyPremium: 265.5,
    deductible: 1200,
    outOfPocketMax: 4500,
    summary:
      "Comprehensive coverage with access to a wide network of specialists and savings on generic prescriptions.",
    coverageHighlights: [
      "Unlimited in-network visits",
      "Lower copay at partner pharmacies",
      "24/7 telemedicine access",
    ],
  },
];

interface PlanLocalizedCopy {
  summary: string;
  coverageHighlights: string[];
}

const PLAN_LOCALIZED_COPY: Record<
  Language,
  Record<string, PlanLocalizedCopy>
> = {
  es: {
    "silver-plus": {
      summary:
        "Cobertura integral con acceso a una red amplia de especialistas y beneficios en medicamentos genéricos.",
      coverageHighlights: [
        "Consultas ilimitadas en red",
        "Copago reducido en farmacias adheridas",
        "Telemedicina 24/7",
      ],
    },
  },
  en: {},
};

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const calculateAge = (dateString: string): number | null => {
  if (!dateString) {
    return null;
  }
  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - parsedDate.getFullYear();
  const monthDiff = today.getMonth() - parsedDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < parsedDate.getDate())
  ) {
    age -= 1;
  }
  return age;
};

const getEffectiveDate = (): string => {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return nextMonth.toISOString().split("T")[0];
};

const buildPeoplePayload = (household: PublicQuoteFormState) => {
  return household.members.map((member, index) => {
    const age =
      typeof member.age === "number" && Number.isFinite(member.age)
        ? member.age
        : calculateAge(member.dateOfBirth ?? "");

    return {
      age: age ?? undefined,
      dob: member.dateOfBirth || undefined,
      gender: member.female ? "Female" : "Male",
      isPregnant: false,
      pregnantWith: 0,
      isParent: false,
      usesTobacco: false,
      hasMec: false,
      aptcEligible: true,
      utilizationLevel: "Low",
      relationship: index === 0 ? "Self" : "Other Relationship",
      doesNotCohabitate: false,
    };
  });
};

const buildQuoteStateFromMetadata = (
  metadata: LeadWizardMetadata
): PublicQuoteFormState => {
  const members = metadata.members.map((member) => ({
    age: calculateAge(member.birthDate ?? "") ?? null,
    female: member.gender === "F",
    dateOfBirth: member.birthDate ?? "",
  }));

  const zipcode: ZipcodeByZip | null = metadata.household.zipCode
    ? {
        id: metadata.household.zipCode,
        zipCode: metadata.household.zipCode,
        countyFips: metadata.household.countyFips ?? "",
        countyFipsAll: metadata.household.countyFips ?? "",
        countyNamesAll: metadata.household.countyName ?? "",
        stateId: metadata.household.stateId ?? "",
        stateName: metadata.household.stateName ?? "",
        countyName: metadata.household.countyName ?? "",
        city: "",
      }
    : null;

  return {
    zipCode: metadata.household.zipCode,
    zipcodeByZip: zipcode,
    householdIncome: metadata.household.income ?? 0,
    householdIncomeTxt: metadata.household.income
      ? String(metadata.household.income)
      : "",
    memberQuantity: members.length || 1,
    members,
  };
};

const mapMarketplacePlanToPublicPlan = (plan: MarketplacePlan): Plan => {
  const carrier = plan.issuer?.name ?? "Unknown carrier";
  const monthlyPremium =
    plan.premium_w_credit ?? plan.premium ?? plan.premium ?? 0;
  const deductible =
    plan.deductibles_person?.combined?.amount ??
    plan.deductibles?.[0]?.amount ??
    0;
  const outOfPocketMax =
    plan.moops_person?.amount ?? plan.moops?.[0]?.amount ?? 0;

  const coverageHighlights =
    plan.benefits
      ?.filter((benefit) => benefit.covered)
      .slice(0, 3)
      .map((benefit) => benefit.name ?? "")
      .filter((text) => text.trim().length > 0) ?? [];

  const summaryParts: string[] = [];
  if (plan.metal_level) {
    summaryParts.push(`${plan.metal_level} level`);
  }
  if (plan.type) {
    summaryParts.push(`${plan.type} plan`);
  }

  const summaryBase =
    summaryParts.length > 0 ? summaryParts.join(" ") : "Marketplace plan";
  const summary = `${summaryBase} offered by ${carrier}.`;

  return {
    id: plan.id,
    name: plan.name,
    carrier,
    monthlyPremium: roundCurrency(monthlyPremium),
    deductible: roundCurrency(deductible),
    outOfPocketMax: roundCurrency(outOfPocketMax),
    summary,
    coverageHighlights:
      coverageHighlights.length > 0
        ? coverageHighlights
        : ["Standard essential health benefits coverage."],
  };
};

export const fetchPlansForHousehold = async (
  household: PublicQuoteFormState,
  language: Language = "es"
): Promise<Plan[]> => {
  const token = process.env.REACT_APP_PUBLIC_GRAPHQL_TOKEN ?? "";
  const zipCode =
    household.zipCode ??
    household.zipcodeByZip?.zipCode ??
    household.zipcodeByZip?.zipCode ??
    "";

  if (!token || !zipCode) {
    return BASE_PLANS;
  }

  const countyfipsAll = household.zipcodeByZip?.countyFipsAll ?? "";
  const countyfipsPrimary =
    countyfipsAll.split("|").map((value) => value.trim())[0] ||
    household.zipcodeByZip?.countyFips ||
    "";

  const incomeRaw =
    household.householdIncome ??
    Number(
      household.householdIncomeTxt.replace(/,/g, "").replace(/\s+/g, "")
    ) ??
    0;
  const householdIncome = Math.max(0, Math.round(incomeRaw));

  const effectiveDate = getEffectiveDate();
  const year = Number(effectiveDate.slice(0, 4));

  const peoplePayload = buildPeoplePayload(household).filter(
    (person) => person.age !== undefined || person.dob
  );

  if (peoplePayload.length === 0) {
    return BASE_PLANS;
  }

  const variables = {
    token,
    queryType: "BUSCAR_PLANES" as const,
    year,
    householdIncome,
    people: peoplePayload,
    effectiveDate,
    hasMarriedCouple: false,
    countyfips: countyfipsPrimary || null,
    state: household.zipcodeByZip?.stateId ?? null,
    zipCode,
    market: "Individual",
    numberOfMembers: household.memberQuantity,
    limit: 12,
    offset: 0,
    order: "asc",
  };

  try {
    const { data } = await client.query<PublicMarketplace2Response>({
      query: PUBLIC_MARKETPLACE_2,
      variables,
      fetchPolicy: "network-only",
    });

    const rawPayload = data?.publicMarketplace2;
    if (!rawPayload) {
      throw new Error("Empty marketplace response");
    }

    const parsed: MarketplaceResponse = JSON.parse(rawPayload);

    if (parsed.validation_errors?.length) {
      const message = parsed.validation_errors
        .map((error) => error.error)
        .filter(Boolean)
        .join(", ");
      throw new Error(message || "Marketplace validation error");
    }

    if (parsed.error?.message) {
      throw new Error(parsed.error.message);
    }

    const mappedPlans =
      parsed.plans?.map(mapMarketplacePlanToPublicPlan).filter(Boolean) ?? [];

    if (mappedPlans.length > 0) {
      return mappedPlans;
    }
  } catch (error) {
    console.warn("[public] marketplace2 fallback to base plans:", error);
  }

  const householdFactor =
    Math.max(household.memberQuantity, 1) +
    household.members.reduce((acc, member) => acc + (member.age ?? 0) / 120, 0);

  return new Promise((resolve) => {
    setTimeout(() => {
      const tailoredPlans = BASE_PLANS.map((plan, index) => {
        const premiumAdjustment = householdFactor * (index + 1) * 12.4;
        const localization = PLAN_LOCALIZED_COPY[language]?.[plan.id];
        return {
          ...plan,
          monthlyPremium: roundCurrency(
            plan.monthlyPremium + premiumAdjustment
          ),
          summary: localization?.summary ?? plan.summary,
          coverageHighlights:
            localization?.coverageHighlights ?? plan.coverageHighlights,
        };
      });
      resolve(tailoredPlans);
    }, 700);
  });
};

export const fetchPlansForMetadata = async (
  metadata: LeadWizardMetadata,
  language: Language = "es"
): Promise<Plan[]> => {
  const household = buildQuoteStateFromMetadata(metadata);
  return fetchPlansForHousehold(household, language);
};
