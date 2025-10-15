import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { ApolloProvider } from '@apollo/client/react';
import App from "./App";
import { I18nProvider } from "./i18n/I18nProvider";
import client from "./apolloClient";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ApolloProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
