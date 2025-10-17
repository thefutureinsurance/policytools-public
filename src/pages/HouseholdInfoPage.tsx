import React, { useEffect, useMemo, useState } from "react";
import { HouseholdFormValues } from "../types";
import { useTranslation } from "../i18n/I18nProvider";

interface FormMemberState {
  dateOfBirth: string;
  female: boolean;
  computedAge: number | null;
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

const calculateAge = (dateString: string): number | null => {
  if (!dateString) {
    return null;
  }
  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - parsedDate.getFullYear();
  const monthDiff = today.getMonth() - parsedDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < parsedDate.getDate())
  ) {
    age -= 1;
  }

  if (age < 0 || age > 120) {
    return null;
  }

  return age;
};

const mapInitialValues = (values: HouseholdFormValues): FormState => {
  const quantity = Math.max(values.memberQuantity || 1, 1);
  const members =
    values.members?.length === quantity
      ? values.members
      : Array.from({ length: quantity }, (_, index) => {
          return (
            values.members?.[index] ?? {
              age: 0,
              female: false,
              dateOfBirth: "",
            }
          );
        });

  return {
    zipCode: values.zipCode ?? "",
    householdIncome:
      values.householdIncome && values.householdIncome > 0
        ? String(values.householdIncome)
        : "",
    memberQuantity: quantity,
    members: members.map((member) => {
      const ageFromDob = member.dateOfBirth
        ? calculateAge(member.dateOfBirth)
        : null;
      const hasNumericAge =
        typeof member.age === "number" && Number.isFinite(member.age);
      const fallbackAge =
        ageFromDob !== null
          ? ageFromDob
          : hasNumericAge
          ? member.age
          : null;

      return {
        dateOfBirth: member.dateOfBirth ?? "",
        female: Boolean(member.female),
        computedAge:
          fallbackAge !== null && fallbackAge >= 0 ? fallbackAge : null,
      };
    }),
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

  const today = useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );

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
            dateOfBirth: "",
            female: false,
            computedAge: null,
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

  const handleMemberDateChange = (index: number, value: string) => {
    setFormState((prev) => {
      const updatedMembers = prev.members.map((member, memberIndex) =>
        memberIndex === index
          ? {
              ...member,
              dateOfBirth: value,
              computedAge: calculateAge(value),
            }
          : member
      );

      return {
        ...prev,
        members: updatedMembers,
      };
    });
  };

  const handleMemberGenderChange = (index: number, value: string) => {
    setFormState((prev) => {
      const updatedMembers = prev.members.map((member, memberIndex) =>
        memberIndex === index
          ? {
              ...member,
              female: value === "true",
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

    const missingDob = state.members.some(
      (member) => !member.dateOfBirth || !member.dateOfBirth.trim()
    );

    if (missingDob) {
      return t("householdForm.errors.memberDob");
    }

    const invalidAge = state.members.some(
      (member) => member.computedAge === null || member.computedAge <= 0
    );

    if (invalidAge) {
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

    const sanitizedMembers = formState.members.map((member) => {
      const computedAge =
        member.computedAge ?? calculateAge(member.dateOfBirth) ?? 0;

      return {
        age: computedAge,
        female: Boolean(member.female),
        dateOfBirth: member.dateOfBirth,
      };
    });

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
          {formState.members.map((member, index) => {
            const ageLabel =
              member.computedAge !== null
                ? t("householdForm.ageComputed", {
                    age: member.computedAge,
                  })
                : t("householdForm.agePending");

            return (
              <div className="member-card" key={`member-${index}`}>
                <h4>
                  {t("householdForm.memberHeading", { number: index + 1 })}
                </h4>

                <label className="form-field">
                  <span>{t("householdForm.dateOfBirthLabel")}</span>
                  <input
                    type="date"
                    max={today}
                    value={member.dateOfBirth}
                    onChange={(event) =>
                      handleMemberDateChange(index, event.target.value)
                    }
                    placeholder={t("householdForm.dateOfBirthPlaceholder")}
                  />
                </label>

                <div className="computed-age-label">{ageLabel}</div>

                <label className="form-field">
                  <span>{t("householdForm.genderLabel")}</span>
                  <select
                    value={String(member.female)}
                    onChange={(event) =>
                      handleMemberGenderChange(index, event.target.value)
                    }
                  >
                    <option value="false">{t("genders.male")}</option>
                    <option value="true">{t("genders.female")}</option>
                  </select>
                </label>
              </div>
            );
          })}
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
