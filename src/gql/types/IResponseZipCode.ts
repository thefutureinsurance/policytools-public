export interface PublicZipcodeResponse {
  publicZipcodeByZip: ZipcodeByZip | null;
}

export interface ZipcodeByZip {
  id: string;
  zipCode: string;
  stateId: string;
  stateName: string;
  city?: string;
  countyFips: string;
  countyName: string;
  countyNamesAll: string;
  countyFipsAll: string;
}

export interface ZipcodeSuggestion {
  id: string;
  zipCode: string;
  city: string;
  stateId: string;
  stateName: string;
}

export interface PublicZipcodeSuggestionsResponse {
  publicZipcodeSuggestions: ZipcodeSuggestion[];
}
