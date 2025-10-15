import React, { useEffect, useState } from "react";
import {
  HouseholdFormValues,
  Plan,
  PrimaryApplicantForm,
} from "../types";
import { useTranslation } from "../i18n/I18nProvider";

interface HouseholdDetailsPageProps {
  household: HouseholdFormValues;
  selectedPlan: Plan;
  initialApplicant: PrimaryApplicantForm;
  onSubmit: (values: PrimaryApplicantForm) => void;
  onBack: () => void;
}

export const HouseholdDetailsPage: React.FC<HouseholdDetailsPageProps> = ({
  household,
  selectedPlan,
  initialApplicant,
  onSubmit,
  onBack,
}) => {
  const { t } = useTranslation();
  const [formValues, setFormValues] =
    useState<PrimaryApplicantForm>(initialApplicant);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormValues(initialApplicant);
  }, [initialApplicant]);

  const handleChange = (
    field: keyof PrimaryApplicantForm,
    value: string
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!formValues.firstName.trim() || !formValues.lastName.trim()) {
      setError(t("detailsPage.errors.name"));
      return;
    }

    if (!formValues.dateOfBirth) {
      setError(t("detailsPage.errors.birthdate"));
      return;
    }

    onSubmit({
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      dateOfBirth: formValues.dateOfBirth,
    });
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="card-header">
        <button
          type="button"
          className="button button-secondary"
          onClick={onBack}
        >
          {t("buttons.back")}
        </button>
      </div>

      <section className="form-section">
        <h3>{t("detailsPage.selectedPlanTitle")}</h3>
        <div className="selected-plan">
          <div>
            <h4>{selectedPlan.name}</h4>
            <p className="plan-carrier">{selectedPlan.carrier}</p>
          </div>
          <div>
            <span className="meta-label">
              {t("planSelection.monthlyPremium")}
            </span>
            <strong>${selectedPlan.monthlyPremium.toFixed(2)}</strong>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3>{t("detailsPage.householdSummaryTitle")}</h3>
        <div className="summary-grid">
          <div>
            <span className="meta-label">{t("detailsPage.incomeLabel")}</span>
            <strong>${household.householdIncome.toLocaleString()}</strong>
          </div>
          <div>
            <span className="meta-label">{t("detailsPage.membersLabel")}</span>
            <strong>{household.memberQuantity}</strong>
          </div>
        </div>

        <ul className="members-summary">
          {household.members.map((member, index) => (
            <li key={`summary-member-${index}`}>
              {t("detailsPage.memberSummary", {
                number: index + 1,
                age: member.age,
                gender: t(member.female ? "genders.female" : "genders.male"),
              })}
            </li>
          ))}
        </ul>
      </section>

      <section className="form-section">
        <h3>{t("detailsPage.applicantTitle")}</h3>
        <div className="form-grid">
          <label className="form-field">
            <span>{t("detailsPage.firstNameLabel")}</span>
            <input
              type="text"
              value={formValues.firstName}
              onChange={(event) => handleChange("firstName", event.target.value)}
              placeholder={t("detailsPage.firstNamePlaceholder")}
            />
          </label>

          <label className="form-field">
            <span>{t("detailsPage.lastNameLabel")}</span>
            <input
              type="text"
              value={formValues.lastName}
              onChange={(event) => handleChange("lastName", event.target.value)}
              placeholder={t("detailsPage.lastNamePlaceholder")}
            />
          </label>

          <label className="form-field">
            <span>{t("detailsPage.dateOfBirthLabel")}</span>
            <input
              type="date"
              value={formValues.dateOfBirth}
              onChange={(event) =>
                handleChange("dateOfBirth", event.target.value)
              }
            />
          </label>
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="button button-primary">
          {t("buttons.submitApplicant")}
        </button>
      </div>
    </form>
  );
};
