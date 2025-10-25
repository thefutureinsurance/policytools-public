import { gql } from "@apollo/client";

export const PUBLIC_START_LEAD = gql`
  mutation PublicStartLead(
    $token: String!
    $household: PublicHouseholdInput!
    $primary: PublicPrimaryInput!
    $members: [PublicHouseholdMemberInput!]
    $context: PublicLeadContextInput
    $observations: String
  ) {
    publicStartLead(
      token: $token
      household: $household
      primary: $primary
      members: $members
      context: $context
      observations: $observations
    ) {
      success
      leadId
      metadata
      errors {
        field
        message
      }
    }
  }
`;

export const PUBLIC_UPDATE_HOUSEHOLD = gql`
  mutation PublicUpdateHousehold(
    $token: String!
    $leadId: ID!
    $household: PublicHouseholdInput
    $members: [PublicHouseholdMemberInput!]
    $wizardStep: String
  ) {
    publicUpdateHousehold(
      token: $token
      leadId: $leadId
      household: $household
      members: $members
      wizardStep: $wizardStep
    ) {
      success
      metadata
      errors {
        field
        message
      }
    }
  }
`;

export const PUBLIC_CONFIRM_PLAN = gql`
  mutation PublicConfirmPlan(
    $token: String!
    $leadId: ID!
    $planSelection: PublicPlanSelectionInput!
    $planResults: PublicPlanResultsInput
    $signatureFormId: String
    $agentId: String
    $sendEmail: Boolean
    $sendSms: Boolean
    $getSigningLink: Boolean
  ) {
    publicConfirmPlan(
      token: $token
      leadId: $leadId
      planSelection: $planSelection
      planResults: $planResults
      signatureFormId: $signatureFormId
      agentId: $agentId
      sendEmail: $sendEmail
      sendSms: $sendSms
      getSigningLink: $getSigningLink
    ) {
      success
      metadata
      signingLink
      errors {
        field
        message
      }
    }
  }
`;

export const PUBLIC_CHECK_CONSENT = gql`
  mutation PublicCheckConsent($token: String!, $leadId: ID!) {
    publicCheckConsent(token: $token, leadId: $leadId) {
      success
      status
      metadata
      errors {
        field
        message
      }
    }
  }
`;

export const PUBLIC_LEAD = gql`
  query PublicLead($token: String!, $leadId: ID!) {
    publicLead(token: $token, leadId: $leadId)
  }
`;

export const PUBLIC_SIGNATURE_STATUS = gql`
  query PublicSignatureStatus($token: String!, $leadId: ID!) {
    publicSignatureStatus(token: $token, leadId: $leadId)
  }
`;
