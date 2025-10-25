import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "../i18n/I18nProvider";
import { Plan } from "../types";
import {
  ConsentStatus,
  LeadWizardMetadata,
  WizardPrimaryApplicant,
} from "../types/leadWizard";

interface PlanSummaryPageProps {
  metadata: LeadWizardMetadata;
  plan: Plan;
  primary: WizardPrimaryApplicant;
  consentStatus: ConsentStatus;
  signingLink?: string | null;
  onBack: () => void;
  onConfirm: () => void;
  onCheckConsent?: () => void;
  isSubmitting?: boolean;
  isCheckingConsent?: boolean;
}

const formatCurrency = (value: number | null | undefined) => {
  if (!value && value !== 0) {
    return "—";
  }
  return `$${Number(value).toLocaleString()}`;
};

export const PlanSummaryPage: React.FC<PlanSummaryPageProps> = ({
  metadata,
  plan,
  primary,
  consentStatus,
  signingLink,
  onBack,
  onConfirm,
  onCheckConsent,
  isSubmitting = false,
  isCheckingConsent = false,
}) => {
  const { t } = useTranslation();

  const householdMembers = metadata.members || [];
  const householdIncome = metadata.household.income;

  return (
    <div className="card summary confirmation-card">
      <div className="card-header">
        <button
          type="button"
          className="button button-secondary"
          onClick={onBack}
        >
          {t("buttons.back")}
        </button>
        <p className="section-helper">{t("wizard.summary.helper")}</p>
      </div>
      <div className="card-body ">
        <section className="form-section">
          <h5>{t("detailsPage.selectedPlanTitle")}</h5>
          <div className="selected-plan">
            <div>
              <h5 className="title-plan">{plan.name}</h5>
              <p className="plan-carrier">{plan.carrier}</p>
            </div>
            <div className="plan-price-selected">
              <span className="meta-label">
                {t("planSelection.monthlyPremium")}
              </span>
              <strong>${plan.monthlyPremium.toFixed(2)}</strong>
            </div>
          </div>
        </section>

        <section className="summary-section">
          <h5>{t("wizard.summary.householdTitle")}</h5>
          <ul className="summary-list">
            <li>
              <strong>{t("wizard.summary.zipCode")}</strong>
              <span>{metadata.household.zipCode ?? "—"}</span>
            </li>
            <li>
              <strong>{t("wizard.summary.county")}</strong>
              <span>
                {metadata.household.countyName ??
                  metadata.household.countyFips ??
                  "—"}
              </span>
            </li>
            <li>
              <strong>{t("wizard.summary.income")}</strong>
              <span>{formatCurrency(householdIncome)}</span>
            </li>
          </ul>

          <div className="members-list">
            {householdMembers.map((member, index) => (
              <div key={`${member.role}-${index}`} className="member-row">
                <strong>
                  {`${member.firstName} ${member.lastName}`.trim()}
                </strong>
                <span>
                  {t(`wizard.members.roles.${member.role.toLowerCase()}`)} ·{" "}
                  {member.birthDate}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="summary-section">
          <h4>{t("wizard.summary.primaryTitle")}</h4>
          <ul className="summary-list">
            <li>
              <strong>{t("wizard.primary.firstNameLabel")}</strong>
              <span>{primary.firstName}</span>
            </li>
            <li>
              <strong>{t("wizard.primary.lastNameLabel")}</strong>
              <span>{primary.lastName}</span>
            </li>
            <li>
              <strong>{t("wizard.primary.phoneLabel")}</strong>
              <span>{primary.phone}</span>
            </li>
            <li>
              <strong>{t("wizard.primary.emailLabel")}</strong>
              <span>{primary.email}</span>
            </li>
          </ul>
        </section>

        {signingLink && (
          <>
            <section className="summary-section">
              <div className="consent-summary-header">
                <h4>{t("wizard.summary.consentTitle")}</h4>
                <div
                  className={`consent-status consent-${consentStatus.toLowerCase()}`}
                >
                  {signingLink && (
                    <a
                      className="signing-link"
                      href={signingLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("wizard.summary.openSignature")}
                      <FontAwesomeIcon
                        icon={faUpRightFromSquare}
                        className="signing-link-icon"
                      />
                    </a>
                  )}
                </div>
              </div>
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
          </>
        )}

        <div className="form-actions">
          {consentStatus === "NOT_REQUESTED" && (
            <button
              type="button"
              className="button button-primary"
              onClick={onConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("wizard.summary.sending")
                : t("wizard.summary.confirmButton")}
            </button>
          )}
          {consentStatus === "PENDING" && (
            <button
              type="button"
              className="button button-primary"
              onClick={onCheckConsent}
              disabled={consentStatus === "PENDING" || isCheckingConsent}
            >
              {isCheckingConsent
                ? t("wizard.summary.checkingConsent")
                : t("wizard.summary.confirmButton")}
            </button>
          )}
        </div>

        <section className="summary-section">
          {consentStatus !== "SIGNED" && signingLink && onCheckConsent && (
            <button
              type="button"
              className="button button-secondary"
              onClick={onCheckConsent}
              disabled={isCheckingConsent}
            >
              {isCheckingConsent
                ? t("wizard.summary.checkingConsent")
                : t("wizard.summary.checkConsent")}
            </button>
          )}
        </section>
      </div>
    </div>
  );
};
