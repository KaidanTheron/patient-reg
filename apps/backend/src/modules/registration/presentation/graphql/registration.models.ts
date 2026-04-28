import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PracticePayload {
  @Field()
  id: string;

  @Field()
  name: string;
}

@InputType()
export class InitiateRegistrationInput {
  @Field()
  rsaId: string;

  @Field()
  practiceId: string;

  @Field()
  initiatedByStaffId: string;
}

@InputType()
export class ApproveRegistrationInput {
  @Field()
  registrationRequestId: string;

  @Field()
  approvedByStaffId: string;
}

@InputType()
export class RejectRegistrationInput {
  @Field()
  registrationRequestId: string;

  @Field()
  rejectedByStaffId: string;

  @Field({ description: "Reason given to the patient for the rejection." })
  reason: string;
}

@InputType()
export class ContactDetailsInput {
  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  phone?: string;

  @Field(() => String, { nullable: true })
  altphone?: string;

  @Field(() => String, { nullable: true })
  residentialAddress?: string;
}

@InputType()
export class PersonalInformationInput {
  @Field(() => String, { nullable: true })
  firstname?: string;

  @Field(() => String, { nullable: true })
  lastname?: string;

  @Field(() => String, { nullable: true })
  dateOfBirth?: string;

  @Field(() => String, { nullable: true })
  gender?: string;
}

@InputType()
export class MedicalAidDetailsInput {
  @Field(() => String, { nullable: true })
  scheme?: string;

  @Field(() => String, { nullable: true })
  memberNumber?: string;

  @Field(() => String, { nullable: true })
  mainMember?: string;

  @Field(() => String, { nullable: true })
  mainMemberId?: string;

  @Field(() => String, { nullable: true })
  dependantCode?: string;
}

@InputType()
export class MedicalHistoryInput {
  @Field(() => String, { nullable: true })
  allergies?: string;

  @Field(() => String, { nullable: true })
  currentMedication?: string;

  @Field(() => String, { nullable: true })
  chronicConditions?: string;

  @Field(() => String, { nullable: true })
  previousSurgeries?: string;

  @Field(() => String, { nullable: true })
  familyHistory?: string;
}

@InputType()
export class SubmitRegistrationDocumentInput {
  @Field()
  registrationRequestId: string;

  @Field(() => ContactDetailsInput, { nullable: true })
  contactDetails: ContactDetailsInput;

  @Field(() => PersonalInformationInput, { nullable: true })
  personalInformation: PersonalInformationInput;

  @Field(() => MedicalAidDetailsInput, { nullable: true })
  medicalAidDetails: MedicalAidDetailsInput;

  @Field(() => MedicalHistoryInput, { nullable: true })
  medicalHistory: MedicalHistoryInput;
}

@ObjectType()
export class RegistrationDocumentPayload {
  @Field()
  id: string;

  @Field()
  patientIdentityId: string;

  @Field()
  submittedAt: Date;

  @Field(() => ContactDetailsPayload, { nullable: true })
  contactDetails?: ContactDetailsPayload | null;

  @Field(() => PersonalInformationPayload, { nullable: true })
  personalInformation?: PersonalInformationPayload | null;

  @Field(() => MedicalAidDetailsPayload, { nullable: true })
  medicalAidDetails?: MedicalAidDetailsPayload | null;

  @Field(() => MedicalHistoryPayload, { nullable: true })
  medicalHistory?: MedicalHistoryPayload | null;
}

@ObjectType()
export class PatientIdentityPayload {
  @Field(() => String, { nullable: true })
  firstname?: string | null;

  @Field(() => String, { nullable: true })
  lastname?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;
}

@ObjectType()
export class RegistrationRequestPayload {
  @Field()
  registrationRequestId: string;

  @Field()
  registrationRequestStatus: string;

  @Field()
  practiceName: string;

  @Field({ nullable: true })
  rejectionReason?: string;

  @Field(() => PatientIdentityPayload, { nullable: true })
  patient?: PatientIdentityPayload | null;

  @Field(() => RegistrationDocumentPayload, { nullable: true })
  document?: RegistrationDocumentPayload | null;
}

@InputType()
export class VerifyRegistrationInput {
  /** Signed link token (JWT) from the registration URL. */
  @Field()
  token: string;

  @Field()
  rsaId: string;
}

@ObjectType()
export class ContactDetailsPayload {
  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  altphone?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;
}

@ObjectType()
export class PersonalInformationPayload {
  @Field(() => String, { nullable: true })
  firstname?: string | null;

  @Field(() => String, { nullable: true })
  lastname?: string | null;

  @Field(() => String, { nullable: true })
  dateOfBirth?: string | null;

  @Field(() => String, { nullable: true })
  gender?: string | null;
}

@ObjectType()
export class MedicalAidDetailsPayload {
  @Field(() => String, { nullable: true })
  scheme?: string | null;

  @Field(() => String, { nullable: true })
  memberNumber?: string | null;

  @Field(() => String, { nullable: true })
  mainMember?: string | null;

  @Field(() => String, { nullable: true })
  mainMemberId?: string | null;

  @Field(() => String, { nullable: true })
  dependantCode?: string | null;
}

@ObjectType()
export class MedicalHistoryPayload {
  @Field(() => String, { nullable: true })
  allergies?: string | null;

  @Field(() => String, { nullable: true })
  currentMedication?: string | null;

  @Field(() => String, { nullable: true })
  chronicConditions?: string | null;

  @Field(() => String, { nullable: true })
  previousSurgeries?: string | null;

  @Field(() => String, { nullable: true })
  familyHistory?: string | null;
}

@ObjectType()
export class PatientProfilePayload {
  @Field(() => ContactDetailsPayload, { nullable: true })
  contactDetails?: ContactDetailsPayload | null;

  @Field(() => PersonalInformationPayload, { nullable: true })
  personalInformation?: PersonalInformationPayload | null;

  @Field(() => MedicalAidDetailsPayload, { nullable: true })
  medicalAidDetails?: MedicalAidDetailsPayload | null;

  @Field(() => MedicalHistoryPayload, { nullable: true })
  medicalHistory?: MedicalHistoryPayload | null;
}

@ObjectType()
export class VerifyRegistrationPayload {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  sessionToken?: string;

  @Field({ nullable: true })
  expiresAt?: string;

  @Field({ nullable: true })
  registrationLinkId?: string;

  @Field({ nullable: true })
  errorCode?: string;

  @Field(() => Int, { nullable: true })
  maxAttempts?: number;

  @Field(() => Int, { nullable: true })
  attemptsAfterFailure?: number;
}

@ObjectType()
export class ConsentTemplatePayload {
  @Field()
  id: string;

  @Field()
  consentType: string;

  @Field()
  version: string;

  @Field()
  text: string;
}

@ObjectType()
export class ConsentRecordPayload {
  @Field()
  id: string;

  @Field()
  registrationRequestId: string;

  @Field()
  consentTemplateId: string;

  @Field()
  givenAt: string;
}
