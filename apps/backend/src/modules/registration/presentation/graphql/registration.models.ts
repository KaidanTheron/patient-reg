import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@InputType()
export class CreatePracticeInput {
  @Field()
  name: string;
}

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
export class SubmitRegistrationDocumentInput {
  @Field()
  registrationRequestId: string;

  @Field()
  fullName: string;

  @Field()
  email: string;

  @Field()
  phoneNumber: string;

  @Field()
  residentialAddress: string;

  @Field()
  dateOfBirth: string;
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

  @Field(() => String, { nullable: true })
  patientName?: string | null;
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
export class PatientProfilePayload {
  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  residentialAddress?: string | null;

  @Field(() => String, { nullable: true })
  fullName?: string | null;

  @Field(() => String, { nullable: true })
  dateOfBirth?: string | null;
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
