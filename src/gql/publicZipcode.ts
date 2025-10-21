import { gql } from "@apollo/client";

export const PUBLIC_ZIPCODE_BY_ZIP = gql`
  query PublicZipcodeByZip($zipCode: String!, $token: String!) {
    publicZipcodeByZip(zipCode: $zipCode, token: $token) {
      id
      zipCode
      stateId
      stateName
      city
      countyFips
      countyName
      countyNamesAll
      countyFipsAll
    }
  }
`;

export const PUBLIC_ZIPCODE_SUGGESTIONS = gql`
  query PublicZipcodeSuggestions(
    $prefix: String!
    $token: String!
    $limit: Int
  ) {
    publicZipcodeSuggestions(
      prefix: $prefix
      token: $token
      limit: $limit
    ) {
      id
      zipCode
      city
      stateId
      stateName
    }
  }
`;
