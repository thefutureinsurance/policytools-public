import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { useMutation } from "@apollo/client/react";
import { Spinner } from "react-bootstrap";
import { useTranslation } from "./i18n/I18nProvider";
import { Language } from "./i18n/translations";
import { Plan } from "./types";
import {
  HouseholdType,
  LeadHouseholdMember,
  LeadWizardMetadata,
  WizardPrimaryApplicant,
  WizardStep,
  ConsentStatus,
} from "./types/leadWizard";
import {
  parseMetadata,
  emptyMetadata,
  householdNeedsAdditionalMembers,
  primaryFromMetadata,
} from "./utils/leadMetadata";
import {
  PUBLIC_START_LEAD,
  PUBLIC_UPDATE_HOUSEHOLD,
  PUBLIC_CONFIRM_PLAN,
  PUBLIC_CHECK_CONSENT,
} from "./gql/publicLead";
import {
  PublicCheckConsentResponse,
  PublicConfirmPlanResponse,
  PublicStartLeadResponse,
  PublicUpdateHouseholdResponse,
} from "./gql/types/PublicLead";
import { HouseholdTypeStep } from "./components/HouseholdTypeStep";
import { HouseholdBasicsStep } from "./components/HouseholdBasicsStep";
import { PrimaryApplicantStep } from "./components/PrimaryApplicantStep";
import { AdditionalMembersStep } from "./components/AdditionalMembersStep";
import { PlanSelectionPage } from "./pages/PlanSelectionPage";
import { PlanSummaryPage } from "./components/PlanSummaryPage";

const STEP_TITLE_KEYS: Record<WizardStep, string> = {
  householdType: "wizard.titles.householdType",
  householdBasics: "wizard.titles.householdBasics",
  primary: "wizard.titles.primary",
  members: "wizard.titles.members",
  plans: "wizard.titles.plans",
  summary: "wizard.titles.summary",
  consent: "wizard.titles.consent",
  extra: "wizard.titles.extra",
};

interface PlanSelectionContext {
  fetchedAt: string;
  count: number;
}

const buildPlanSelectionInput = (plan: Plan) => ({
  planId: plan.id,
  issuer: plan.carrier,
  premium: plan.monthlyPremium,
  deductible: plan.deductible,
  metalLevel: plan.summary,
  productType: plan.summary,
  name: plan.name,
});

const consentFromMetadata = (metadata: LeadWizardMetadata): ConsentStatus => {
  const status = metadata.consent?.status;
  if (!status) {
    return "NOT_REQUESTED";
  }
  return status as ConsentStatus;
};

