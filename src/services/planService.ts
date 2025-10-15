import { HouseholdFormValues, Plan } from "../types";
import { Language } from "../i18n/translations";

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
  {
    id: "gold-family",
    name: "Gold Family",
    carrier: "Care&Co",
    monthlyPremium: 338.9,
    deductible: 900,
    outOfPocketMax: 3200,
    summary:
      "Premium family plan with dental coverage included and wellness programs.",
    coverageHighlights: [
      "Preventive dental coverage",
      "Maternity and pediatric program",
      "Basic international assistance",
    ],
  },
  {
    id: "bronze-flex",
    name: "Bronze Flex",
    carrier: "HealthyWay",
    monthlyPremium: 198.75,
    deductible: 2000,
    outOfPocketMax: 6000,
    summary:
      "Budget-friendly option with flexibility to choose out-of-network specialists.",
    coverageHighlights: [
      "Partial reimbursement for out-of-network visits",
      "Emergency coverage with no deductible",
      "Electronic prescriptions",
    ],
  },
  {
    id: "platinum-care",
    name: "Platinum Care",
    carrier: "Summit Insurance",
    monthlyPremium: 412.4,
    deductible: 500,
    outOfPocketMax: 2500,
    summary:
      "The most complete coverage for families seeking extra benefits and reduced wait times.",
    coverageHighlights: [
      "Mental health benefits",
      "Private room during hospital stays",
      "Priority scheduling for appointments",
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
    "gold-family": {
      summary:
        "Plan familiar premium con cobertura dental incluida y programas de bienestar.",
      coverageHighlights: [
        "Cobertura dental preventiva",
        "Programa de maternidad y pediatría",
        "Asistencia internacional básica",
      ],
    },
    "bronze-flex": {
      summary:
        "Alternativa económica con flexibilidad para elegir especialistas fuera de la red.",
      coverageHighlights: [
        "Reintegro parcial fuera de red",
        "Cobertura de emergencias sin deducible",
        "Recetas electrónicas",
      ],
    },
    "platinum-care": {
      summary:
        "La cobertura más completa para familias que buscan beneficios adicionales y tiempos de espera reducidos.",
      coverageHighlights: [
        "Beneficios en salud mental",
        "Hab. privada en internaciones",
        "Atención prioritaria en turnos",
      ],
    },
  },
  en: {},
};

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const fetchPlansForHousehold = async (
  household: HouseholdFormValues,
  language: Language = "es"
): Promise<Plan[]> => {
  const householdFactor =
    Math.max(household.memberQuantity, 1) +
    household.members.reduce((acc, member) => acc + member.age / 120, 0);

  return new Promise((resolve) => {
    setTimeout(() => {
      const tailoredPlans = BASE_PLANS.map((plan, index) => {
        const premiumAdjustment = householdFactor * (index + 1) * 12.4;
        const localization = PLAN_LOCALIZED_COPY[language]?.[plan.id];
        return {
          ...plan,
          monthlyPremium: roundCurrency(plan.monthlyPremium + premiumAdjustment),
          summary: localization?.summary ?? plan.summary,
          coverageHighlights:
            localization?.coverageHighlights ?? plan.coverageHighlights,
        };
      });
      resolve(tailoredPlans);
    }, 700);
  });
};
