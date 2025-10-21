import React from "react";
import { Plan, PrimaryApplicantForm } from "../types";
import { useTranslation } from "../i18n/I18nProvider";
import { PublicQuoteFormState } from "../gql/types/IPQuote";

interface ConfirmationPageProps {
  applicant: PrimaryApplicantForm;
  plan: Plan;
  household: PublicQuoteFormState;
  onStartOver: () => void;
  signingLink?: string;
}

export const ConfirmationPage: React.FC<ConfirmationPageProps> = ({
  applicant,
  plan,
  household,
  onStartOver,
  signingLink,
}) => {
  const { t } = useTranslation();
  const firstName = applicant.firstName.trim();
  const displayName = firstName || t("confirmation.genericName");

  return (
    <div className="card confirmation-card">
      <h3>{t("confirmation.thankYou", { name: displayName })}</h3>
      <p>{t("confirmation.message", { plan: plan.name })}</p>
      <div className="confirmation-form-sections">
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
              <strong>${household.householdIncomeTxt.toLocaleString()}</strong>
            </li>
            <li>
              <span className="meta-label">
                {t("confirmation.membersLabel")}
              </span>
              <strong>{household.memberQuantity}</strong>
            </li>
          </ul>
        </section>

        <section className="form-section">
          <h4>{t("confirmation.contactTitle")}</h4>
          <ul className="summary-list">
            <li>
              <span className="meta-label">{t("confirmation.phoneLabel")}</span>
              <strong>{applicant.phone || "—"}</strong>
            </li>
            <li>
              <span className="meta-label">{t("confirmation.emailLabel")}</span>
              <strong>{applicant.email || "—"}</strong>
            </li>
            {applicant.message && (
              <li>
                <span className="meta-label">
                  {t("confirmation.messageLabel")}
                </span>
                <p>{applicant.message}</p>
              </li>
            )}
          </ul>
        </section>
      </div>
      {signingLink && (
        <section className="form-section">
          <h4>{t("confirmation.linkTitle")}</h4>
          <div className="signing-frame">
            <iframe
              src={signingLink.replace(
                "http://app-backend.policytools.com",
                "http://localhost:8000"
              )}
              title="Consent"
              width="100%"
              height="600"
              style={{ border: "1px solid #d0d7de" }}
            />
          </div>
        </section>
      )}

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
