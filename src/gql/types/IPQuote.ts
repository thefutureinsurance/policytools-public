import { IPMemberInfoQuote } from "./IPMemberInfoQuote";
import { ZipcodeByZip } from "./IResponseZipCode";

export interface PublicQuoteFormState {
  zipCode: string | null;
  zipcodeByZip: ZipcodeByZip | null;
  householdIncome: number | null;
  householdIncomeTxt: string;
  memberQuantity: number;
  members: IPMemberInfoQuote[];
}
