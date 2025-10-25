import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "../i18n/I18nProvider";
import {
  HouseholdRole,
  HouseholdType,
  LeadHouseholdMember,
} from "../types/leadWizard";

interface AdditionalMembersStepProps {
  householdType: HouseholdType;
  members: LeadHouseholdMember[];
  onBack: () => void;
  onSubmit: (members: LeadHouseholdMember[]) => void;
}

type EditableMember = {
  role: HouseholdRole;
  firstName: string;
  lastName: string;
  gender: LeadHouseholdMember["gender"];
  birthDate: string;
};

const normalizeMembers = (
  members: LeadHouseholdMember[],
  householdType: HouseholdType
): { primary: LeadHouseholdMember; others: EditableMember[] } => {
  const fallbackPrimary: LeadHouseholdMember = {
    role: "PRIMARY",
    firstName: "",
    lastName: "",
    gender: "F",
    birthDate: "",
  };

  const [primary, ...others] = members.length ? members : [fallbackPrimary];

  const normalizedOthers = others.map((member) => ({
    role:
      householdType === "PAREJA"
        ? "SPOUSE"
        : (member.role as HouseholdRole) || "DEPENDENT",
    firstName: member.firstName,
    lastName: member.lastName,
    gender: (member.gender as LeadHouseholdMember["gender"]) ?? "F",
    birthDate: member.birthDate,
  }));

  return { primary, others: normalizedOthers };
};

const ensureLength = (
  current: EditableMember[],
  required: number,
  roleFactory: (index: number) => HouseholdRole
): EditableMember[] => {
  const next = [...current];
  if (next.length > required) {
    return next.slice(0, required);
  }

  while (next.length < required) {
    const index = next.length;
    next.push({
      role: roleFactory(index),
      firstName: "",
      lastName: "",
      gender: "F",
      birthDate: "",
    });
  }

  return next;
};

export const AdditionalMembersStep: React.FC<AdditionalMembersStepProps> = ({
  householdType,
  members,
  onBack,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const { primary, others: initialOthers } = useMemo(
    () => normalizeMembers(members, householdType),
    [members, householdType]
  );

  const initialCount = householdType === "PAREJA" ? 1 : Math.max(initialOthers.length || 1, 1);

  const [additionalCount, setAdditionalCount] = useState(initialCount);
  const [additionalMembers, setAdditionalMembers] = useState<EditableMember[]>(
    ensureLength(initialOthers, initialCount, (index) =>
      householdType === "PAREJA" ? "SPOUSE" : "DEPENDENT"
    )
  );
  const [errors, setErrors] = useState<string[][]>([]);

  useEffect(() => {
    setAdditionalMembers((current) =>
      ensureLength(current, additionalCount, (index) =>
        householdType === "PAREJA" ? "SPOUSE" : "DEPENDENT"
      )
    );
  }, [additionalCount, householdType]);

  const handleMemberChange = (
    index: number,
    field: keyof EditableMember,
    value: string
  ) => {
    setAdditionalMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setErrors((prev) => {
      const next = [...prev];
      if (!next[index]) {
        next[index] = [];
      }
      next[index][field === "firstName" ? 0 : field === "lastName" ? 1 : field === "birthDate" ? 2 : 3] = "";
      return next;
    });
  };

  const validate = () => {
    const nextErrors: string[][] = additionalMembers.map(() => []);
    let hasError = false;

    additionalMembers.forEach((member, index) => {
      if (!member.firstName.trim()) {
        nextErrors[index][0] = t("wizard.members.errors.firstName");
        hasError = true;
      }
      if (!member.lastName.trim()) {
        nextErrors[index][1] = t("wizard.members.errors.lastName");
        hasError = true;
      }
      if (!member.birthDate) {
        nextErrors[index][2] = t("wizard.members.errors.birthDate");
        hasError = true;
      }
    });

    setErrors(nextErrors);
    return !hasError;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const fullMembers: LeadHouseholdMember[] = [primary, ...additionalMembers];
    onSubmit(fullMembers);
  };

  const titleKey =
    householdType === "PAREJA"
      ? "wizard.members.titleCouple"
      : "wizard.members.titleFamily";

  return (
    <div className="card">
      <div className="card-header">
        <button type="button" className="button button-secondary" onClick={onBack}>
          {t("buttons.back")}
        </button>
      </div>
      <div className="card-body">
        <h3 className="card-title">{t(titleKey)}</h3>
        <p className="section-helper">
          {t("wizard.members.helper", {
            household: t(
              `wizard.householdType.options.${householdType.toLowerCase()}`
            ),
          })}
        </p>

        <div className="primary-summary">
          <strong>{`${primary.firstName} ${primary.lastName}`.trim()}</strong>
          <span>{t("wizard.members.primaryLabel")}</span>
        </div>

        {householdType === "FAMILIA" && (
          <div className="form-group">
            <label htmlFor="familyCount">
              {t("wizard.members.familyCountLabel")}
            </label>
            <input
              id="familyCount"
              type="number"
              min={1}
              max={8}
              value={additionalCount}
              onChange={(event) =>
                setAdditionalCount(Math.max(1, Number(event.target.value) || 1))
              }
            />
            <span className="input-hint">
              {t("wizard.members.familyCountHint")}
            </span>
          </div>
        )}

        <div className="members-grid">
          {additionalMembers.map((member, index) => (
            <div key={index} className="member-card">
              <h4>
                {t("wizard.members.memberTitle", { number: index + 1 })}
                <span className="role-tag">
                  {t(`wizard.members.roles.${member.role.toLowerCase()}`)}
                </span>
              </h4>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor={`memberFirstName-${index}`}>
                    {t("wizard.members.firstNameLabel")}
                  </label>
                  <input
                    id={`memberFirstName-${index}`}
                    value={member.firstName}
                    onChange={(event) =>
                      handleMemberChange(index, "firstName", event.target.value)
                    }
                  />
                  {errors[index]?.[0] && (
                    <span className="form-error">{errors[index][0]}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor={`memberLastName-${index}`}>
                    {t("wizard.members.lastNameLabel")}
                  </label>
                  <input
                    id={`memberLastName-${index}`}
                    value={member.lastName}
                    onChange={(event) =>
                      handleMemberChange(index, "lastName", event.target.value)
                    }
                  />
                  {errors[index]?.[1] && (
                    <span className="form-error">{errors[index][1]}</span>
                  )}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor={`memberGender-${index}`}>
                    {t("wizard.members.genderLabel")}
                  </label>
                  <select
                    id={`memberGender-${index}`}
                    value={member.gender}
                    onChange={(event) =>
                      handleMemberChange(index, "gender", event.target.value)
                    }
                  >
                    <option value="F">
                      {t("wizard.primary.gender.options.f")}
                    </option>
                    <option value="M">
                      {t("wizard.primary.gender.options.m")}
                    </option>
                    <option value="X">
                      {t("wizard.primary.gender.options.x")}
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor={`memberBirthDate-${index}`}>
                    {t("wizard.members.birthDateLabel")}
                  </label>
                  <input
                    id={`memberBirthDate-${index}`}
                    type="date"
                    value={member.birthDate}
                    onChange={(event) =>
                      handleMemberChange(index, "birthDate", event.target.value)
                    }
                  />
                  {errors[index]?.[2] && (
                    <span className="form-error">{errors[index][2]}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
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
