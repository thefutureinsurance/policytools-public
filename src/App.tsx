import React, { useState } from "react";
import "./App.css";
import { HouseholdInfoPage } from "./pages/HouseholdInfoPage";
import { PlanSelectionPage } from "./pages/PlanSelectionPage";
import { HouseholdDetailsPage } from "./pages/HouseholdDetailsPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { HouseholdFormValues, Plan, PrimaryApplicantForm } from "./types";
import { useTranslation } from "./i18n/I18nProvider";
import { Language } from "./i18n/translations";

type WizardStep = "household" | "plans" | "details" | "confirmation";

const initialHousehold: HouseholdFormValues = {
  zipCode: "",
  householdIncome: 0,
  memberQuantity: 1,
  members: [{ age: 0, female: false }],
};

const initialApplicant: PrimaryApplicantForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
};

const App: React.FC = () => {
  const { t, language, setLanguage, languages } = useTranslation();

  const [step, setStep] = useState<WizardStep>("household");
  const [household, setHousehold] =
    useState<HouseholdFormValues>(initialHousehold);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [applicant, setApplicant] =
    useState<PrimaryApplicantForm>(initialApplicant);

  const pageTitle = t(`steps.${step}`);

  const handleHouseholdSubmit = (values: HouseholdFormValues) => {
    setHousehold(values);
    setSelectedPlan(null);
    setStep("plans");
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep("details");
  };

  const handleApplicantSubmit = (values: PrimaryApplicantForm) => {
    setApplicant(values);
    setStep("confirmation");
  };

  const handleRestart = () => {
    setHousehold(initialHousehold);
    setSelectedPlan(null);
    setApplicant(initialApplicant);
    setStep("household");
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setLanguage(event.target.value as Language);
  };
  const handleLanguageChange2 = (lang: string) => {
    setLanguage(lang as Language);
  };

  const handleToggleLanguage = () => {
    // alterna entre inglés y español
    setLanguage(language === "es" ? "en" : "es");
  };
  const nextLanguage: Language = language === "es" ? "en" : "es";

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
            <label className="language-selector">
              {/* <span>{t("header.languageLabel")}</span> */}
              <button
                onClick={handleToggleLanguage}
                className="rounded-full border-2 border-transparent hover:border-blue-400 hover:scale-105 transition"
              >
                <img
                  src={`/media/flags/${nextLanguage}.png`}
                  alt={nextLanguage}
                  className="w-6 h-6 rounded-full"
                />
              </button>
            </label>
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
            />
          )}

          {step === "confirmation" && selectedPlan && (
            <ConfirmationPage
              applicant={applicant}
              plan={selectedPlan}
              household={household}
              onStartOver={handleRestart}
            />
          )}
        </section>
      </main>

      <footer className="app-footer">
        <div className="line1">{t("footer.line1")}</div>
        <div className="line2">{t("footer.line2")}</div>
        <div className="line3">{t("footer.line3")}</div>
      </footer>
    </div>
  );
};

export default App;
