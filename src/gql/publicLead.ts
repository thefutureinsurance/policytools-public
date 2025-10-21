import { gql } from "@apollo/client";

export const PUBLIC_CREATE_LEAD = gql`
  mutation PublicCreateLead(
    $token: String!
    $leadData: lead_input!
    $signatureFormId: String
    $agentId: String
    $sendEmail: Boolean
    $sendSms: Boolean
    $getSigningLink: Boolean
  ) {
    publicCreateLead(
      token: $token
      leadData: $leadData
      signatureFormId: $signatureFormId
      agentId: $agentId
      sendEmail: $sendEmail
      sendSms: $sendSms
      getSigningLink: $getSigningLink
    ) {
      success
      leadId
      signingLink
      errors {
        field
        message
      }
    }
  }
`;
