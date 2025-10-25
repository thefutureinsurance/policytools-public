import React, { useState } from "react";
import { useTranslation } from "../i18n/I18nProvider";
import {
  HouseholdType,
  WizardPrimaryApplicant,
} from "../types/leadWizard";

interface PrimaryApplicantStepProps {
  householdType: HouseholdType;
  initialValues?: WizardPrimaryApplicant | null;
  onBack: () => void;
  onSubmit: (applicant: WizardPrimaryApplicant) => void;
}

type FieldError = Partial<Record<keyof WizardPrimaryApplicant, string>> & {
  acceptsTerms?: string;
};

const GENDER_CHOICES: { value: WizardPrimaryApplicant["gender"]; labelKey: string }[] = [
  { value: "F", labelKey: "wizard.primary.gender.options.f" },
  { value: "M", labelKey: "wizard.primary.gender.options.m" },
  { value: "X", labelKey: "wizard.primary.gender.options.x" },
];

const normalizeApplicant = (
  applicant: WizardPrimaryApplicant | null | undefined
): WizardPrimaryApplicant => ({
  firstName: applicant?.firstName ?? "",
  lastName: applicant?.lastName ?? "",
  gender: applicant?.gender ?? "F",
  birthDate: applicant?.birthDate ?? "",
  phone: applicant?.phone ?? "",
  email: applicant?.email ?? "",
  acceptsTerms: Boolean(applicant?.acceptsTerms),
});

export const PrimaryApplicantStep: React.FC<PrimaryApplicantStepProps> = ({
  householdType,
  initialValues,
  onBack,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [applicant, setApplicant] = useState<WizardPrimaryApplicant>(
    normalizeApplicant(initialValues)
  );
  const [errors, setErrors] = useState<FieldError>({});

  const handleChange = <K extends keyof WizardPrimaryApplicant>(
    field: K,
    value: WizardPrimaryApplicant[K]
  ) => {
    setApplicant((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: FieldError = {};

    if (!applicant.firstName.trim()) {
      nextErrors.firstName = t("wizard.primary.errors.firstName");
    }
    if (!applicant.lastName.trim()) {
      nextErrors.lastName = t("wizard.primary.errors.lastName");
    }
    if (!applicant.birthDate) {
      nextErrors.birthDate = t("wizard.primary.errors.birthDate");
    }
    if (!applicant.phone.trim()) {
      nextErrors.phone = t("wizard.primary.errors.phone");
    }
    if (!applicant.email.trim()) {
      nextErrors.email = t("wizard.primary.errors.email");
    }
    if (!applicant.acceptsTerms) {
      nextErrors.acceptsTerms = t("wizard.primary.errors.terms");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }
    onSubmit({ ...applicant, acceptsTerms: true });
  };

  return (
    <div className="card">
      <div className="card-header">
        <button type="button" className="button button-secondary" onClick={onBack}>
          {t("buttons.back")}
        </button>
      </div>
      <div className="card-body">
        <h3 className="card-title">{t("wizard.primary.title")}</h3>
        <p className="section-helper">
          {t("wizard.primary.helper", {
            household: t(
              `wizard.householdType.options.${householdType.toLowerCase()}`
            ),
          })}
        </p>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="primaryFirstName">
              {t("wizard.primary.firstNameLabel")}
            </label>
            <input
              id="primaryFirstName"
              name="primaryFirstName"
              value={applicant.firstName}
              onChange={(event) => handleChange("firstName", event.target.value)}
              placeholder={t("wizard.primary.firstNamePlaceholder")}
            />
            {errors.firstName && <span className="form-error">{errors.firstName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="primaryLastName">
              {t("wizard.primary.lastNameLabel")}
            </label>
            <input
              id="primaryLastName"
              name="primaryLastName"
              value={applicant.lastName}
              onChange={(event) => handleChange("lastName", event.target.value)}
              placeholder={t("wizard.primary.lastNamePlaceholder")}
            />
            {errors.lastName && <span className="form-error">{errors.lastName}</span>}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="primaryGender">
              {t("wizard.primary.gender.label")}
            </label>
            <select
              id="primaryGender"
              value={applicant.gender}
              onChange={(event) =>
                handleChange("gender", event.target.value as WizardPrimaryApplicant["gender"])
              }
            >
              {GENDER_CHOICES.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {t(choice.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="primaryBirthDate">
              {t("wizard.primary.birthDateLabel")}
            </label>
            <input
              id="primaryBirthDate"
              type="date"
              value={applicant.birthDate}
              onChange={(event) => handleChange("birthDate", event.target.value)}
            />
            {errors.birthDate && <span className="form-error">{errors.birthDate}</span>}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="primaryPhone">
              {t("wizard.primary.phoneLabel")}
            </label>
            <input
              id="primaryPhone"
              name="primaryPhone"
              type="tel"
              value={applicant.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
              placeholder={t("wizard.primary.phonePlaceholder")}
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="primaryEmail">
              {t("wizard.primary.emailLabel")}
            </label>
            <input
              id="primaryEmail"
              name="primaryEmail"
              type="email"
              value={applicant.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder={t("wizard.primary.emailPlaceholder")}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={applicant.acceptsTerms}
              onChange={(event) => handleChange("acceptsTerms", event.target.checked)}
            />
            <span>{t("wizard.primary.termsLabel")}</span>
          </label>
          {errors.acceptsTerms && (
            <span className="form-error">{errors.acceptsTerms}</span>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="button button-primary" onClick={handleSubmit}>
            {t("buttons.continue")}
          </button>
        </div>
      </div>
    </div>
  );
};
