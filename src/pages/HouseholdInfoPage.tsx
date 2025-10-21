import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "../i18n/I18nProvider";
import {
  PUBLIC_ZIPCODE_BY_ZIP,
  PUBLIC_ZIPCODE_SUGGESTIONS,
} from "../gql/publicZipcode";
import { useLazyQuery } from "@apollo/client/react";
import {
  PublicZipcodeResponse,
  PublicZipcodeSuggestionsResponse,
  ZipcodeSuggestion,
} from "../gql/types/IResponseZipCode";
import { PublicQuoteFormState } from "../gql/types/IPQuote";
import { nextMonthEffectiveDate } from "../gql/utils/Utils";
import { Form, Col, Row, Spinner, Card } from "react-bootstrap";
import { GENDER_OPTIONS } from "../consts";

interface PublicZipcodeVariables {
  zipCode: string;
  token: string;
}

interface PublicZipcodeSuggestionsVariables {
  prefix: string;
  token: string;
  limit?: number;
}
interface HouseholdInfoPageProps {
  initialValues: PublicQuoteFormState;
  onSubmit: (values: PublicQuoteFormState) => void;
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

const mapInitialValues = (
  values: PublicQuoteFormState
): PublicQuoteFormState => {
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
    zipCode: values.zipCode,
    zipcodeByZip: values.zipcodeByZip,
    householdIncome: values.householdIncome,
    householdIncomeTxt:
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
        ageFromDob !== null ? ageFromDob : hasNumericAge ? member.age : null;

      return {
        dateOfBirth: member.dateOfBirth ?? "",
        female: Boolean(member.female),
        age: fallbackAge !== null && fallbackAge >= 0 ? fallbackAge : null,
      };
    }),
  };
};

