import React, { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { ApolloProvider } from "@apollo/client/react";
import App from "./App";
import {
  I18nProvider,
  SUPPORTED_LANGUAGES,
  useTranslation,
} from "./i18n/I18nProvider";
import client from "./apolloClient";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Language } from "./i18n/translations";

const isSupportedLanguage = (value: string | undefined): value is Language => {
  return (
    value !== undefined &&
    SUPPORTED_LANGUAGES.includes(value as Language)
  );
};

const LanguageGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { lang } = useParams<{ lang?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useTranslation();

  const languageRef = useRef(language);
  const pendingLanguageFromRoute = useRef<Language | null>(null);

  useEffect(() => {
    languageRef.current = language;
    if (pendingLanguageFromRoute.current === language) {
      pendingLanguageFromRoute.current = null;
    }
  }, [language]);

  const routeLanguage = useMemo(
    () => (isSupportedLanguage(lang) ? (lang as Language) : undefined),
    [lang]
  );

  useEffect(() => {
    if (!routeLanguage) {
      return;
    }
    if (languageRef.current !== routeLanguage) {
      pendingLanguageFromRoute.current = routeLanguage;
      setLanguage(routeLanguage);
    }
  }, [routeLanguage, setLanguage]);

  const remainderPath = useMemo(() => {
    const match = location.pathname.match(/^\/[^/]+(.*)$/);
    return match ? match[1] : "";
  }, [location.pathname]);

  useEffect(() => {
    if (!routeLanguage) {
      const target = language;
      const destination = `/${target}${remainderPath}${location.search}${location.hash}`;
      if (destination !== location.pathname + location.search + location.hash) {
        navigate(destination, { replace: true });
      }
      return;
    }

    if (
      language !== routeLanguage &&
      pendingLanguageFromRoute.current === null
    ) {
      const destination = `/${language}${remainderPath}${location.search}${location.hash}`;
      if (destination !== location.pathname + location.search + location.hash) {
        navigate(destination, { replace: true });
      }
    }
  }, [
    language,
    routeLanguage,
    remainderPath,
    location.pathname,
    location.search,
    location.hash,
    navigate,
  ]);

  if (!routeLanguage || language !== routeLanguage) {
    return null;
  }

  return <>{children}</>;
};

const FallbackRedirect: React.FC = () => {
  const { language } = useTranslation();
  return <Navigate to={`/${language}`} replace />;
};

const initialLanguage =
  typeof window !== "undefined"
    ? (() => {
        const segments = window.location.pathname.split("/").filter(Boolean);
        const maybeLanguage = segments[0] as string | undefined;
        return isSupportedLanguage(maybeLanguage)
          ? (maybeLanguage as Language)
          : undefined;
      })()
    : undefined;

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <I18nProvider initialLanguage={initialLanguage}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/:lang/*"
              element={
                <LanguageGate>
                  <App />
                </LanguageGate>
              }
            />
            <Route path="*" element={<FallbackRedirect />} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </ApolloProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
