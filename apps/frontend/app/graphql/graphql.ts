/* eslint-disable */
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any; }
};

export type ApproveRegistrationInput = {
  approvedByStaffId: Scalars['String']['input'];
  registrationRequestId: Scalars['String']['input'];
};

export type ConsentRecordPayload = {
  __typename?: 'ConsentRecordPayload';
  consentTemplateId: Scalars['String']['output'];
  givenAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  registrationRequestId: Scalars['String']['output'];
};

export type ConsentTemplatePayload = {
  __typename?: 'ConsentTemplatePayload';
  consentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  text: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

export type ContactDetailsInput = {
  altphone?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  residentialAddress?: InputMaybe<Scalars['String']['input']>;
};

export type ContactDetailsPayload = {
  __typename?: 'ContactDetailsPayload';
  address?: Maybe<Scalars['String']['output']>;
  altphone?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
};

export type InitiateRegistrationInput = {
  initiatedByStaffId: Scalars['String']['input'];
  practiceId: Scalars['String']['input'];
  rsaId: Scalars['String']['input'];
};

export type MedicalAidDetailsInput = {
  dependantCode?: InputMaybe<Scalars['String']['input']>;
  mainMember?: InputMaybe<Scalars['String']['input']>;
  mainMemberId?: InputMaybe<Scalars['String']['input']>;
  memberNumber?: InputMaybe<Scalars['String']['input']>;
  scheme?: InputMaybe<Scalars['String']['input']>;
};

export type MedicalAidDetailsPayload = {
  __typename?: 'MedicalAidDetailsPayload';
  dependantCode?: Maybe<Scalars['String']['output']>;
  mainMember?: Maybe<Scalars['String']['output']>;
  mainMemberId?: Maybe<Scalars['String']['output']>;
  memberNumber?: Maybe<Scalars['String']['output']>;
  scheme?: Maybe<Scalars['String']['output']>;
};

export type MedicalHistoryInput = {
  allergies?: InputMaybe<Scalars['String']['input']>;
  chronicConditions?: InputMaybe<Scalars['String']['input']>;
  currentMedication?: InputMaybe<Scalars['String']['input']>;
  familyHistory?: InputMaybe<Scalars['String']['input']>;
  previousSurgeries?: InputMaybe<Scalars['String']['input']>;
};

export type MedicalHistoryPayload = {
  __typename?: 'MedicalHistoryPayload';
  allergies?: Maybe<Scalars['String']['output']>;
  chronicConditions?: Maybe<Scalars['String']['output']>;
  currentMedication?: Maybe<Scalars['String']['output']>;
  familyHistory?: Maybe<Scalars['String']['output']>;
  previousSurgeries?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  approveRegistration: RegistrationRequestPayload;
  /** Records the patient's consent for a registration request. Idempotent — safe to call more than once. */
  giveConsent: ConsentRecordPayload;
  initiateRegistration: RegistrationRequestPayload;
  rejectRegistration: RegistrationRequestPayload;
  submitRegistrationDocument: RegistrationRequestPayload;
  verifyRegistration: VerifyRegistrationPayload;
};


export type MutationApproveRegistrationArgs = {
  input: ApproveRegistrationInput;
};


export type MutationGiveConsentArgs = {
  registrationRequestId: Scalars['String']['input'];
};


export type MutationInitiateRegistrationArgs = {
  input: InitiateRegistrationInput;
};


export type MutationRejectRegistrationArgs = {
  input: RejectRegistrationInput;
};


export type MutationSubmitRegistrationDocumentArgs = {
  input: SubmitRegistrationDocumentInput;
};


export type MutationVerifyRegistrationArgs = {
  input: VerifyRegistrationInput;
};

export type PatientIdentityPayload = {
  __typename?: 'PatientIdentityPayload';
  email?: Maybe<Scalars['String']['output']>;
  firstname?: Maybe<Scalars['String']['output']>;
  lastname?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
};

export type PatientProfilePayload = {
  __typename?: 'PatientProfilePayload';
  contactDetails?: Maybe<ContactDetailsPayload>;
  medicalAidDetails?: Maybe<MedicalAidDetailsPayload>;
  medicalHistory?: Maybe<MedicalHistoryPayload>;
  personalInformation?: Maybe<PersonalInformationPayload>;
};

export type PersonalInformationInput = {
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  firstname?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Scalars['String']['input']>;
  lastname?: InputMaybe<Scalars['String']['input']>;
};

export type PersonalInformationPayload = {
  __typename?: 'PersonalInformationPayload';
  dateOfBirth?: Maybe<Scalars['String']['output']>;
  firstname?: Maybe<Scalars['String']['output']>;
  gender?: Maybe<Scalars['String']['output']>;
  lastname?: Maybe<Scalars['String']['output']>;
};

export type PracticePayload = {
  __typename?: 'PracticePayload';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Returns true if the registration link token is valid, not expired, and not revoked. */
  checkRegistrationLinkValidity: Scalars['Boolean']['output'];
  /** ISO-8601 date (YYYY-MM-DD) derived from the RSA ID, for form UX. */
  dateOfBirthFromRsaId: Scalars['String']['output'];
  /** Gender ("MALE" or "FEMALE") derived from the RSA ID, for form UX. */
  genderFromRsaId: Scalars['String']['output'];
  /** Returns the existing consent record for a registration request, or null if consent has not yet been given. */
  myConsentRecord?: Maybe<ConsentRecordPayload>;
  myPatientProfile: PatientProfilePayload;
  myRegistrationRequest: RegistrationRequestPayload;
  myRegistrationRequests: Array<RegistrationRequestPayload>;
  patientProfile: PatientProfilePayload;
  practice?: Maybe<PracticePayload>;
  practiceRegistrationRequest: RegistrationRequestPayload;
  practiceRegistrationRequests: Array<RegistrationRequestPayload>;
  practices: Array<PracticePayload>;
  /** Returns the active consent template the patient must agree to before submitting registration. */
  registrationConsentTemplate: ConsentTemplatePayload;
};


export type QueryCheckRegistrationLinkValidityArgs = {
  token: Scalars['String']['input'];
};


export type QueryDateOfBirthFromRsaIdArgs = {
  rsaId: Scalars['String']['input'];
};


export type QueryGenderFromRsaIdArgs = {
  rsaId: Scalars['String']['input'];
};


export type QueryMyConsentRecordArgs = {
  registrationRequestId: Scalars['String']['input'];
};


export type QueryMyRegistrationRequestArgs = {
  id: Scalars['String']['input'];
};


export type QueryPatientProfileArgs = {
  registrationRequestId: Scalars['String']['input'];
};


export type QueryPracticeArgs = {
  id: Scalars['String']['input'];
};


export type QueryPracticeRegistrationRequestArgs = {
  id: Scalars['String']['input'];
};


export type QueryRegistrationConsentTemplateArgs = {
  registrationRequestId: Scalars['String']['input'];
};

export type RegistrationDocumentPayload = {
  __typename?: 'RegistrationDocumentPayload';
  contactDetails?: Maybe<ContactDetailsPayload>;
  id: Scalars['String']['output'];
  medicalAidDetails?: Maybe<MedicalAidDetailsPayload>;
  medicalHistory?: Maybe<MedicalHistoryPayload>;
  patientIdentityId: Scalars['String']['output'];
  personalInformation?: Maybe<PersonalInformationPayload>;
  submittedAt: Scalars['DateTime']['output'];
};

export type RegistrationRequestPayload = {
  __typename?: 'RegistrationRequestPayload';
  document?: Maybe<RegistrationDocumentPayload>;
  patient?: Maybe<PatientIdentityPayload>;
  practiceName: Scalars['String']['output'];
  registrationRequestId: Scalars['String']['output'];
  registrationRequestStatus: Scalars['String']['output'];
  rejectionReason?: Maybe<Scalars['String']['output']>;
};

export type RejectRegistrationInput = {
  /** Reason given to the patient for the rejection. */
  reason: Scalars['String']['input'];
  registrationRequestId: Scalars['String']['input'];
  rejectedByStaffId: Scalars['String']['input'];
};

export type SubmitRegistrationDocumentInput = {
  contactDetails?: InputMaybe<ContactDetailsInput>;
  medicalAidDetails?: InputMaybe<MedicalAidDetailsInput>;
  medicalHistory?: InputMaybe<MedicalHistoryInput>;
  personalInformation?: InputMaybe<PersonalInformationInput>;
  registrationRequestId: Scalars['String']['input'];
};

export type VerifyRegistrationInput = {
  rsaId: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type VerifyRegistrationPayload = {
  __typename?: 'VerifyRegistrationPayload';
  attemptsAfterFailure?: Maybe<Scalars['Int']['output']>;
  errorCode?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['String']['output']>;
  maxAttempts?: Maybe<Scalars['Int']['output']>;
  registrationLinkId?: Maybe<Scalars['String']['output']>;
  sessionToken?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type PracticesQueryVariables = Exact<{ [key: string]: never; }>;


export type PracticesQuery = { __typename?: 'Query', practices: Array<{ __typename?: 'PracticePayload', id: string, name: string }> };

export type PracticeRegistrationRequestsQueryVariables = Exact<{ [key: string]: never; }>;


export type PracticeRegistrationRequestsQuery = { __typename?: 'Query', practiceRegistrationRequests: Array<{ __typename?: 'RegistrationRequestPayload', registrationRequestId: string, registrationRequestStatus: string, practiceName: string, rejectionReason?: string | null, patient?: { __typename?: 'PatientIdentityPayload', firstname?: string | null, lastname?: string | null, email?: string | null, phone?: string | null } | null, document?: { __typename?: 'RegistrationDocumentPayload', submittedAt: any } | null }> };

export type PracticeRegistrationRequestQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type PracticeRegistrationRequestQuery = { __typename?: 'Query', practiceRegistrationRequest: { __typename?: 'RegistrationRequestPayload', registrationRequestId: string, registrationRequestStatus: string, practiceName: string, rejectionReason?: string | null, patient?: { __typename?: 'PatientIdentityPayload', firstname?: string | null, lastname?: string | null, email?: string | null, phone?: string | null } | null, document?: { __typename?: 'RegistrationDocumentPayload', submittedAt: any, contactDetails?: { __typename?: 'ContactDetailsPayload', email?: string | null, phone?: string | null, altphone?: string | null, address?: string | null } | null, personalInformation?: { __typename?: 'PersonalInformationPayload', firstname?: string | null, lastname?: string | null, dateOfBirth?: string | null, gender?: string | null } | null, medicalAidDetails?: { __typename?: 'MedicalAidDetailsPayload', scheme?: string | null, memberNumber?: string | null, mainMember?: string | null, mainMemberId?: string | null, dependantCode?: string | null } | null, medicalHistory?: { __typename?: 'MedicalHistoryPayload', allergies?: string | null, currentMedication?: string | null, chronicConditions?: string | null, previousSurgeries?: string | null, familyHistory?: string | null } | null } | null } };

export type PatientProfileForPracticeQueryVariables = Exact<{
  registrationRequestId: Scalars['String']['input'];
}>;


export type PatientProfileForPracticeQuery = { __typename?: 'Query', patientProfile: { __typename?: 'PatientProfilePayload', contactDetails?: { __typename?: 'ContactDetailsPayload', email?: string | null, phone?: string | null, altphone?: string | null, address?: string | null } | null, personalInformation?: { __typename?: 'PersonalInformationPayload', firstname?: string | null, lastname?: string | null, dateOfBirth?: string | null, gender?: string | null } | null, medicalAidDetails?: { __typename?: 'MedicalAidDetailsPayload', scheme?: string | null, memberNumber?: string | null, mainMember?: string | null, mainMemberId?: string | null, dependantCode?: string | null } | null, medicalHistory?: { __typename?: 'MedicalHistoryPayload', allergies?: string | null, currentMedication?: string | null, chronicConditions?: string | null, previousSurgeries?: string | null, familyHistory?: string | null } | null } };

export type InitiateRegistrationMutationVariables = Exact<{
  input: InitiateRegistrationInput;
}>;


export type InitiateRegistrationMutation = { __typename?: 'Mutation', initiateRegistration: { __typename?: 'RegistrationRequestPayload', registrationRequestId: string, registrationRequestStatus: string, practiceName: string } };

export type ApproveRegistrationMutationVariables = Exact<{
  input: ApproveRegistrationInput;
}>;


export type ApproveRegistrationMutation = { __typename?: 'Mutation', approveRegistration: { __typename?: 'RegistrationRequestPayload', registrationRequestId: string, registrationRequestStatus: string, practiceName: string } };

export type RejectRegistrationMutationVariables = Exact<{
  input: RejectRegistrationInput;
}>;


export type RejectRegistrationMutation = { __typename?: 'Mutation', rejectRegistration: { __typename?: 'RegistrationRequestPayload', registrationRequestId: string, registrationRequestStatus: string, practiceName: string, rejectionReason?: string | null } };

export type CheckRegistrationLinkValidityQueryVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type CheckRegistrationLinkValidityQuery = { __typename?: 'Query', checkRegistrationLinkValidity: boolean };

export type VerifyRegistrationMutationVariables = Exact<{
  input: VerifyRegistrationInput;
}>;


export type VerifyRegistrationMutation = { __typename?: 'Mutation', verifyRegistration: { __typename?: 'VerifyRegistrationPayload', success: boolean, sessionToken?: string | null, expiresAt?: string | null, errorCode?: string | null, maxAttempts?: number | null, attemptsAfterFailure?: number | null } };

export type MyRegistrationRequestsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyRegistrationRequestsQuery = { __typename?: 'Query', myRegistrationRequests: Array<{ __typename?: 'RegistrationRequestPayload', registrationRequestId: string, registrationRequestStatus: string, practiceName: string, rejectionReason?: string | null }> };

export type MyRegistrationRequestQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type MyRegistrationRequestQuery = { __typename?: 'Query', myRegistrationRequest: { __typename?: 'RegistrationRequestPayload', registrationRequestId: string, registrationRequestStatus: string, practiceName: string, rejectionReason?: string | null, document?: { __typename?: 'RegistrationDocumentPayload', submittedAt: any, contactDetails?: { __typename?: 'ContactDetailsPayload', email?: string | null, phone?: string | null, altphone?: string | null, address?: string | null } | null, personalInformation?: { __typename?: 'PersonalInformationPayload', firstname?: string | null, lastname?: string | null, dateOfBirth?: string | null, gender?: string | null } | null, medicalAidDetails?: { __typename?: 'MedicalAidDetailsPayload', scheme?: string | null, memberNumber?: string | null, mainMember?: string | null, mainMemberId?: string | null, dependantCode?: string | null } | null, medicalHistory?: { __typename?: 'MedicalHistoryPayload', allergies?: string | null, currentMedication?: string | null, chronicConditions?: string | null, previousSurgeries?: string | null, familyHistory?: string | null } | null } | null } };

export type MyPatientProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type MyPatientProfileQuery = { __typename?: 'Query', myPatientProfile: { __typename?: 'PatientProfilePayload', contactDetails?: { __typename?: 'ContactDetailsPayload', email?: string | null, phone?: string | null, altphone?: string | null, address?: string | null } | null, personalInformation?: { __typename?: 'PersonalInformationPayload', firstname?: string | null, lastname?: string | null, dateOfBirth?: string | null, gender?: string | null } | null, medicalAidDetails?: { __typename?: 'MedicalAidDetailsPayload', scheme?: string | null, memberNumber?: string | null, mainMember?: string | null, mainMemberId?: string | null, dependantCode?: string | null } | null, medicalHistory?: { __typename?: 'MedicalHistoryPayload', allergies?: string | null, currentMedication?: string | null, chronicConditions?: string | null, previousSurgeries?: string | null, familyHistory?: string | null } | null } };

export type DateOfBirthFromRsaIdQueryVariables = Exact<{
  rsaId: Scalars['String']['input'];
}>;


export type DateOfBirthFromRsaIdQuery = { __typename?: 'Query', dateOfBirthFromRsaId: string };

export type GenderFromRsaIdQueryVariables = Exact<{
  rsaId: Scalars['String']['input'];
}>;


export type GenderFromRsaIdQuery = { __typename?: 'Query', genderFromRsaId: string };

export type RegistrationConsentTemplateQueryVariables = Exact<{
  registrationRequestId: Scalars['String']['input'];
}>;


export type RegistrationConsentTemplateQuery = { __typename?: 'Query', registrationConsentTemplate: { __typename?: 'ConsentTemplatePayload', text: string, version: string, consentType: string } };

export type MyConsentRecordQueryVariables = Exact<{
  registrationRequestId: Scalars['String']['input'];
}>;


export type MyConsentRecordQuery = { __typename?: 'Query', myConsentRecord?: { __typename?: 'ConsentRecordPayload', givenAt: string } | null };

export type GiveConsentMutationVariables = Exact<{
  registrationRequestId: Scalars['String']['input'];
}>;


export type GiveConsentMutation = { __typename?: 'Mutation', giveConsent: { __typename?: 'ConsentRecordPayload', givenAt: string } };

export type SubmitRegistrationDocumentMutationVariables = Exact<{
  input: SubmitRegistrationDocumentInput;
}>;


export type SubmitRegistrationDocumentMutation = { __typename?: 'Mutation', submitRegistrationDocument: { __typename?: 'RegistrationRequestPayload', registrationRequestId: string, registrationRequestStatus: string, practiceName: string } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const PracticesDocument = new TypedDocumentString(`
    query Practices {
  practices {
    id
    name
  }
}
    `) as unknown as TypedDocumentString<PracticesQuery, PracticesQueryVariables>;
export const PracticeRegistrationRequestsDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<PracticeRegistrationRequestsQuery, PracticeRegistrationRequestsQueryVariables>;
export const PracticeRegistrationRequestDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<PracticeRegistrationRequestQuery, PracticeRegistrationRequestQueryVariables>;
export const PatientProfileForPracticeDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<PatientProfileForPracticeQuery, PatientProfileForPracticeQueryVariables>;
export const InitiateRegistrationDocument = new TypedDocumentString(`
    mutation InitiateRegistration($input: InitiateRegistrationInput!) {
  initiateRegistration(input: $input) {
    registrationRequestId
    registrationRequestStatus
    practiceName
  }
}
    `) as unknown as TypedDocumentString<InitiateRegistrationMutation, InitiateRegistrationMutationVariables>;
export const ApproveRegistrationDocument = new TypedDocumentString(`
    mutation ApproveRegistration($input: ApproveRegistrationInput!) {
  approveRegistration(input: $input) {
    registrationRequestId
    registrationRequestStatus
    practiceName
  }
}
    `) as unknown as TypedDocumentString<ApproveRegistrationMutation, ApproveRegistrationMutationVariables>;
export const RejectRegistrationDocument = new TypedDocumentString(`
    mutation RejectRegistration($input: RejectRegistrationInput!) {
  rejectRegistration(input: $input) {
    registrationRequestId
    registrationRequestStatus
    practiceName
    rejectionReason
  }
}
    `) as unknown as TypedDocumentString<RejectRegistrationMutation, RejectRegistrationMutationVariables>;
export const CheckRegistrationLinkValidityDocument = new TypedDocumentString(`
    query CheckRegistrationLinkValidity($token: String!) {
  checkRegistrationLinkValidity(token: $token)
}
    `) as unknown as TypedDocumentString<CheckRegistrationLinkValidityQuery, CheckRegistrationLinkValidityQueryVariables>;
export const VerifyRegistrationDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<VerifyRegistrationMutation, VerifyRegistrationMutationVariables>;
export const MyRegistrationRequestsDocument = new TypedDocumentString(`
    query MyRegistrationRequests {
  myRegistrationRequests {
    registrationRequestId
    registrationRequestStatus
    practiceName
    rejectionReason
  }
}
    `) as unknown as TypedDocumentString<MyRegistrationRequestsQuery, MyRegistrationRequestsQueryVariables>;
export const MyRegistrationRequestDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<MyRegistrationRequestQuery, MyRegistrationRequestQueryVariables>;
export const MyPatientProfileDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<MyPatientProfileQuery, MyPatientProfileQueryVariables>;
export const DateOfBirthFromRsaIdDocument = new TypedDocumentString(`
    query DateOfBirthFromRsaId($rsaId: String!) {
  dateOfBirthFromRsaId(rsaId: $rsaId)
}
    `) as unknown as TypedDocumentString<DateOfBirthFromRsaIdQuery, DateOfBirthFromRsaIdQueryVariables>;
export const GenderFromRsaIdDocument = new TypedDocumentString(`
    query GenderFromRsaId($rsaId: String!) {
  genderFromRsaId(rsaId: $rsaId)
}
    `) as unknown as TypedDocumentString<GenderFromRsaIdQuery, GenderFromRsaIdQueryVariables>;
export const RegistrationConsentTemplateDocument = new TypedDocumentString(`
    query RegistrationConsentTemplate($registrationRequestId: String!) {
  registrationConsentTemplate(registrationRequestId: $registrationRequestId) {
    text
    version
    consentType
  }
}
    `) as unknown as TypedDocumentString<RegistrationConsentTemplateQuery, RegistrationConsentTemplateQueryVariables>;
export const MyConsentRecordDocument = new TypedDocumentString(`
    query MyConsentRecord($registrationRequestId: String!) {
  myConsentRecord(registrationRequestId: $registrationRequestId) {
    givenAt
  }
}
    `) as unknown as TypedDocumentString<MyConsentRecordQuery, MyConsentRecordQueryVariables>;
export const GiveConsentDocument = new TypedDocumentString(`
    mutation GiveConsent($registrationRequestId: String!) {
  giveConsent(registrationRequestId: $registrationRequestId) {
    givenAt
  }
}
    `) as unknown as TypedDocumentString<GiveConsentMutation, GiveConsentMutationVariables>;
export const SubmitRegistrationDocumentDocument = new TypedDocumentString(`
    mutation SubmitRegistrationDocument($input: SubmitRegistrationDocumentInput!) {
  submitRegistrationDocument(input: $input) {
    registrationRequestId
    registrationRequestStatus
    practiceName
  }
}
    `) as unknown as TypedDocumentString<SubmitRegistrationDocumentMutation, SubmitRegistrationDocumentMutationVariables>;