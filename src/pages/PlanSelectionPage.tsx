import React, { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { PlanModal } from "../components/PlanModal";
import { fetchPlansForMetadata } from "../services/planService";
import { useTranslation } from "../i18n/I18nProvider";
import { Plan } from "../types";
import { LeadWizardMetadata } from "../types/leadWizard";

interface PlanSelectionPageProps {
  metadata: LeadWizardMetadata;
  onPlanSelect: (
    plan: Plan,
    context: { fetchedAt: string; count: number }
  ) => void;
  onBack: () => void;
  onPlansLoaded?: (plans: Plan[]) => void;
}

export const PlanSelectionPage: React.FC<PlanSelectionPageProps> = ({
  metadata,
  onPlanSelect,
  onBack,
  onPlansLoaded,
}) => {
  const { t, language } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);

  const memberLabel =
    (metadata.household.size ?? metadata.members.length) === 1
      ? t("planSelection.memberWordSingular")
      : t("planSelection.memberWordPlural");

  const householdChipText = t("planSelection.householdChip", {
    zipCode: metadata.household.zipCode || "—",
    count: metadata.household.size ?? metadata.members.length,
    label: memberLabel,
  });

  useEffect(() => {
    let isMounted = true;
    setActivePlan(null);

    const loadPlans = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const fetchedPlans = await fetchPlansForMetadata(metadata, language);

        if (isMounted) {
          setPlans(fetchedPlans);
          onPlansLoaded?.(fetchedPlans);
        }
      } catch (loadError) {
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, [metadata, language, onPlansLoaded]);

  return (
    <div className="card">
      <div className="card-header">
        <button
          type="button"
          className="button button-secondary"
          onClick={onBack}
        >
          {t("buttons.back")}
        </button>
        <div className="household-chip">
          <span>{householdChipText}</span>
        </div>
      </div>

      <p className="section-helper">{t("planSelection.helper")}</p>

      {/* {isLoading && (
        <p className="status-message">{t("planSelection.loading")}</p>
      )} */}

      {isLoading && (
        <div className="loading-plans">
          <Spinner animation="border" role="status" />
          <span>{t("planSelection.loading")}</span>
        </div>
      )}

      {hasError && <p className="form-error">{t("planSelection.error")}</p>}

      {!isLoading && !hasError && (
        <div className="plan-list" role="list">
          {plans.map((plan) => (
            <article
              role="listitem"
              key={plan.id}
              className="plan-card"
              onClick={() => setActivePlan(plan)}
            >
              <div className="plan-card-header">
                <div className="plan-info">
                  <h5 className="title-plan">{plan.name}</h5>
                  <p className="plan-carrier">{plan.carrier}</p>
                </div>
                <div className="plan-price">
                  <span className="plan-price-caption">
                    {t("planSelection.monthlyPremium")}
                  </span>
                  <strong>${plan.monthlyPremium.toFixed(2)}</strong>
                </div>
              </div>
              <ul className="plan-highlights">
                {plan.coverageHighlights.map((highlight) => (
                  <li key={`${plan.id}-${highlight}`}>{highlight}</li>
                ))}
              </ul>
              <div className="plan-meta">
                <div>
                  <label>{t("planSelection.deductible")}:</label>$
                  {plan.deductible.toLocaleString()}
                </div>
                <div>
                  <label>{t("planSelection.outOfPocketMax")}:</label> $
                  {plan.outOfPocketMax.toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                className="button button-ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  setActivePlan(plan);
                }}
              >
                {t("buttons.viewDetails")}
              </button>
            </article>
          ))}
        </div>
      )}

      {activePlan && (
        <PlanModal
          plan={activePlan}
          onClose={() => setActivePlan(null)}
          onSelect={(plan) => {
            setActivePlan(null);
            onPlanSelect(plan, {
              fetchedAt: new Date().toISOString(),
              count: plans.length,
            });
          }}
        />
      )}
    </div>
  );
};
