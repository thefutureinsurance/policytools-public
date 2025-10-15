import React, { useEffect, useMemo, useState } from "react";
import { HouseholdFormValues } from "../types";
import { useTranslation } from "../i18n/I18nProvider";

interface FormMemberState {
  age: string;
  female: boolean;
}

interface FormState {
  zipCode: string;
  householdIncome: string;
  memberQuantity: number;
  members: FormMemberState[];
}

interface HouseholdInfoPageProps {
  initialValues: HouseholdFormValues;
  onSubmit: (values: HouseholdFormValues) => void;
}

const mapInitialValues = (values: HouseholdFormValues): FormState => {
  const quantity = Math.max(values.memberQuantity || 1, 1);
  const members =
    values.members?.length === quantity
      ? values.members
      : Array.from({ length: quantity }, (_, index) => {
          return values.members?.[index] ?? { age: 0, female: false };
        });

  return {
    zipCode: values.zipCode ?? "",
    householdIncome:
      values.householdIncome && values.householdIncome > 0
        ? String(values.householdIncome)
        : "",
    memberQuantity: quantity,
    members: members.map((member) => ({
      age: member.age ? String(member.age) : "",
      female: Boolean(member.female),
    })),
  };
};

export const HouseholdInfoPage: React.FC<HouseholdInfoPageProps> = ({
  initialValues,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formState, setFormState] = useState<FormState>(
    mapInitialValues(initialValues)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormState(mapInitialValues(initialValues));
  }, [initialValues]);

  const membersLabel = useMemo(
    () =>
      formState.memberQuantity === 1
        ? t("householdForm.membersTitleSingular")
        : t("householdForm.membersTitlePlural"),
    [formState.memberQuantity, t]
  );

  const handleHouseholdFieldChange = (
    key: "zipCode" | "householdIncome",
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleMemberQuantityChange = (value: string) => {
    const nextQuantity = Math.min(Math.max(Number(value) || 1, 1), 8);

    setFormState((prev) => {
      const currentMembers = prev.members.slice(0, nextQuantity);
      const difference = nextQuantity - currentMembers.length;

      if (difference > 0) {
        currentMembers.push(
          ...Array.from({ length: difference }, () => ({
            age: "",
            female: false,
          }))
        );
      }

      return {
        ...prev,
        memberQuantity: nextQuantity,
        members: currentMembers,
      };
    });
  };

  const handleMemberFieldChange = (
    index: number,
    key: keyof FormMemberState,
    value: string
  ) => {
    setFormState((prev) => {
      const updatedMembers = prev.members.map((member, memberIndex) =>
        memberIndex === index
          ? {
              ...member,
              [key]:
                key === "female" ? value === "true" : value.replace(/\D/g, ""),
            }
          : member
      );

      return {
        ...prev,
        members: updatedMembers,
      };
    });
  };

  const validateForm = (state: FormState): string | null => {
    if (!state.zipCode.trim()) {
      return t("householdForm.errors.zipCode");
    }

    const income = Number(state.householdIncome);

    if (!Number.isFinite(income) || income <= 0) {
      return t("householdForm.errors.income");
    }

    const someInvalidMember = state.members.some((member) => {
      const age = Number(member.age);
      return !Number.isFinite(age) || age <= 0 || age > 120;
    });

    if (someInvalidMember) {
      return t("householdForm.errors.memberAge");
    }

    return null;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validateForm(formState);

    if (validationError) {
      setError(validationError);
      return;
    }

    const sanitizedMembers = formState.members.map((member) => ({
      age: Number(member.age),
      female: Boolean(member.female),
    }));

    onSubmit({
      zipCode: formState.zipCode.trim(),
      householdIncome: Number(formState.householdIncome),
      memberQuantity: formState.memberQuantity,
      members: sanitizedMembers,
    });
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="form-section">
        <h3>{t("householdForm.basicInfoTitle")}</h3>
        <div className="form-grid">
          <label className="form-field">
            <span>{t("householdForm.zipCodeLabel")}</span>
            <input
              type="text"
              inputMode="numeric"
              value={formState.zipCode}
              onChange={(event) =>
                handleHouseholdFieldChange("zipCode", event.target.value)
              }
              placeholder={t("householdForm.zipCodePlaceholder")}
            />
          </label>

          <label className="form-field">
            <span>{t("householdForm.incomeLabel")}</span>
            <input
              type="number"
              min={0}
              value={formState.householdIncome}
              onChange={(event) =>
                handleHouseholdFieldChange("householdIncome", event.target.value)
              }
              placeholder={t("householdForm.incomePlaceholder")}
            />
          </label>

          <label className="form-field">
            <span>{t("householdForm.memberQuantityLabel")}</span>
            <input
              type="number"
              min={1}
              max={8}
              value={formState.memberQuantity}
              onChange={(event) => handleMemberQuantityChange(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>{membersLabel}</h3>
        <p className="section-helper">{t("householdForm.membersHelper")}</p>

        <div className="member-grid">
          {formState.members.map((member, index) => (
            <div className="member-card" key={`member-${index}`}>
              <h4>
                {t("householdForm.memberHeading", { number: index + 1 })}
              </h4>
              <label className="form-field">
                <span>{t("householdForm.ageLabel")}</span>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={member.age}
                  onChange={(event) =>
                    handleMemberFieldChange(
                      index,
                      "age",
                      event.target.value.slice(0, 3)
                    )
                  }
                  placeholder={t("householdForm.agePlaceholder")}
                />
              </label>

              <label className="form-field">
                <span>{t("householdForm.genderLabel")}</span>
                <select
                  value={String(member.female)}
                  onChange={(event) =>
                    handleMemberFieldChange(index, "female", event.target.value)
                  }
                >
                  <option value="false">{t("genders.male")}</option>
                  <option value="true">{t("genders.female")}</option>
                </select>
              </label>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="button button-primary">
          {t("buttons.continue")}
        </button>
      </div>
    </form>
  );
};
