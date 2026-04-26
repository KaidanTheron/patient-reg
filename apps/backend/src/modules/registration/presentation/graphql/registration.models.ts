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
  sessionToken: string;

  @Field()
  registrationRequestId: string;

  @Field()
  rsaId: string;

  @Field()
  email: string;

  @Field()
  phoneNumber: string;

  @Field()
  residentialAddress: string;
}

@ObjectType()
export class RegistrationRequestPayload {
  @Field()
  registrationRequestId: string;

  @Field()
  registrationRequestStatus: string;

  @Field({ nullable: true })
  rejectionReason?: string;
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
