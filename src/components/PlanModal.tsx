import React from "react";
import { Plan } from "../types";
import { useTranslation } from "../i18n/I18nProvider";

interface PlanModalProps {
  plan: Plan;
  onClose: () => void;
  onSelect: (plan: Plan) => void;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  plan,
  onClose,
  onSelect,
}) => {
  const { t } = useTranslation();

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label={t("buttons.close")}
        >
          ×
        </button>
        <header className="modal-header">
          <h3>{plan.name}</h3>
          <p className="plan-carrier">{plan.carrier}</p>
        </header>
        <section className="modal-body">
          <p className="plan-summary">{plan.summary}</p>
          <ul className="plan-highlight-list">
            {plan.coverageHighlights.map((highlight) => (
              <li key={`${plan.id}-${highlight}`}>{highlight}</li>
            ))}
          </ul>
          <div className="modal-plan-meta">
            <div>
              <span className="meta-label">
                {t("planModal.metaLabelPremium")}
              </span>
              <strong>${plan.monthlyPremium.toFixed(2)}</strong>
            </div>
            <div>
              <span className="meta-label">
                {t("planModal.metaLabelDeductible")}
              </span>
              <strong>${plan.deductible.toLocaleString()}</strong>
            </div>
            <div>
              <span className="meta-label">
                {t("planModal.metaLabelOutOfPocket")}
              </span>
              <strong>${plan.outOfPocketMax.toLocaleString()}</strong>
            </div>
          </div>
        </section>
        <footer className="modal-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            {t("buttons.close")}
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => onSelect(plan)}
          >
            {t("buttons.selectPlan")}
          </button>
        </footer>
      </div>
    </div>
  );
};
