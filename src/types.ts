export interface HouseholdMember {
  age: number;
  female: boolean;
}

export interface HouseholdFormValues {
  zipCode: string;
  householdIncome: number;
  memberQuantity: number;
  members: HouseholdMember[];
}

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
}
