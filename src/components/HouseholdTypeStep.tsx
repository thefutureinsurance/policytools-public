import React from "react";
import { HouseholdType } from "../types/leadWizard";
import { useTranslation } from "../i18n/I18nProvider";

interface HouseholdTypeStepProps {
  value: HouseholdType | null;
  onSelect: (type: HouseholdType) => void;
}

const OPTIONS: { type: HouseholdType; icon: string }[] = [
  { type: "SOLTERO", icon: "👤" },
  { type: "PAREJA", icon: "👥" },
  { type: "FAMILIA", icon: "👨‍👩‍👧" },
];

export const HouseholdTypeStep: React.FC<HouseholdTypeStepProps> = ({
  value,
  onSelect,
}) => {
  const { t } = useTranslation();

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title">{t("wizard.householdType.title")}</h3>
        <p className="section-helper">{t("wizard.householdType.helper")}</p>

        <div className="household-type-grid">
          {OPTIONS.map(({ type, icon }) => {
            const isActive = value === type;
            return (
              <button
                key={type}
                type="button"
                className={`household-type-option${isActive ? " active" : ""}`}
                onClick={() => {
                  onSelect(type);
                }}
              >
                <span aria-hidden="true" className="household-type-icon">
                  {icon}
                </span>
                <span className="household-type-label">
                  {t(`wizard.householdType.options.${type.toLowerCase()}`)}
                </span>
              </button>
            );
          })}
        </div>
        {/* 
        <div className="form-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={onContinue}
            disabled={isContinueDisabled || !value}
          >
            {t("buttons.continue")}
          </button>
        </div> */}
      </div>
    </div>
  );
};
