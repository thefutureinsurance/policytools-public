import React, { useMemo, useState } from "react";
import "./App.css";
import { useMutation } from "@apollo/client/react";
import { HouseholdInfoPage } from "./pages/HouseholdInfoPage";
import { PlanSelectionPage } from "./pages/PlanSelectionPage";
import { HouseholdDetailsPage } from "./pages/HouseholdDetailsPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { Plan, PrimaryApplicantForm } from "./types";
import { useTranslation } from "./i18n/I18nProvider";
import { Language } from "./i18n/translations";
import { PublicQuoteFormState } from "./gql/types/IPQuote";
import { PUBLIC_CREATE_LEAD } from "./gql/publicLead";

type WizardStep = "household" | "plans" | "details" | "confirmation";

const initialHousehold: PublicQuoteFormState = {
  zipCode: null,
  zipcodeByZip: null,
  householdIncome: 0,
  householdIncomeTxt: "0",
  memberQuantity: 1,
  members: [{ age: 0, female: false, dateOfBirth: "" }],
};

const initialApplicant: PrimaryApplicantForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  message: "",
};

interface PublicCreateLeadError {
  field: string | null;
  message: string;
}

interface PublicCreateLeadResponse {
  publicCreateLead: {
    success: boolean;
    leadId: string | null;
    signingLink: string | null;
    errors?: PublicCreateLeadError[] | null;
  } | null;
}

interface PublicCreateLeadVariables {
  token: string;
  leadData: Record<string, unknown>;
  signatureFormId?: string | null;
  agentId?: string | null;
  sendEmail?: boolean;
  sendSms?: boolean;
  getSigningLink?: boolean;
}

