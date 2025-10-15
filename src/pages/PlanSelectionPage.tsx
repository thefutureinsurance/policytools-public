import React, { useEffect, useState } from "react";
import { PlanModal } from "../components/PlanModal";
import { fetchPlansForHousehold } from "../services/planService";
import { HouseholdFormValues, Plan } from "../types";
import { useTranslation } from "../i18n/I18nProvider";

interface PlanSelectionPageProps {
  household: HouseholdFormValues;
  onPlanSelect: (plan: Plan) => void;
  onBack: () => void;
}

export const PlanSelectionPage: React.FC<PlanSelectionPageProps> = ({
  household,
  onPlanSelect,
  onBack,
}) => {
  const { t, language } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);

  const memberLabel =
    household.memberQuantity === 1
      ? t("planSelection.memberWordSingular")
      : t("planSelection.memberWordPlural");

  const householdChipText = t("planSelection.householdChip", {
    zipCode: household.zipCode || "—",
    count: household.memberQuantity,
    label: memberLabel,
  });

  useEffect(() => {
    let isMounted = true;
    setActivePlan(null);

    const loadPlans = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const fetchedPlans = await fetchPlansForHousehold(household, language);

        if (isMounted) {
          setPlans(fetchedPlans);
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
  }, [household, language]);

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

      {isLoading && (
        <p className="status-message">{t("planSelection.loading")}</p>
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
                <div>
                  <h3>{plan.name}</h3>
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
                <span>
                  {t("planSelection.deductible")}: $
                  {plan.deductible.toLocaleString()}
                </span>
                <span>
                  {t("planSelection.outOfPocketMax")}: $
                  {plan.outOfPocketMax.toLocaleString()}
                </span>
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
            onPlanSelect(plan);
          }}
        />
      )}
    </div>
  );
};
