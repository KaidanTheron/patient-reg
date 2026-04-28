import { graphql } from "~/graphql";

export const PracticesDocument = graphql(`
  query Practices {
    practices {
      id
      name
    }
  }
`);

export const PracticeRegistrationRequestsDocument = graphql(`
  query PracticeRegistrationRequests {
    practiceRegistrationRequests {
      registrationRequestId
      registrationRequestStatus
      practiceName
      rejectionReason
      patient {
        firstname
        lastname
        email
        phone
      }
      document {
        submittedAt
      }
    }
  }
`);

export const PracticeRegistrationRequestDocument = graphql(`
  query PracticeRegistrationRequest($id: String!) {
    practiceRegistrationRequest(id: $id) {
      registrationRequestId
      registrationRequestStatus
      practiceName
      rejectionReason
      patient {
        firstname
        lastname
        email
        phone
      }
      document {
        submittedAt
        contactDetails {
          email
          phone
          altphone
          address
        }
        personalInformation {
          firstname
          lastname
          dateOfBirth
          gender
        }
        medicalAidDetails {
          scheme
          memberNumber
          mainMember
          mainMemberId
          dependantCode
        }
        medicalHistory {
          allergies
          currentMedication
          chronicConditions
          previousSurgeries
          familyHistory
        }
      }
    }
  }
`);

export const PatientProfileForPracticeDocument = graphql(`
  query PatientProfileForPractice($registrationRequestId: String!) {
    patientProfile(registrationRequestId: $registrationRequestId) {
      contactDetails {
        email
        phone
        altphone
        address
      }
      personalInformation {
        firstname
        lastname
        dateOfBirth
        gender
      }
      medicalAidDetails {
        scheme
        memberNumber
        mainMember
        mainMemberId
        dependantCode
      }
      medicalHistory {
        allergies
        currentMedication
        chronicConditions
        previousSurgeries
        familyHistory
      }
    }
  }
`);

export const InitiateRegistrationDocument = graphql(`
  mutation InitiateRegistration($input: InitiateRegistrationInput!) {
    initiateRegistration(input: $input) {
      registrationRequestId
      registrationRequestStatus
      practiceName
    }
  }
`);

export const ApproveRegistrationDocument = graphql(`
  mutation ApproveRegistration($input: ApproveRegistrationInput!) {
    approveRegistration(input: $input) {
      registrationRequestId
      registrationRequestStatus
      practiceName
    }
  }
`);

export const RejectRegistrationDocument = graphql(`
  mutation RejectRegistration($input: RejectRegistrationInput!) {
    rejectRegistration(input: $input) {
      registrationRequestId
      registrationRequestStatus
      practiceName
      rejectionReason
    }
  }
`);

export const CheckRegistrationLinkValidityDocument = graphql(`
  query CheckRegistrationLinkValidity($token: String!) {
    checkRegistrationLinkValidity(token: $token)
  }
`);

export const VerifyRegistrationDocument = graphql(`
  mutation VerifyRegistration($input: VerifyRegistrationInput!) {
    verifyRegistration(input: $input) {
      success
      sessionToken
      expiresAt
      errorCode
      maxAttempts
      attemptsAfterFailure
    }
  }
`);

export const MyRegistrationRequestsDocument = graphql(`
  query MyRegistrationRequests {
    myRegistrationRequests {
      registrationRequestId
      registrationRequestStatus
      practiceName
      rejectionReason
    }
  }
`);

export const MyRegistrationRequestDocument = graphql(`
  query MyRegistrationRequest($id: String!) {
    myRegistrationRequest(id: $id) {
      registrationRequestId
      registrationRequestStatus
      practiceName
      rejectionReason
      document {
        submittedAt
        contactDetails {
          email
          phone
          altphone
          address
        }
        personalInformation {
          firstname
          lastname
          dateOfBirth
          gender
        }
        medicalAidDetails {
          scheme
          memberNumber
          mainMember
          mainMemberId
          dependantCode
        }
        medicalHistory {
          allergies
          currentMedication
          chronicConditions
          previousSurgeries
          familyHistory
        }
      }
    }
  }
`);

export const MyPatientProfileDocument = graphql(`
  query MyPatientProfile {
    myPatientProfile {
      contactDetails {
        email
        phone
        altphone
        address
      }
      personalInformation {
        firstname
        lastname
        dateOfBirth
        gender
      }
      medicalAidDetails {
        scheme
        memberNumber
        mainMember
        mainMemberId
        dependantCode
      }
      medicalHistory {
        allergies
        currentMedication
        chronicConditions
        previousSurgeries
        familyHistory
      }
    }
  }
`);

export const DateOfBirthFromRsaIdDocument = graphql(`
  query DateOfBirthFromRsaId($rsaId: String!) {
    dateOfBirthFromRsaId(rsaId: $rsaId)
  }
`);

export const GenderFromRsaIdDocument = graphql(`
  query GenderFromRsaId($rsaId: String!) {
    genderFromRsaId(rsaId: $rsaId)
  }
`);

export const RegistrationConsentTemplateDocument = graphql(`
  query RegistrationConsentTemplate($registrationRequestId: String!) {
    registrationConsentTemplate(registrationRequestId: $registrationRequestId) {
      text
      version
      consentType
    }
  }
`);

export const MyConsentRecordDocument = graphql(`
  query MyConsentRecord($registrationRequestId: String!) {
    myConsentRecord(registrationRequestId: $registrationRequestId) {
      givenAt
    }
  }
`);

export const GiveConsentDocument = graphql(`
  mutation GiveConsent($registrationRequestId: String!) {
    giveConsent(registrationRequestId: $registrationRequestId) {
      givenAt
    }
  }
`);

export const SubmitRegistrationDocument = graphql(`
  mutation SubmitRegistrationDocument($input: SubmitRegistrationDocumentInput!) {
    submitRegistrationDocument(input: $input) {
      registrationRequestId
      registrationRequestStatus
      practiceName
    }
  }
`);
