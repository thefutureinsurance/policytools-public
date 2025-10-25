import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { useTranslation } from "../i18n/I18nProvider";
import {
  PUBLIC_ZIPCODE_BY_ZIP,
  PUBLIC_ZIPCODE_SUGGESTIONS,
} from "../gql/publicZipcode";
import {
  PublicZipcodeResponse,
  PublicZipcodeSuggestionsResponse,
  ZipcodeSuggestion,
  ZipcodeByZip,
} from "../gql/types/IResponseZipCode";
import { HouseholdType } from "../types/leadWizard";

interface HouseholdBasicsStepProps {
  householdType: HouseholdType;
  initialZip?: string | null;
  initialIncome?: number | null;
  initialCountyFips?: string | null;
  onBack: () => void;
  onSubmit: (payload: {
    zipCode: string;
    income: number;
    countyFips: string;
    countyName?: string | null;
    stateId?: string | null;
    stateName?: string | null;
    zipcodeRecord: ZipcodeByZip;
  }) => void;
}

interface PublicZipcodeVariables {
  zipCode: string;
  token: string;
}

interface PublicZipcodeSuggestionsVariables {
  prefix: string;
  token: string;
  limit?: number;
}

const MIN_SUGGESTION_LENGTH = 3;

export const HouseholdBasicsStep: React.FC<HouseholdBasicsStepProps> = ({
  householdType,
  initialZip,
  initialIncome,
  initialCountyFips,
  onBack,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const [zipCode, setZipCode] = useState(initialZip ?? "");
  const [income, setIncome] = useState(
    initialIncome ? String(initialIncome) : ""
  );
  const [selectedCounty, setSelectedCounty] = useState(initialCountyFips ?? "");
  const [zipcodeRecord, setZipcodeRecord] = useState<ZipcodeByZip | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [zipSuggestions, setZipSuggestions] = useState<ZipcodeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestionsRef = useRef<HTMLDivElement | null>(null);

  const publicToken = process.env.REACT_APP_PUBLIC_GRAPHQL_TOKEN ?? "";

  const [fetchZipcode, { loading: loadingZipcode }] =
    useLazyQuery<PublicZipcodeResponse, PublicZipcodeVariables>(
      PUBLIC_ZIPCODE_BY_ZIP,
      { fetchPolicy: "no-cache" }
    );

  const [fetchZipcodeSuggestions] =
    useLazyQuery<PublicZipcodeSuggestionsResponse, PublicZipcodeSuggestionsVariables>(
      PUBLIC_ZIPCODE_SUGGESTIONS,
      { fetchPolicy: "network-only" }
    );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("click", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [showSuggestions]);

  useEffect(() => {
    if (!initialZip) {
      return;
    }
    fetchZipInfo(initialZip);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const countyOptions = useMemo(() => {
    if (!zipcodeRecord) {
      return [] as { fips: string; name: string }[];
    }

    const fipsValues = (zipcodeRecord.countyFipsAll || "")
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean);
    const names = (zipcodeRecord.countyNamesAll || "")
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean);

    if (fipsValues.length === 0) {
      return [
        {
          fips: zipcodeRecord.countyFips ?? "",
          name: zipcodeRecord.countyName ?? zipcodeRecord.countyFips ?? "",
        },
      ];
    }

    return fipsValues.map((fips, index) => ({
      fips,
      name: names[index] ?? fips,
    }));
  }, [zipcodeRecord]);

  const fetchZipInfo = async (code: string) => {
    try {
      const { data } = await fetchZipcode({
        variables: { token: publicToken, zipCode: code },
      });
      const record = data?.publicZipcodeByZip ?? null;
      setZipcodeRecord(record);
      if (record) {
        setZipError(null);
        setSelectedCounty(record.countyFips ?? "");
      } else {
        setZipError(t("wizard.householdBasics.errors.zip"));
      }
    } catch (error) {
      console.warn("[public] zipcode lookup failed", error);
      setZipcodeRecord(null);
      setZipError(t("wizard.householdBasics.errors.zip"));
    }
  };

  const handleZipChange = async (value: string) => {
    const numberOnly = value.replace(/[^0-9]/g, "");
    setZipCode(numberOnly);
    setZipError(null);

    if (numberOnly.length === 5) {
      await fetchZipInfo(numberOnly);
      setShowSuggestions(false);
    } else if (numberOnly.length >= MIN_SUGGESTION_LENGTH) {
      try {
        const { data } = await fetchZipcodeSuggestions({
          variables: {
            token: publicToken,
            prefix: numberOnly,
            limit: 5,
          },
        });
        setZipSuggestions(data?.publicZipcodeSuggestions ?? []);
        setShowSuggestions(true);
      } catch (error) {
        console.warn("[public] zipcode suggestions failed", error);
        setZipSuggestions([]);
      }
    } else {
      setZipSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: ZipcodeSuggestion) => {
    setZipCode(suggestion.zipCode);
    setShowSuggestions(false);
    fetchZipInfo(suggestion.zipCode);
  };

  const handleIncomeChange = (value: string) => {
    const normalized = value.replace(/[^0-9]/g, "");
    setIncome(normalized);
    setIncomeError(null);
  };

  const handleSubmit = () => {
    const parsedIncome = Number(income);
    const hasIncomeError = Number.isNaN(parsedIncome) || parsedIncome <= 0;
    const hasZipError = !zipcodeRecord || zipCode.length !== 5;

    if (hasZipError) {
      setZipError(t("wizard.householdBasics.errors.zip"));
    }
    if (hasIncomeError) {
      setIncomeError(t("wizard.householdBasics.errors.income"));
    }
    if (hasZipError || hasIncomeError || !zipcodeRecord) {
      return;
    }

    const countySelected = countyOptions.find(
      (option) => option.fips === selectedCounty
    ) ?? { fips: zipcodeRecord.countyFips ?? "", name: zipcodeRecord.countyName ?? "" };

    onSubmit({
      zipCode,
      income: parsedIncome,
      countyFips: countySelected.fips,
      countyName: countySelected.name,
      stateId: zipcodeRecord.stateId,
      stateName: zipcodeRecord.stateName,
      zipcodeRecord,
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <button type="button" className="button button-secondary" onClick={onBack}>
          {t("buttons.back")}
        </button>
      </div>
      <div className="card-body">
        <h3 className="card-title">{t("wizard.householdBasics.title")}</h3>
        <p className="section-helper">
          {t("wizard.householdBasics.helper", {
            household: t(
              `wizard.householdType.options.${householdType.toLowerCase()}`
            ),
          })}
        </p>

        <div className="form-group" ref={suggestionsRef}>
          <label htmlFor="zipCode">{t("wizard.householdBasics.zipCodeLabel")}</label>
          <input
            id="zipCode"
            name="zipCode"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="postal-code"
            value={zipCode}
            onChange={(event) => handleZipChange(event.target.value)}
            onFocus={() => {
              if (zipSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />
          {loadingZipcode && (
            <span className="input-hint">{t("wizard.householdBasics.loadingZip")}</span>
          )}
          {zipError && <span className="form-error">{zipError}</span>}

          {showSuggestions && zipSuggestions.length > 0 && (
            <div className="zip-suggestions">
              {zipSuggestions.map((suggestion) => (
                <button
                  type="button"
                  key={`${suggestion.zipCode}-${suggestion.city}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <strong>{suggestion.zipCode}</strong>
                  <span>
                    {suggestion.city}, {suggestion.stateName}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {countyOptions.length > 0 && (
          <div className="form-group">
            <label htmlFor="countyFips">
              {t("wizard.householdBasics.countyLabel")}
            </label>
            <select
              id="countyFips"
              value={selectedCounty}
              onChange={(event) => setSelectedCounty(event.target.value)}
            >
              {countyOptions.map((option) => (
                <option key={option.fips} value={option.fips}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="householdIncome">
            {t("wizard.householdBasics.incomeLabel")}
          </label>
          <input
            id="householdIncome"
            name="householdIncome"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={income}
            onChange={(event) => handleIncomeChange(event.target.value)}
            placeholder={t("wizard.householdBasics.incomePlaceholder")}
          />
          {incomeError && <span className="form-error">{incomeError}</span>}
        </div>

        {zipcodeRecord && (
          <div className="zip-summary">
            <strong>{zipcodeRecord.city || zipcodeRecord.stateName}</strong>
            <span>{zipcodeRecord.stateId}</span>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={handleSubmit}
          >
            {t("buttons.continue")}
          </button>
        </div>
      </div>
    </div>
  );
};