export const HouseholdInfoPage: React.FC<HouseholdInfoPageProps> = ({
  initialValues,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    queryType: "BUSCAR_PLANES",
    effectiveDate: nextMonthEffectiveDate(),
    year: new Date(nextMonthEffectiveDate()).getFullYear(),
    householdIncome: "",
    market: "Individual",
    countyfips: "", //17033
    countyfipsName: "",
    state: "", //IL
    zipCode: "", //62466
    limit: 5,
    offset: 0,
    order: "asc",
    utilizationLevel: "Low",
    numberOfMembers: "1",
    personOne: {
      age: "",
      dob: "",
      gender: "Male",
      isPregnant: false,
      pregnantWith: "",
      isParent: false,
      usesTobacco: false,
      lastTobaccoUseDate: "",
      hasMec: false,
      aptcEligible: true,
      utilizationLevel: "",
      relationship: "",
      doesNotCohabitate: "",
      currentEnrollment: null,
    },
    people: [], // Add the required 'people' property
  });

  const { t } = useTranslation();
  const [formState, setFormState] = useState<PublicQuoteFormState>(
    mapInitialValues(initialValues)
  );
  const [error, setError] = useState<string | null>(null);
  const [zipValidationMessage, setZipValidationMessage] = useState<
    string | null
  >(null);
  const [zipSuggestions, setZipSuggestions] = useState<ZipcodeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const refControl = useRef<HTMLInputElement>(null);

  const publicToken = process.env.REACT_APP_PUBLIC_GRAPHQL_TOKEN ?? "";

  const [
    fetchZipcode,
    { data: zipcodeData, error: zipcodeQueryError, loading: loadingZipCode },
  ] = useLazyQuery<PublicZipcodeResponse, PublicZipcodeVariables>(
    PUBLIC_ZIPCODE_BY_ZIP,
    {
      fetchPolicy: "no-cache",
    }
  );

  const [
    fetchZipcodeSuggestions,
    { data: zipcodeSuggestionsData, error: zipcodeSuggestionsError },
  ] = useLazyQuery<
    PublicZipcodeSuggestionsResponse,
    PublicZipcodeSuggestionsVariables
  >(PUBLIC_ZIPCODE_SUGGESTIONS, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (!zipcodeData) return;

    const zipCodeInfo = zipcodeData.publicZipcodeByZip;

    if (zipCodeInfo) {
      setFormState((prev) => ({
        ...prev,
        zipCode: zipCodeInfo.zipCode,
        zipcodeByZip: zipCodeInfo,
      }));

      setFormData((prev: any) => ({
        ...prev,
        zipCode: zipCodeInfo.zipCode,
        countyfips: zipCodeInfo.countyFips,
        state: zipCodeInfo.stateId,
        countyfipsName: `${zipCodeInfo.countyNamesAll}(${zipCodeInfo.countyFipsAll})/${zipCodeInfo.stateName}-${zipCodeInfo.stateId}/${zipCodeInfo.zipCode}`,
      }));

      setZipSuggestions([]);
      setShowSuggestions(false);
    } else {
      setZipValidationMessage(t("householdForm.errors.zipCode"));
    }
  }, [zipcodeData, t]);

  useEffect(() => {
    const zip = (formState.zipCode ?? "").trim();

    if (!publicToken || zip.length < 3) {
      setZipSuggestions([]);
      if (zip.length < 3) {
        setShowSuggestions(false);
      }
      return;
    }

    const debounceId = window.setTimeout(() => {
      fetchZipcodeSuggestions({
        variables: {
          prefix: zip,
          token: publicToken,
          limit: 8,
        },
      }).catch(() => {});
    }, 250);

    return () => window.clearTimeout(debounceId);
  }, [formState.zipCode, publicToken, fetchZipcodeSuggestions]);

  useEffect(() => {
    if (zipcodeSuggestionsData) {
      const results = zipcodeSuggestionsData.publicZipcodeSuggestions ?? [];
      setZipSuggestions(results);
      setShowSuggestions(results.length > 0);
    }
  }, [zipcodeSuggestionsData]);

  useEffect(() => {
    if (zipcodeSuggestionsError) {
      setZipSuggestions([]);
    }
  }, [zipcodeSuggestionsError]);

  useEffect(() => {
    if (!showSuggestions) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const suggestionsNode = suggestionsRef.current;
      const inputNode = refControl.current;

      if (
        suggestionsNode &&
        !suggestionsNode.contains(target) &&
        inputNode &&
        target !== inputNode
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  useEffect(() => {
    setFormState(mapInitialValues(initialValues));
  }, [initialValues]);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const membersLabel = useMemo(
    () =>
      formState.memberQuantity === 1
        ? t("householdForm.membersTitleSingular")
        : t("householdForm.membersTitlePlural"),
    [formState.memberQuantity, t]
  );

  const handleHouseholdFieldChange = (
    key: "zipCode" | "householdIncome" | "householdIncomeTxt",
    value: string
  ) => {
    if (key === "zipCode") {
      setZipValidationMessage(null);
      const sanitized = value.replace(/\D/g, "").slice(0, 5);

      setFormState((prev) => ({
        ...prev,
        zipCode: sanitized,
        zipcodeByZip: null,
      }));

      setFormData((prev) => ({
        ...prev,
        zipCode: sanitized,
        countyfips: "",
        countyfipsName: "",
      }));

      setShowSuggestions(true);
      return;
    }

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
            age: null,
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
              age: calculateAge(value),
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

  const validateForm = (state: PublicQuoteFormState): string | null => {
    if (!state.zipcodeByZip?.zipCode) {
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
      (member) => member.age === null || member.age <= 0
    );

    if (invalidAge) {
      return t("householdForm.errors.memberAge");
    }

    return null;
  };

  const handleZipBlur = () => {
    const zip = (formState.zipCode ?? "").trim();
    if (!zip || zip.length < 3) {
      setShowSuggestions(false);
      return;
    }

    if (!publicToken) {
      setShowSuggestions(false);
      return;
    }

    window.setTimeout(() => setShowSuggestions(false), 120);

    fetchZipcode({
      variables: {
        zipCode: zip,
        token: publicToken,
      },
    }).catch(() => {
      // Error handled by Apollo state
    });
  };

  useEffect(() => {
    if (zipcodeData) {
      const zipcodeResult = zipcodeData.publicZipcodeByZip;
      if (!zipcodeResult) {
        setZipValidationMessage(t("householdForm.errors.zipCode"));
      } else {
        setZipValidationMessage(null);
      }
    }
  }, [zipcodeData, t]);

  useEffect(() => {
    if (zipcodeQueryError) {
      setZipValidationMessage(t("householdForm.errors.zipCode"));
    }
  }, [zipcodeQueryError, t]);

  const handleSuggestionSelect = (suggestion: ZipcodeSuggestion) => {
    setFormState((prev) => ({
      ...prev,
      zipCode: suggestion.zipCode,
      zipcodeByZip: null,
    }));

    setFormData((prev: any) => ({
      ...prev,
      zipCode: suggestion.zipCode,
      countyfips: "",
      countyfipsName: "",
    }));

    setZipSuggestions([]);
    setShowSuggestions(false);
    setZipValidationMessage(null);

    if (!publicToken) {
      return;
    }

    fetchZipcode({
      variables: {
        zipCode: suggestion.zipCode,
        token: publicToken,
      },
    }).catch(() => {});
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validateForm(formState);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (zipValidationMessage) {
      setError(zipValidationMessage);
      return;
    }

    const sanitizedMembers = formState.members.map((member) => {
      const computedAge = member.age ?? calculateAge(member.dateOfBirth) ?? 0;

      return {
        age: computedAge,
        female: Boolean(member.female),
        dateOfBirth: member.dateOfBirth,
      };
    });

    onSubmit({
      zipCode: formState.zipCode,
      zipcodeByZip: formState.zipcodeByZip,
      householdIncome: Number(formState.householdIncome),
      householdIncomeTxt: formState.householdIncomeTxt,
      memberQuantity: formState.memberQuantity,
      members: sanitizedMembers,
    });
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="form-section">
        <h5>{t("householdForm.basicInfoTitle")}</h5>
        <div className="form-grid">
          <Row className="household row">
            <Col lg={3} md={6} sm={12} xs={12}>
              <Form.Group>
                <Form.Label className="form-field">
                  {t("householdForm.incomeLabel")}
                </Form.Label>
                <Form.Control
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9,]*"
                  placeholder={t("householdForm.incomePlaceholder")}
                  name="householdIncome"
                  value={formState.householdIncomeTxt}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    if (raw !== "" && Number.isNaN(Number(raw))) return;

                    handleHouseholdFieldChange("householdIncome", raw);
                    handleHouseholdFieldChange(
                      "householdIncomeTxt",
                      raw === ""
                        ? ""
                        : Intl.NumberFormat("en-US").format(Number(raw))
                    );
                  }}
                  required
                />
              </Form.Group>
            </Col>
            <Col lg={3} md={6} sm={12} xs={12}>
              <Form.Group className="form-group">
                <Form.Label className="form-field">Zip Code</Form.Label>
                <div className="zip-autocomplete" ref={suggestionsRef}>
                  <Form.Control
                    ref={refControl}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    name="zipCode"
                    value={
                      formState.zipCode ?? formState.zipcodeByZip?.zipCode ?? ""
                    }
                    placeholder={t("householdForm.zipCodePlaceholder")}
                    onChange={(event) =>
                      handleHouseholdFieldChange("zipCode", event.target.value)
                    }
                    onBlur={handleZipBlur}
                    onFocus={() => {
                      if (zipSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleZipBlur();
                      }
                    }}
                  />
                  {showSuggestions && zipSuggestions.length > 0 && (
                    <ul className="zip-suggestions">
                      {zipSuggestions.map((suggestion) => (
                        <li
                          key={suggestion.id}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleSuggestionSelect(suggestion);
                          }}
                        >
                          <strong>{suggestion.zipCode}</strong>{" "}
                          <span>
                            {suggestion.city}, {suggestion.stateId}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Form.Group>
            </Col>
            {formState.zipCode || formState.zipcodeByZip?.zipCode ? (
              <Col lg={3} md={6} sm={12} xs={12}>
                <Form.Group className="form-group">
                  <Form.Label className="form-field">County FIPS</Form.Label>{" "}
                  {loadingZipCode && (
                    <span>
                      <Spinner animation="border" size="sm" />
                    </span>
                  )}
                  <Form.Select
                    disabled={loadingZipCode || formData.zipCode?.length < 3}
                    value={formData.countyfips}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        countyfips: e.target.value,
                        countyfipsName: e.target.selectedOptions[0].text,
                      }))
                    }
                  >
                    <option value="">Select county FIPS</option>
                    {zipcodeData &&
                      zipcodeData?.publicZipcodeByZip?.countyNamesAll
                        ?.split("|")
                        .map((str, idx) => (
                          <option
                            key={str}
                            value={
                              zipcodeData?.publicZipcodeByZip?.countyFipsAll?.split(
                                "|"
                              )[idx]
                            }
                          >
                            {str} -{" "}
                            {
                              zipcodeData?.publicZipcodeByZip?.countyFipsAll?.split(
                                "|"
                              )[idx]
                            }
                          </option>
                        ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            ) : null}
            <Col lg={3} md={6} sm={12} xs={12}>
              <Form.Group>
                <Form.Label className="form-field">
                  {t("householdForm.memberQuantityLabel")}
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder={t("householdForm.memberQuantityLabel")}
                  name="memberQuantityLabel"
                  min={1}
                  max={8}
                  value={formState.memberQuantity}
                  onChange={(event) =>
                    handleMemberQuantityChange(event.target.value)
                  }
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
      </div>

      <div className="form-section">
        <h5>{membersLabel}</h5>
        <p className="section-helper">{t("householdForm.membersHelper")}</p>

        <div className="member-grid">
          {formState.members.map((member, index) => {
            const ageLabel =
              member.age !== null
                ? t("householdForm.age", {
                    age: member.age,
                  })
                : t("householdForm.agePending");

            return (
              <Card className="member-card" key={`member-${index}`}>
                <Card.Title className="member-card-title">
                  {t("householdForm.memberHeading", { number: index + 1 })}
                </Card.Title>
                <Form.Group className="form-group-field">
                  <Form.Label className="form-field date-of-birth-label">
                    {t("householdForm.dateOfBirthLabel")}
                    <div className="computed-age-label">{ageLabel}</div>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    placeholder={t("householdForm.dateOfBirthPlaceholder")}
                    name="dateOfBirthPlaceholder"
                    max={today}
                    value={member.dateOfBirth}
                    onChange={(event) =>
                      handleMemberDateChange(index, event.target.value)
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="form-group-field">
                  <Form.Label className="form-field">
                    {t("householdForm.genderLabel")}
                  </Form.Label>
                  <Form.Control
                    required
                    as="select"
                    name="gender"
                    value={String(member.female)}
                    onChange={(event) =>
                      handleMemberGenderChange(index, event.target.value)
                    }
                  >
                    {GENDER_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
                {/* <label className="form-field">
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
                </label> */}

                {/* <label className="form-field">
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
                </label> */}
              </Card>
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
