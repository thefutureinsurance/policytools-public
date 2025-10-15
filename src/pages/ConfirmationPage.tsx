import React from "react";
import {
  HouseholdFormValues,
  Plan,
  PrimaryApplicantForm,
} from "../types";
import { useTranslation } from "../i18n/I18nProvider";

interface ConfirmationPageProps {
  applicant: PrimaryApplicantForm;
  plan: Plan;
  household: HouseholdFormValues;
  onStartOver: () => void;
}

export const ConfirmationPage: React.FC<ConfirmationPageProps> = ({
  applicant,
  plan,
  household,
  onStartOver,
}) => {
  const { t } = useTranslation();
  const firstName = applicant.firstName.trim();
  const displayName = firstName || t("confirmation.genericName");

  return (
    <div className="card confirmation-card">
      <h3>{t("confirmation.thankYou", { name: displayName })}</h3>
      <p>{t("confirmation.message", { plan: plan.name })}</p>

      <section className="form-section">
        <h4>{t("confirmation.summaryTitle")}</h4>
        <ul className="summary-list">
          <li>
            <span className="meta-label">
              {t("confirmation.responsibleLabel")}
            </span>
            <strong>
              {applicant.firstName} {applicant.lastName}
            </strong>
          </li>
          <li>
            <span className="meta-label">{t("confirmation.planLabel")}</span>
            <strong>{plan.name}</strong>
          </li>
          <li>
            <span className="meta-label">
              {t("confirmation.incomeLabel")}
            </span>
            <strong>${household.householdIncome.toLocaleString()}</strong>
          </li>
          <li>
            <span className="meta-label">
              {t("confirmation.membersLabel")}
            </span>
            <strong>{household.memberQuantity}</strong>
          </li>
        </ul>
      </section>

      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onStartOver}
        >
          {t("buttons.startOver")}
        </button>
      </div>
    </div>
  );
};
