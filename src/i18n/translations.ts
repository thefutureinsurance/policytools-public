export type Language = "es" | "en";

export type TranslationValue = string | TranslationDictionary;

export interface TranslationDictionary {
  [key: string]: TranslationValue;
}

export const translations: Record<Language, TranslationDictionary> = {
  es: {
    header: {
      title: "TFI Marketplace",
      subtitle:
        "Acompañamos a tu hogar para encontrar la mejor cobertura médica.",
      languageLabel: "Idioma",
      options: {
        es: "Español",
        en: "Inglés",
      },
    },
    steps: {
      household: "Datos del hogar",
      plans: "Elegí un plan para tu familia",
      details: "Completá los datos del responsable",
      confirmation: "Confirmación",
    },
    footer: {
      line1:
        "Request, Calls and Invitations for applications for insurance on this website are made through Max Capital 97 LLC, only where licensed and appointed.",
      line2:
        " Max Capital 97 LLC National Producer Number is 19966989 and its state license numbers are set forth below.",
      line3: "Copyright ©2025 | The Future Insurance. All rights reserved.",
    },
    buttons: {
      back: "Volver",
      continue: "Continuar",
      viewDetails: "Ver detalles",
      close: "Cerrar",
      selectPlan: "Seleccionar plan",
      submitApplicant: "Enviar información",
      startOver: "Volver al inicio",
    },
    householdForm: {
      basicInfoTitle: "Información básica del hogar",
      zipCodeLabel: "Código postal",
      zipCodePlaceholder: "Ej: 12345",
      incomeLabel: "Ingreso familiar mensual",
      incomePlaceholder: "Ej: 2500",
      memberQuantityLabel: "Cantidad de miembros",
      membersTitleSingular: "Integrante familiar",
      membersTitlePlural: "Integrantes familiares",
      membersHelper:
        "Usamos esta información para recomendar planes que se ajusten a las edades y necesidades del hogar.",
      ageLabel: "Edad",
      agePlaceholder: "Ej: 34",
      genderLabel: "Género",
      memberHeading: "Integrante #{{number}}",
      errors: {
        zipCode: "Ingresá un código postal válido.",
        income: "Ingresá un ingreso familiar mensual mayor a cero.",
        memberAge: "Verificá las edades de cada integrante del hogar.",
      },
    },
    genders: {
      female: "Femenino",
      male: "Masculino",
    },
    planSelection: {
      helper:
        "Estos planes provienen del marketplace de seguros y se adaptan a los datos que cargaste. Seleccioná uno para revisar sus detalles.",
      loading: "Cargando planes...",
      error: "No pudimos recuperar los planes. Intentá nuevamente.",
      householdChip: "CP {{zipCode}} • {{count}} {{label}}",
      memberWordSingular: "miembro",
      memberWordPlural: "miembros",
      monthlyPremium: "Prima mensual",
      deductible: "Deducible",
      outOfPocketMax: "Tope de bolsillo",
    },
    planModal: {
      metaLabelPremium: "Prima mensual",
      metaLabelDeductible: "Deducible",
      metaLabelOutOfPocket: "Tope de bolsillo",
    },
    detailsPage: {
      selectedPlanTitle: "Plan seleccionado",
      householdSummaryTitle: "Resumen del hogar",
      applicantTitle: "Datos del responsable",
      incomeLabel: "Ingreso familiar",
      membersLabel: "Miembros",
      firstNameLabel: "Nombre",
      firstNamePlaceholder: "Ej: Ana",
      lastNameLabel: "Apellido",
      lastNamePlaceholder: "Ej: Martínez",
      dateOfBirthLabel: "Fecha de nacimiento",
      memberSummary: "Integrante #{{number}}: {{age}} años • {{gender}}",
      errors: {
        name: "Completá el nombre y apellido del responsable del hogar.",
        birthdate: "Ingresá la fecha de nacimiento.",
      },
    },
    confirmation: {
      thankYou: "¡Gracias, {{name}}!",
      genericName: "familia",
      message:
        "Recibimos los datos del hogar y el plan {{plan}}. Un asesor de TFI se comunicará a la brevedad para continuar con la gestión.",
      summaryTitle: "Resumen enviado",
      responsibleLabel: "Responsable",
      planLabel: "Plan",
      incomeLabel: "Ingreso familiar",
      membersLabel: "Miembros",
    },
  },
  en: {
    header: {
      title: "TFI Marketplace",
      subtitle: "We guide your household to find the best health coverage.",
      languageLabel: "Language",
      options: {
        es: "Spanish",
        en: "English",
      },
    },
    steps: {
      household: "Household information",
      plans: "Choose a plan for your family",
      details: "Complete the primary contact details",
      confirmation: "Confirmation",
    },
    footer: "Coverage offered together with the TFI insurance marketplace.",
    buttons: {
      back: "Back",
      continue: "Continue",
      viewDetails: "View details",
      close: "Close",
      selectPlan: "Choose plan",
      submitApplicant: "Submit information",
      startOver: "Start over",
    },
    householdForm: {
      basicInfoTitle: "Basic household information",
      zipCodeLabel: "Zip code",
      zipCodePlaceholder: "E.g. 12345",
      incomeLabel: "Monthly household income",
      incomePlaceholder: "E.g. 2500",
      memberQuantityLabel: "Number of members",
      membersTitleSingular: "Household member",
      membersTitlePlural: "Household members",
      membersHelper:
        "We use this information to recommend plans that match your household's ages and needs.",
      ageLabel: "Age",
      agePlaceholder: "E.g. 34",
      genderLabel: "Gender",
      memberHeading: "Member #{{number}}",
      errors: {
        zipCode: "Enter a valid zip code.",
        income: "Enter a monthly household income greater than zero.",
        memberAge: "Review each household member's age.",
      },
    },
    genders: {
      female: "Female",
      male: "Male",
    },
    planSelection: {
      helper:
        "These plans come from the insurance marketplace and adapt to the information you provided. Select one to review its details.",
      loading: "Loading plans...",
      error: "We couldn't retrieve the plans. Please try again.",
      householdChip: "ZIP {{zipCode}} • {{count}} {{label}}",
      memberWordSingular: "member",
      memberWordPlural: "members",
      monthlyPremium: "Monthly premium",
      deductible: "Deductible",
      outOfPocketMax: "Out-of-pocket max",
    },
    planModal: {
      metaLabelPremium: "Monthly premium",
      metaLabelDeductible: "Deductible",
      metaLabelOutOfPocket: "Out-of-pocket max",
    },
    detailsPage: {
      selectedPlanTitle: "Selected plan",
      householdSummaryTitle: "Household summary",
      applicantTitle: "Primary contact details",
      incomeLabel: "Household income",
      membersLabel: "Members",
      firstNameLabel: "First name",
      firstNamePlaceholder: "E.g. Ana",
      lastNameLabel: "Last name",
      lastNamePlaceholder: "E.g. Martínez",
      dateOfBirthLabel: "Date of birth",
      memberSummary: "Member #{{number}}: {{age}} years • {{gender}}",
      errors: {
        name: "Please fill in the household primary contact's first and last name.",
        birthdate: "Enter a date of birth.",
      },
    },
    confirmation: {
      thankYou: "Thank you, {{name}}!",
      genericName: "family",
      message:
        "We received the household details and the {{plan}} plan. A TFI advisor will contact you shortly to continue the process.",
      summaryTitle: "Summary sent",
      responsibleLabel: "Primary contact",
      planLabel: "Plan",
      incomeLabel: "Household income",
      membersLabel: "Members",
    },
  },
};