const App: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();

  const [step, setStep] = useState<WizardStep>("household");
  const [household, setHousehold] =
    useState<PublicQuoteFormState>(initialHousehold);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [applicant, setApplicant] =
    useState<PrimaryApplicantForm>(initialApplicant);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [signingLink, setSigningLink] = useState<string | null>(null);

  const [publicCreateLead, { loading: isSubmittingLead }] = useMutation<
    PublicCreateLeadResponse,
    PublicCreateLeadVariables
  >(PUBLIC_CREATE_LEAD);

  const leadConfig = useMemo(() => {
    const stagePipelineId = process.env.REACT_APP_PUBLIC_STAGE_PIPELINE_ID
      ? Number(process.env.REACT_APP_PUBLIC_STAGE_PIPELINE_ID)
      : null;
    const leadSourceId = process.env.REACT_APP_PUBLIC_LEAD_SOURCE_ID
      ? Number(process.env.REACT_APP_PUBLIC_LEAD_SOURCE_ID)
      : null;
    const campusId = process.env.REACT_APP_PUBLIC_CAMPUS_ID
      ? Number(process.env.REACT_APP_PUBLIC_CAMPUS_ID)
      : null;
    const agentId = process.env.REACT_APP_PUBLIC_AGENT_ID ?? null;
    const signatureFormId =
      process.env.REACT_APP_PUBLIC_SIGNATURE_FORM_ID ?? null;
    const sendEmail =
      (process.env.REACT_APP_PUBLIC_SEND_EMAIL ?? "true").toLowerCase() ===
      "true";
    const sendSms =
      (process.env.REACT_APP_PUBLIC_SEND_SMS ?? "false").toLowerCase() ===
      "true";

    const config = {
      stagePipelineId,
      leadSourceId,
      campusId,
      agentId,
      signatureFormId,
      sendEmail,
      sendSms,
    };
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[public lead config]", config);
    }
    return config;
  }, []);

  const pageTitle = t(`steps.${step}`);

  const handleHouseholdSubmit = (values: PublicQuoteFormState) => {
    setHousehold(values);
    setSelectedPlan(null);
    setSubmissionError(null);
    setStep("plans");
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setSubmissionError(null);
    setStep("details");
  };

  const buildLeadPayload = (
    values: PrimaryApplicantForm,
    plan: Plan,
    quote: PublicQuoteFormState
  ): Record<string, unknown> => {
    if (
      !leadConfig.campusId ||
      !leadConfig.leadSourceId ||
      !leadConfig.stagePipelineId
    ) {
      throw new Error(
        "Missing lead configuration. Configure REACT_APP_PUBLIC_STAGE_PIPELINE_ID, REACT_APP_PUBLIC_LEAD_SOURCE_ID and REACT_APP_PUBLIC_CAMPUS_ID."
      );
    }

    const fullName =
      `${values.firstName.trim()} ${values.lastName.trim()}`.trim();
    const effectiveDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1
    )
      .toISOString()
      .split("T")[0];

    const metadata = {
      planId: plan.id,
      planName: plan.name,
      carrier: plan.carrier,
      premium: plan.monthlyPremium,
      deductible: plan.deductible,
      outOfPocketMax: plan.outOfPocketMax,
      effectiveDate,
      zipCode:
        quote.zipCode ??
        quote.zipcodeByZip?.zipCode ??
        quote.zipcodeByZip?.zipCode,
      countyFips:
        quote.zipcodeByZip?.countyFips ?? quote.zipcodeByZip?.countyFipsAll,
      state: quote.zipcodeByZip?.stateId,
      householdIncome: quote.householdIncome,
      householdIncomeTxt: quote.householdIncomeTxt,
      memberQuantity: quote.memberQuantity,
      members: quote.members,
    };

    const personalLead: Record<string, unknown> = {};
    if (values.dateOfBirth) {
      personalLead.birthDay = values.dateOfBirth;
    }
    if (quote.zipcodeByZip?.stateName) {
      personalLead.state = quote.zipcodeByZip.stateName;
    }
    if (quote.zipcodeByZip?.zipCode) {
      personalLead.postalCode = quote.zipcodeByZip.zipCode;
    }

    const agentIds: number[] = [];
    if (leadConfig.agentId) {
      const parsedAgent = Number(leadConfig.agentId);
      if (!Number.isNaN(parsedAgent)) {
        agentIds.push(parsedAgent);
      }
    }
    const payload: Record<string, unknown> = {
      name: fullName,
      email: values.email.trim(),
      phone: values.phone.trim(),
      observations: values.message.trim() || null,
      typeLead: "PERSONAL",
      leadSource: leadConfig.leadSourceId,
      stagePipeline: leadConfig.stagePipelineId,
      campus: leadConfig.campusId,
      tagInsurance: [],
      user: agentIds,
      marketplaceMetadata: JSON.stringify(metadata),
    };

    if (Object.keys(personalLead).length > 0) {
      payload.personalLead = personalLead;
    }

    return payload;
  };

  const handleApplicantSubmit = async (values: PrimaryApplicantForm) => {
    if (!selectedPlan) {
      return;
    }

    setSubmissionError(null);
    setSigningLink(null);
    try {
      const leadPayload = buildLeadPayload(
        values,
        selectedPlan,
        household
      ) as Record<string, unknown>;
      const { data } = await publicCreateLead({
        variables: {
          token: process.env.REACT_APP_PUBLIC_GRAPHQL_TOKEN ?? "",
          leadData: leadPayload,
          signatureFormId: leadConfig.signatureFormId,
          agentId: leadConfig.agentId,
          sendEmail: leadConfig.sendEmail,
          sendSms: leadConfig.sendSms,
          getSigningLink: true,
        },
      });

      const response = data?.publicCreateLead;
      if (!response?.success) {
        const message =
          response?.errors?.[0]?.message ??
          "No pudimos registrar la solicitud. Intentá nuevamente.";
        setSubmissionError(message);
        return;
      }

      setSigningLink(response.signingLink ?? null);
      setApplicant(values);
      setStep("confirmation");
    } catch (error: any) {
      setSubmissionError(
        error?.message ?? "Ocurrió un error al registrar la solicitud."
      );
    }
  };

  const handleRestart = () => {
    setHousehold(initialHousehold);
    setSelectedPlan(null);
    setApplicant(initialApplicant);
    setSigningLink(null);
    setSubmissionError(null);
    setStep("household");
  };

  const handleToggleLanguage = () => {
    setLanguage(language === "es" ? "en" : "es");
  };
  const nextLanguage: Language = language === "es" ? "en" : "es";
  const toggleLabel = t("header.languageToggleLabel", {
    language: t(`header.options.${nextLanguage}`),
  });

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-left">
            <img
              className="app-logo"
              src="/media/tfi-logo.svg"
              width={155}
              height={56}
              alt="TFI logo"
            />
            <div className="app-header-copy">
              <p className="app-subheadline">{t("header.subtitle")}</p>
            </div>
          </div>
          <div className="app-header-right">
            <div className="header-info-call">
              <span className="header-callus">{t("header.callus")}:</span>
              <span className="header-phone">
                <a href={`tel:${t("header.phone")}`}>{t("header.phone")}</a>
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleLanguage}
              className="language-toggle"
              aria-label={toggleLabel}
            >
              <img
                src={`/media/flags/${nextLanguage}.png`}
                alt={t(`header.options.${nextLanguage}`)}
                className="language-flag"
              />
            </button>
          </div>
        </div>
      </header>

      <main className="app-body">
        <section className="page-heading">
          <h2>{pageTitle}</h2>
        </section>
        <section className="page-content">
          {step === "household" && (
            <HouseholdInfoPage
              initialValues={household}
              onSubmit={handleHouseholdSubmit}
            />
          )}

          {step === "plans" && (
            <PlanSelectionPage
              household={household}
              onPlanSelect={handlePlanSelect}
              onBack={() => setStep("household")}
            />
          )}

          {step === "details" && selectedPlan && (
            <HouseholdDetailsPage
              household={household}
              selectedPlan={selectedPlan}
              initialApplicant={applicant}
              onSubmit={handleApplicantSubmit}
              onBack={() => setStep("plans")}
              isSubmitting={isSubmittingLead}
              apiError={submissionError}
            />
          )}

          {step === "confirmation" && selectedPlan && (
            <ConfirmationPage
              applicant={applicant}
              plan={selectedPlan}
              household={household}
              onStartOver={handleRestart}
              signingLink={signingLink ?? undefined}
            />
          )}
        </section>
      </main>

      <footer className="app-footer">
        <div className="footer-line">{t("footer.line1")}</div>
        <div className="footer-line">{t("footer.line2")}</div>
        <div className="footer-line">{t("footer.line3")}</div>
      </footer>
    </div>
  );
};

export default App;
