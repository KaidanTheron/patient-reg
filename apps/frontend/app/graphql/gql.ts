/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query Practices {\n    practices {\n      id\n      name\n    }\n  }\n": typeof types.PracticesDocument,
    "\n  query PracticeRegistrationRequests {\n    practiceRegistrationRequests {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n      patient {\n        firstname\n        lastname\n        email\n        phone\n      }\n      document {\n        submittedAt\n      }\n    }\n  }\n": typeof types.PracticeRegistrationRequestsDocument,
    "\n  query PracticeRegistrationRequest($id: String!) {\n    practiceRegistrationRequest(id: $id) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n      patient {\n        firstname\n        lastname\n        email\n        phone\n      }\n      document {\n        submittedAt\n        contactDetails {\n          email\n          phone\n          altphone\n          address\n        }\n        personalInformation {\n          firstname\n          lastname\n          dateOfBirth\n          gender\n        }\n        medicalAidDetails {\n          scheme\n          memberNumber\n          mainMember\n          mainMemberId\n          dependantCode\n        }\n        medicalHistory {\n          allergies\n          currentMedication\n          chronicConditions\n          previousSurgeries\n          familyHistory\n        }\n      }\n    }\n  }\n": typeof types.PracticeRegistrationRequestDocument,
    "\n  query PatientProfileForPractice($registrationRequestId: String!) {\n    patientProfile(registrationRequestId: $registrationRequestId) {\n      contactDetails {\n        email\n        phone\n        altphone\n        address\n      }\n      personalInformation {\n        firstname\n        lastname\n        dateOfBirth\n        gender\n      }\n      medicalAidDetails {\n        scheme\n        memberNumber\n        mainMember\n        mainMemberId\n        dependantCode\n      }\n      medicalHistory {\n        allergies\n        currentMedication\n        chronicConditions\n        previousSurgeries\n        familyHistory\n      }\n    }\n  }\n": typeof types.PatientProfileForPracticeDocument,
    "\n  mutation InitiateRegistration($input: InitiateRegistrationInput!) {\n    initiateRegistration(input: $input) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n    }\n  }\n": typeof types.InitiateRegistrationDocument,
    "\n  mutation ApproveRegistration($input: ApproveRegistrationInput!) {\n    approveRegistration(input: $input) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n    }\n  }\n": typeof types.ApproveRegistrationDocument,
    "\n  mutation RejectRegistration($input: RejectRegistrationInput!) {\n    rejectRegistration(input: $input) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n    }\n  }\n": typeof types.RejectRegistrationDocument,
    "\n  query CheckRegistrationLinkValidity($token: String!) {\n    checkRegistrationLinkValidity(token: $token)\n  }\n": typeof types.CheckRegistrationLinkValidityDocument,
    "\n  mutation VerifyRegistration($input: VerifyRegistrationInput!) {\n    verifyRegistration(input: $input) {\n      success\n      sessionToken\n      expiresAt\n      errorCode\n      maxAttempts\n      attemptsAfterFailure\n    }\n  }\n": typeof types.VerifyRegistrationDocument,
    "\n  query MyRegistrationRequests {\n    myRegistrationRequests {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n    }\n  }\n": typeof types.MyRegistrationRequestsDocument,
    "\n  query MyRegistrationRequest($id: String!) {\n    myRegistrationRequest(id: $id) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n      document {\n        submittedAt\n        contactDetails {\n          email\n          phone\n          altphone\n          address\n        }\n        personalInformation {\n          firstname\n          lastname\n          dateOfBirth\n          gender\n        }\n        medicalAidDetails {\n          scheme\n          memberNumber\n          mainMember\n          mainMemberId\n          dependantCode\n        }\n        medicalHistory {\n          allergies\n          currentMedication\n          chronicConditions\n          previousSurgeries\n          familyHistory\n        }\n      }\n    }\n  }\n": typeof types.MyRegistrationRequestDocument,
    "\n  query MyPatientProfile {\n    myPatientProfile {\n      contactDetails {\n        email\n        phone\n        altphone\n        address\n      }\n      personalInformation {\n        firstname\n        lastname\n        dateOfBirth\n        gender\n      }\n      medicalAidDetails {\n        scheme\n        memberNumber\n        mainMember\n        mainMemberId\n        dependantCode\n      }\n      medicalHistory {\n        allergies\n        currentMedication\n        chronicConditions\n        previousSurgeries\n        familyHistory\n      }\n    }\n  }\n": typeof types.MyPatientProfileDocument,
    "\n  query DateOfBirthFromRsaId($rsaId: String!) {\n    dateOfBirthFromRsaId(rsaId: $rsaId)\n  }\n": typeof types.DateOfBirthFromRsaIdDocument,
    "\n  query GenderFromRsaId($rsaId: String!) {\n    genderFromRsaId(rsaId: $rsaId)\n  }\n": typeof types.GenderFromRsaIdDocument,
    "\n  query RegistrationConsentTemplate($registrationRequestId: String!) {\n    registrationConsentTemplate(registrationRequestId: $registrationRequestId) {\n      text\n      version\n      consentType\n    }\n  }\n": typeof types.RegistrationConsentTemplateDocument,
    "\n  query MyConsentRecord($registrationRequestId: String!) {\n    myConsentRecord(registrationRequestId: $registrationRequestId) {\n      givenAt\n    }\n  }\n": typeof types.MyConsentRecordDocument,
    "\n  mutation GiveConsent($registrationRequestId: String!) {\n    giveConsent(registrationRequestId: $registrationRequestId) {\n      givenAt\n    }\n  }\n": typeof types.GiveConsentDocument,
    "\n  mutation SubmitRegistrationDocument($input: SubmitRegistrationDocumentInput!) {\n    submitRegistrationDocument(input: $input) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n    }\n  }\n": typeof types.SubmitRegistrationDocumentDocument,
};
const documents: Documents = {
    "\n  query Practices {\n    practices {\n      id\n      name\n    }\n  }\n": types.PracticesDocument,
    "\n  query PracticeRegistrationRequests {\n    practiceRegistrationRequests {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n      patient {\n        firstname\n        lastname\n        email\n        phone\n      }\n      document {\n        submittedAt\n      }\n    }\n  }\n": types.PracticeRegistrationRequestsDocument,
    "\n  query PracticeRegistrationRequest($id: String!) {\n    practiceRegistrationRequest(id: $id) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n      patient {\n        firstname\n        lastname\n        email\n        phone\n      }\n      document {\n        submittedAt\n        contactDetails {\n          email\n          phone\n          altphone\n          address\n        }\n        personalInformation {\n          firstname\n          lastname\n          dateOfBirth\n          gender\n        }\n        medicalAidDetails {\n          scheme\n          memberNumber\n          mainMember\n          mainMemberId\n          dependantCode\n        }\n        medicalHistory {\n          allergies\n          currentMedication\n          chronicConditions\n          previousSurgeries\n          familyHistory\n        }\n      }\n    }\n  }\n": types.PracticeRegistrationRequestDocument,
    "\n  query PatientProfileForPractice($registrationRequestId: String!) {\n    patientProfile(registrationRequestId: $registrationRequestId) {\n      contactDetails {\n        email\n        phone\n        altphone\n        address\n      }\n      personalInformation {\n        firstname\n        lastname\n        dateOfBirth\n        gender\n      }\n      medicalAidDetails {\n        scheme\n        memberNumber\n        mainMember\n        mainMemberId\n        dependantCode\n      }\n      medicalHistory {\n        allergies\n        currentMedication\n        chronicConditions\n        previousSurgeries\n        familyHistory\n      }\n    }\n  }\n": types.PatientProfileForPracticeDocument,
    "\n  mutation InitiateRegistration($input: InitiateRegistrationInput!) {\n    initiateRegistration(input: $input) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n    }\n  }\n": types.InitiateRegistrationDocument,
    "\n  mutation ApproveRegistration($input: ApproveRegistrationInput!) {\n    approveRegistration(input: $input) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n    }\n  }\n": types.ApproveRegistrationDocument,
    "\n  mutation RejectRegistration($input: RejectRegistrationInput!) {\n    rejectRegistration(input: $input) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n    }\n  }\n": types.RejectRegistrationDocument,
    "\n  query CheckRegistrationLinkValidity($token: String!) {\n    checkRegistrationLinkValidity(token: $token)\n  }\n": types.CheckRegistrationLinkValidityDocument,
    "\n  mutation VerifyRegistration($input: VerifyRegistrationInput!) {\n    verifyRegistration(input: $input) {\n      success\n      sessionToken\n      expiresAt\n      errorCode\n      maxAttempts\n      attemptsAfterFailure\n    }\n  }\n": types.VerifyRegistrationDocument,
    "\n  query MyRegistrationRequests {\n    myRegistrationRequests {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n    }\n  }\n": types.MyRegistrationRequestsDocument,
    "\n  query MyRegistrationRequest($id: String!) {\n    myRegistrationRequest(id: $id) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n      document {\n        submittedAt\n        contactDetails {\n          email\n          phone\n          altphone\n          address\n        }\n        personalInformation {\n          firstname\n          lastname\n          dateOfBirth\n          gender\n        }\n        medicalAidDetails {\n          scheme\n          memberNumber\n          mainMember\n          mainMemberId\n          dependantCode\n        }\n        medicalHistory {\n          allergies\n          currentMedication\n          chronicConditions\n          previousSurgeries\n          familyHistory\n        }\n      }\n    }\n  }\n": types.MyRegistrationRequestDocument,
    "\n  query MyPatientProfile {\n    myPatientProfile {\n      contactDetails {\n        email\n        phone\n        altphone\n        address\n      }\n      personalInformation {\n        firstname\n        lastname\n        dateOfBirth\n        gender\n      }\n      medicalAidDetails {\n        scheme\n        memberNumber\n        mainMember\n        mainMemberId\n        dependantCode\n      }\n      medicalHistory {\n        allergies\n        currentMedication\n        chronicConditions\n        previousSurgeries\n        familyHistory\n      }\n    }\n  }\n": types.MyPatientProfileDocument,
    "\n  query DateOfBirthFromRsaId($rsaId: String!) {\n    dateOfBirthFromRsaId(rsaId: $rsaId)\n  }\n": types.DateOfBirthFromRsaIdDocument,
    "\n  query GenderFromRsaId($rsaId: String!) {\n    genderFromRsaId(rsaId: $rsaId)\n  }\n": types.GenderFromRsaIdDocument,
    "\n  query RegistrationConsentTemplate($registrationRequestId: String!) {\n    registrationConsentTemplate(registrationRequestId: $registrationRequestId) {\n      text\n      version\n      consentType\n    }\n  }\n": types.RegistrationConsentTemplateDocument,
    "\n  query MyConsentRecord($registrationRequestId: String!) {\n    myConsentRecord(registrationRequestId: $registrationRequestId) {\n      givenAt\n    }\n  }\n": types.MyConsentRecordDocument,
    "\n  mutation GiveConsent($registrationRequestId: String!) {\n    giveConsent(registrationRequestId: $registrationRequestId) {\n      givenAt\n    }\n  }\n": types.GiveConsentDocument,
    "\n  mutation SubmitRegistrationDocument($input: SubmitRegistrationDocumentInput!) {\n    submitRegistrationDocument(input: $input) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n    }\n  }\n": types.SubmitRegistrationDocumentDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Practices {\n    practices {\n      id\n      name\n    }\n  }\n"): typeof import('./graphql').PracticesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PracticeRegistrationRequests {\n    practiceRegistrationRequests {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n      patient {\n        firstname\n        lastname\n        email\n        phone\n      }\n      document {\n        submittedAt\n      }\n    }\n  }\n"): typeof import('./graphql').PracticeRegistrationRequestsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PracticeRegistrationRequest($id: String!) {\n    practiceRegistrationRequest(id: $id) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n      patient {\n        firstname\n        lastname\n        email\n        phone\n      }\n      document {\n        submittedAt\n        contactDetails {\n          email\n          phone\n          altphone\n          address\n        }\n        personalInformation {\n          firstname\n          lastname\n          dateOfBirth\n          gender\n        }\n        medicalAidDetails {\n          scheme\n          memberNumber\n          mainMember\n          mainMemberId\n          dependantCode\n        }\n        medicalHistory {\n          allergies\n          currentMedication\n          chronicConditions\n          previousSurgeries\n          familyHistory\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').PracticeRegistrationRequestDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PatientProfileForPractice($registrationRequestId: String!) {\n    patientProfile(registrationRequestId: $registrationRequestId) {\n      contactDetails {\n        email\n        phone\n        altphone\n        address\n      }\n      personalInformation {\n        firstname\n        lastname\n        dateOfBirth\n        gender\n      }\n      medicalAidDetails {\n        scheme\n        memberNumber\n        mainMember\n        mainMemberId\n        dependantCode\n      }\n      medicalHistory {\n        allergies\n        currentMedication\n        chronicConditions\n        previousSurgeries\n        familyHistory\n      }\n    }\n  }\n"): typeof import('./graphql').PatientProfileForPracticeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InitiateRegistration($input: InitiateRegistrationInput!) {\n    initiateRegistration(input: $input) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n    }\n  }\n"): typeof import('./graphql').InitiateRegistrationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ApproveRegistration($input: ApproveRegistrationInput!) {\n    approveRegistration(input: $input) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n    }\n  }\n"): typeof import('./graphql').ApproveRegistrationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RejectRegistration($input: RejectRegistrationInput!) {\n    rejectRegistration(input: $input) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n    }\n  }\n"): typeof import('./graphql').RejectRegistrationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CheckRegistrationLinkValidity($token: String!) {\n    checkRegistrationLinkValidity(token: $token)\n  }\n"): typeof import('./graphql').CheckRegistrationLinkValidityDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyRegistration($input: VerifyRegistrationInput!) {\n    verifyRegistration(input: $input) {\n      success\n      sessionToken\n      expiresAt\n      errorCode\n      maxAttempts\n      attemptsAfterFailure\n    }\n  }\n"): typeof import('./graphql').VerifyRegistrationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyRegistrationRequests {\n    myRegistrationRequests {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n    }\n  }\n"): typeof import('./graphql').MyRegistrationRequestsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyRegistrationRequest($id: String!) {\n    myRegistrationRequest(id: $id) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n      rejectionReason\n      document {\n        submittedAt\n        contactDetails {\n          email\n          phone\n          altphone\n          address\n        }\n        personalInformation {\n          firstname\n          lastname\n          dateOfBirth\n          gender\n        }\n        medicalAidDetails {\n          scheme\n          memberNumber\n          mainMember\n          mainMemberId\n          dependantCode\n        }\n        medicalHistory {\n          allergies\n          currentMedication\n          chronicConditions\n          previousSurgeries\n          familyHistory\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').MyRegistrationRequestDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyPatientProfile {\n    myPatientProfile {\n      contactDetails {\n        email\n        phone\n        altphone\n        address\n      }\n      personalInformation {\n        firstname\n        lastname\n        dateOfBirth\n        gender\n      }\n      medicalAidDetails {\n        scheme\n        memberNumber\n        mainMember\n        mainMemberId\n        dependantCode\n      }\n      medicalHistory {\n        allergies\n        currentMedication\n        chronicConditions\n        previousSurgeries\n        familyHistory\n      }\n    }\n  }\n"): typeof import('./graphql').MyPatientProfileDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DateOfBirthFromRsaId($rsaId: String!) {\n    dateOfBirthFromRsaId(rsaId: $rsaId)\n  }\n"): typeof import('./graphql').DateOfBirthFromRsaIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GenderFromRsaId($rsaId: String!) {\n    genderFromRsaId(rsaId: $rsaId)\n  }\n"): typeof import('./graphql').GenderFromRsaIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RegistrationConsentTemplate($registrationRequestId: String!) {\n    registrationConsentTemplate(registrationRequestId: $registrationRequestId) {\n      text\n      version\n      consentType\n    }\n  }\n"): typeof import('./graphql').RegistrationConsentTemplateDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyConsentRecord($registrationRequestId: String!) {\n    myConsentRecord(registrationRequestId: $registrationRequestId) {\n      givenAt\n    }\n  }\n"): typeof import('./graphql').MyConsentRecordDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GiveConsent($registrationRequestId: String!) {\n    giveConsent(registrationRequestId: $registrationRequestId) {\n      givenAt\n    }\n  }\n"): typeof import('./graphql').GiveConsentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SubmitRegistrationDocument($input: SubmitRegistrationDocumentInput!) {\n    submitRegistrationDocument(input: $input) {\n      registrationRequestId\n      registrationRequestStatus\n      practiceName\n    }\n  }\n"): typeof import('./graphql').SubmitRegistrationDocumentDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