const App: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();

  const [wizardStep, setWizardStep] = useState<WizardStep>("householdType");
  const [metadata, setMetadata] = useState<LeadWizardMetadata>(emptyMetadata());
  const [householdType, setHouseholdType] = useState<HouseholdType | null>(
    null
  );
  const [leadId, setLeadId] = useState<string | null>(null);
  const [primaryApplicant, setPrimaryApplicant] =
    useState<WizardPrimaryApplicant | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planContext, setPlanContext] = useState<PlanSelectionContext | null>(
    null
  );
  const [signingLink, setSigningLink] = useState<string | null>(null);
  const [consentStatus, setConsentStatus] =
    useState<ConsentStatus>("NOT_REQUESTED");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingConsent, setIsCheckingConsent] = useState(false);

  const publicToken = process.env.REACT_APP_PUBLIC_GRAPHQL_TOKEN ?? "";

  const resolvedHouseholdType = (householdType ||
    (metadata.household.type as HouseholdType | null)) as HouseholdType | null;

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

    return {
      stagePipelineId,
      leadSourceId,
      campusId,
      agentId,
      signatureFormId,
      sendEmail,
      sendSms,
    };
  }, []);

  const [startLeadMutation] =
    useMutation<PublicStartLeadResponse>(PUBLIC_START_LEAD);
  const [updateHouseholdMutation] = useMutation<PublicUpdateHouseholdResponse>(
    PUBLIC_UPDATE_HOUSEHOLD
  );
  const [confirmPlanMutation] =
    useMutation<PublicConfirmPlanResponse>(PUBLIC_CONFIRM_PLAN);
  const [checkConsentMutation] =
    useMutation<PublicCheckConsentResponse>(PUBLIC_CHECK_CONSENT);

  const pageTitle = t(STEP_TITLE_KEYS[wizardStep]);

  const handleToggleLanguage = () => {
    const nextLanguage: Language = language === "es" ? "en" : "es";
    setLanguage(nextLanguage);
  };

  const handleSelectHouseholdType = (type: HouseholdType) => {
    setHouseholdType(type);
    setMetadata((prev) => ({
      ...prev,
      household: { ...prev.household, type },
    }));
    if (type !== undefined) {
      setWizardStep("householdBasics");
    }
  };

  const handleHouseholdBasicsSubmit = ({
    zipCode,
    income,
    countyFips,
    countyName,
    stateId,
    stateName,
  }: {
    zipCode: string;
    income: number;
    countyFips: string;
    countyName?: string | null;
    stateId?: string | null;
    stateName?: string | null;
  }) => {
    setMetadata((prev) => ({
      ...prev,
      household: {
        ...prev.household,
        type: resolvedHouseholdType ?? householdType,
        zipCode,
        income,
        countyFips,
        countyName: countyName ?? prev.household.countyName,
        stateId: stateId ?? prev.household.stateId,
        stateName: stateName ?? prev.household.stateName,
      },
    }));
    setWizardStep("primary");
    setApiError(null);
  };

  const handlePrimarySubmit = async (applicant: WizardPrimaryApplicant) => {
    if (!resolvedHouseholdType) {
      return;
    }

    if (
      !leadConfig.campusId ||
      !leadConfig.leadSourceId ||
      !leadConfig.stagePipelineId
    ) {
      setApiError(
        "Missing lead configuration. Configure environment variables for stage pipeline, lead source and campus."
      );
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const { data } = await startLeadMutation({
        variables: {
          token: publicToken,
          household: {
            type: resolvedHouseholdType,
            zipCode: metadata.household.zipCode,
            income: metadata.household.income,
            countyFips: metadata.household.countyFips,
            effectiveDate: metadata.household.effectiveDate,
            stateId: metadata.household.stateId,
            stateName: metadata.household.stateName,
            countyName: metadata.household.countyName,
          },
          primary: {
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            gender: applicant.gender,
            birthDate: applicant.birthDate,
            phone: applicant.phone,
            email: applicant.email,
            acceptsTerms: applicant.acceptsTerms,
          },
          context: {
            leadSourceId: leadConfig.leadSourceId,
            stagePipelineId: leadConfig.stagePipelineId,
            campusId: leadConfig.campusId,
          },
        },
      });

      const response = data?.publicStartLead;
      if (!response?.success || !response.leadId) {
        const message =
          response?.errors?.[0]?.message || t("wizard.errors.generic");
        setApiError(message);
        return;
      }

      const nextMetadata = parseMetadata(response.metadata);
      setMetadata(nextMetadata);
      setLeadId(response.leadId);
      setPrimaryApplicant(applicant);
      setConsentStatus(consentFromMetadata(nextMetadata));
      setHouseholdType(
        (nextMetadata.household.type as HouseholdType | null) ?? householdType
      );

      const nextHouseholdType =
        (nextMetadata.household.type as HouseholdType | null) ??
        resolvedHouseholdType;

      setHouseholdType(nextHouseholdType);

      const needsMoreMembers =
        householdNeedsAdditionalMembers(nextHouseholdType);
      setWizardStep(needsMoreMembers ? "members" : "plans");
    } catch (error: any) {
      setApiError(error?.message ?? t("wizard.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMembersSubmit = async (members: LeadHouseholdMember[]) => {
    if (!leadId) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const { data } = await updateHouseholdMutation({
        variables: {
          token: publicToken,
          leadId,
          members: members.map((member) => ({
            role: member.role,
            firstName: member.firstName,
            lastName: member.lastName,
            gender: member.gender,
            birthDate: member.birthDate,
          })),
          wizardStep: "PLANS",
        },
      });

      const response = data?.publicUpdateHousehold;
      if (!response?.success) {
        const message =
          response?.errors?.[0]?.message || t("wizard.errors.generic");
        setApiError(message);
        return;
      }

      const nextMetadata = parseMetadata(response.metadata);
      setMetadata(nextMetadata);
      setConsentStatus(consentFromMetadata(nextMetadata));
      setWizardStep("plans");
    } catch (error: any) {
      setApiError(error?.message ?? t("wizard.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlanSelect = (plan: Plan, context: PlanSelectionContext) => {
    setSelectedPlan(plan);
    setPlanContext(context);
    setWizardStep("summary");
  };

  const handleConfirmPlan = async () => {
    if (!leadId || !selectedPlan) {
      return;
    }

    if (consentStatus !== "NOT_REQUESTED" && signingLink) {
      setWizardStep("summary");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const { data } = await confirmPlanMutation({
        variables: {
          token: publicToken,
          leadId,
          planSelection: buildPlanSelectionInput(selectedPlan),
          planResults: {
            count: planContext?.count ?? 0,
            fetchedAt: planContext?.fetchedAt,
            filters: JSON.stringify({ language }),
          },
          signatureFormId: leadConfig.signatureFormId,
          agentId: leadConfig.agentId,
          sendEmail: leadConfig.sendEmail,
          sendSms: leadConfig.sendSms,
          getSigningLink: true,
        },
      });

      const response = data?.publicConfirmPlan;
      if (!response?.success) {
        const message =
          response?.errors?.[0]?.message || t("wizard.errors.generic");
        setApiError(message);
        return;
      }

      const nextMetadata = parseMetadata(response.metadata);
      setMetadata(nextMetadata);
      setConsentStatus(consentFromMetadata(nextMetadata));
      setSigningLink(response.signingLink ?? null);
      setWizardStep(
        consentFromMetadata(nextMetadata) === "SIGNED" ? "consent" : "summary"
      );
    } catch (error: any) {
      setApiError(error?.message ?? t("wizard.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckConsent = useCallback(
    async (silent = false) => {
      if (!leadId) {
        return;
      }
      if (!silent) {
        setIsCheckingConsent(true);
        setApiError(null);
      }

      try {
        const { data } = await checkConsentMutation({
          variables: {
            token: publicToken,
            leadId,
          },
        });

        const response = data?.publicCheckConsent;
        if (!response?.success) {
          if (!silent) {
            const message =
              response?.errors?.[0]?.message || t("wizard.errors.generic");
            setApiError(message);
          }
          return;
        }

        const nextMetadata = parseMetadata(response.metadata);
        setMetadata(nextMetadata);
        const nextStatus = consentFromMetadata(nextMetadata);
        setConsentStatus(nextStatus);

        if (nextStatus === "SIGNED") {
          setWizardStep("consent");
        }
      } catch (error: any) {
        if (!silent) {
          setApiError(error?.message ?? t("wizard.errors.generic"));
        }
      } finally {
        if (!silent) {
          setIsCheckingConsent(false);
        }
      }
    },
    [checkConsentMutation, leadId, publicToken, t]
  );

  useEffect(() => {
    if (consentStatus !== "PENDING" || !signingLink || !leadId) {
      return;
    }

    void handleCheckConsent(true);
    const interval = setInterval(() => {
      void handleCheckConsent(true);
    }, 7000);

    return () => clearInterval(interval);
  }, [consentStatus, signingLink, leadId, handleCheckConsent]);

  const currentPrimary = primaryApplicant || primaryFromMetadata(metadata);
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
          {apiError && <div className="form-error major-error">{apiError}</div>}

          {wizardStep === "householdType" && (
            <HouseholdTypeStep
              value={householdType}
              onSelect={handleSelectHouseholdType}
            />
          )}

          {wizardStep === "householdBasics" && householdType && (
            <HouseholdBasicsStep
              householdType={householdType}
              initialZip={metadata.household.zipCode}
              initialIncome={metadata.household.income}
              initialCountyFips={metadata.household.countyFips}
              onBack={() => setWizardStep("householdType")}
              onSubmit={handleHouseholdBasicsSubmit}
            />
          )}

          {wizardStep === "primary" && householdType && (
            <PrimaryApplicantStep
              householdType={householdType}
              initialValues={currentPrimary}
              onBack={() => setWizardStep("householdBasics")}
              onSubmit={handlePrimarySubmit}
            />
          )}

          {wizardStep === "members" && householdType && (
            <AdditionalMembersStep
              householdType={householdType}
              members={metadata.members}
              onBack={() => setWizardStep("primary")}
              onSubmit={handleMembersSubmit}
            />
          )}

          {wizardStep === "plans" && currentPrimary && (
            <PlanSelectionPage
              metadata={metadata}
              onBack={() =>
                householdNeedsAdditionalMembers(householdType)
                  ? setWizardStep("members")
                  : setWizardStep("primary")
              }
              onPlanSelect={handlePlanSelect}
            />
          )}

          {wizardStep === "summary" && selectedPlan && currentPrimary && (
            <PlanSummaryPage
              metadata={metadata}
              plan={selectedPlan}
              primary={currentPrimary}
              consentStatus={consentStatus}
              signingLink={signingLink}
              onBack={() => setWizardStep("plans")}
              onConfirm={handleConfirmPlan}
              onCheckConsent={
                consentStatus === "SIGNED"
                  ? undefined
                  : () => handleCheckConsent(false)
              }
              isSubmitting={isSubmitting}
              isCheckingConsent={isCheckingConsent}
            />
          )}

          {wizardStep === "consent" && selectedPlan && currentPrimary && (
            <PlanSummaryPage
              metadata={metadata}
              plan={selectedPlan}
              primary={currentPrimary}
              consentStatus={consentStatus}
              signingLink={signingLink}
              onBack={() => setWizardStep("summary")}
              onConfirm={() => {}}
              onCheckConsent={() => handleCheckConsent(false)}
              isSubmitting={false}
              isCheckingConsent={isCheckingConsent}
            />
          )}

          {isSubmitting && !["summary", "consent"].includes(wizardStep) && (
            <div className="loading-overlay">
              <Spinner animation="border" role="status" />
              <span>{t("wizard.loading")}</span>
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <div className="footer-line">{t("footer.line1")}</div>
        <div className="footer-line">{t("footer.line2")}</div>
        <div className="footer-line">{t("footer.line3")}</div>
        <div className="footer-line">{t("footer.line4")}</div>
      </footer>
    </div>
  );
};

export default App;
