export interface MarketplaceValidationError {
  error?: string;
}

export interface MarketplaceError {
  message?: string;
}

export interface MarketplacePlanBenefit {
  name?: string;
  covered?: boolean;
}

export interface MarketplacePlanIssuer {
  name?: string;
}

export interface MarketplacePlanDeductible {
  amount?: number;
}

export interface MarketplacePlanMoop {
  amount?: number;
}

export interface MarketplacePlanDeductiblesPerson {
  combined?: {
    amount?: number;
  };
}

export interface MarketplacePlan {
  id: string;
  name: string;
  metal_level?: string;
  type?: string;
  issuer?: MarketplacePlanIssuer;
  premium?: number;
  premium_w_credit?: number;
  aptc_eligible_premium?: number;
  deductibles?: MarketplacePlanDeductible[];
  deductibles_person?: MarketplacePlanDeductiblesPerson;
  moops?: MarketplacePlanMoop[];
  moops_person?: MarketplacePlanMoop;
  benefits?: MarketplacePlanBenefit[];
}

export interface MarketplaceResponse {
  plans?: MarketplacePlan[];
  validation_errors?: MarketplaceValidationError[];
  error?: MarketplaceError;
}
