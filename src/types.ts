import { IPMemberInfoQuote } from "./gql/types/IPMemberInfoQuote";
import { ZipcodeByZip } from "./gql/types/IResponseZipCode";

export interface Plan {
  id: string;
  name: string;
  carrier: string;
  monthlyPremium: number;
  deductible: number;
  outOfPocketMax: number;
  summary: string;
  coverageHighlights: string[];
}

export interface PrimaryApplicantForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  message: string;
}
