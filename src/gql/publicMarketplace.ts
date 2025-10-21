import { gql } from "@apollo/client";

export const PUBLIC_MARKETPLACE_2 = gql`
  query PublicMarketplace2(
    $token: String!
    $queryType: MarketplaceEnum!
    $year: Int!
    $householdIncome: Int
    $people: [PersonInput]
    $effectiveDate: String
    $hasMarriedCouple: Boolean
    $countyfips: String
    $state: String
    $zipCode: String
    $market: String
    $planIds: [String]
    $aptcOverride: Int
    $csrOverride: String
    $catastrophicOverride: Boolean
    $numberOfMembers: Int
    $limit: Int
    $offset: Int
    $order: String
    $premiumMin: Float
    $premiumMax: Float
    $deductibleMin: Float
    $deductibleMax: Float
    $metalLevels: [String]
    $issuers: [String]
    $diseaseMgmtPrograms: [String]
    $planTypes: [String]
    $childDentalCoverage: Boolean
    $adultDentalCoverage: Boolean
    $hsaEligible: Boolean
    $simpleChoice: Boolean
    $qualityRating: Int
    $drugs: [String]
    $providers: [String]
  ) {
    publicMarketplace2(
      token: $token
      queryType: $queryType
      year: $year
      householdIncome: $householdIncome
      people: $people
      effectiveDate: $effectiveDate
      hasMarriedCouple: $hasMarriedCouple
      countyfips: $countyfips
      state: $state
      zipCode: $zipCode
      market: $market
      planIds: $planIds
      aptcOverride: $aptcOverride
      csrOverride: $csrOverride
      catastrophicOverride: $catastrophicOverride
      numberOfMembers: $numberOfMembers
      limit: $limit
      offset: $offset
      order: $order
      premiumMin: $premiumMin
      premiumMax: $premiumMax
      deductibleMin: $deductibleMin
      deductibleMax: $deductibleMax
      metalLevels: $metalLevels
      issuers: $issuers
      diseaseMgmtPrograms: $diseaseMgmtPrograms
      planTypes: $planTypes
      childDentalCoverage: $childDentalCoverage
      adultDentalCoverage: $adultDentalCoverage
      hsaEligible: $hsaEligible
      simpleChoice: $simpleChoice
      qualityRating: $qualityRating
      drugs: $drugs
      providers: $providers
    )
  }
`;
