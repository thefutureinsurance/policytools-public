import React, { useEffect, useState } from "react";
import { Plan, PrimaryApplicantForm } from "../types";
import { useTranslation } from "../i18n/I18nProvider";
import { PublicQuoteFormState } from "../gql/types/IPQuote";

interface HouseholdDetailsPageProps {
  household: PublicQuoteFormState;
  selectedPlan: Plan;
  initialApplicant: PrimaryApplicantForm;
  onSubmit: (values: PrimaryApplicantForm) => void | Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
  apiError?: string | null;
}

export const HouseholdDetailsPage: React.FC<HouseholdDetailsPageProps> = ({
  household,
  selectedPlan,
  initialApplicant,
  onSubmit,
  onBack,
  isSubmitting = false,
  apiError = null,
}) => {
  const { t } = useTranslation();
  const [formValues, setFormValues] =
    useState<PrimaryApplicantForm>(initialApplicant);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormValues(initialApplicant);
  }, [initialApplicant]);

  const handleChange = (field: keyof PrimaryApplicantForm, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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

    if (!formValues.phone.trim()) {
      setError(t("detailsPage.errors.phone"));
      return;
    }

    const emailValue = formValues.email.trim();
    if (!emailValue) {
      setError(t("detailsPage.errors.email"));
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailValue)) {
      setError(t("detailsPage.errors.email"));
      return;
    }

    await onSubmit({
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      dateOfBirth: formValues.dateOfBirth,
      phone: formValues.phone.trim(),
      email: emailValue,
      message: formValues.message.trim(),
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
        <h5>{t("detailsPage.selectedPlanTitle")}</h5>
        <div className="selected-plan">
          <div>
            <h5 className="title-plan">{selectedPlan.name}</h5>
            <p className="plan-carrier">{selectedPlan.carrier}</p>
          </div>
          <div className="plan-price-selected">
            <span className="meta-label">
              {t("planSelection.monthlyPremium")}
            </span>
            <strong>${selectedPlan.monthlyPremium.toFixed(2)}</strong>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h5>{t("detailsPage.householdSummaryTitle")}</h5>
        <div className="summary-grid">
          <div>
            <span className="meta-label">{t("detailsPage.incomeLabel")}</span>
            <strong>${household.householdIncomeTxt.toLocaleString()}</strong>
          </div>
          <div>
            <span className="meta-label">{t("detailsPage.membersLabel")}</span>
            <strong>{household.memberQuantity}</strong>
          </div>
        </div>

        <ul className="members-summary">
          {household.members.map(
            (member: { age: any; female: any }, index: number) => (
              <li key={`summary-member-${index}`}>
                {t("detailsPage.memberSummary", {
                  number: index + 1,
                  age: member.age,
                  gender: t(member.female ? "genders.female" : "genders.male"),
                })}
              </li>
            )
          )}
        </ul>
      </section>

      <section className="form-section  contact-details">
        <h5>{t("detailsPage.applicantTitle")}</h5>
        <div className="form-grid">
          <label className="form-field">
            <span>{t("detailsPage.firstNameLabel")}</span>
            <input
              type="text"
              value={formValues.firstName}
              onChange={(event) =>
                handleChange("firstName", event.target.value)
              }
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

          <label className="form-field">
            <span>{t("detailsPage.phoneLabel")}</span>
            <input
              type="tel"
              value={formValues.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
              placeholder={t("detailsPage.phonePlaceholder")}
            />
          </label>

          <label className="form-field">
            <span>{t("detailsPage.emailLabel")}</span>
            <input
              type="email"
              value={formValues.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder={t("detailsPage.emailPlaceholder")}
            />
          </label>
        </div>

        <label className="form-field">
          <span>{t("detailsPage.messageLabel")}</span>
          <textarea
            value={formValues.message}
            onChange={(event) => handleChange("message", event.target.value)}
            placeholder={t("detailsPage.messagePlaceholder")}
            rows={4}
          />
        </label>
      </section>

      {(error || apiError) && (
        <p className="form-error">{error || apiError}</p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="button button-primary"
          disabled={isSubmitting}
        >
          {t("buttons.submitApplicant")}
        </button>
      </div>
    </form>
  );
};
