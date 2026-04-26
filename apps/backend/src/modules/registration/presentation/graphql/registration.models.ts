import { Field, InputType, ObjectType } from "@nestjs/graphql";

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

@ObjectType()
export class RegistrationRequestPayload {
  @Field()
  registrationRequestId: string;

  @Field()
  registrationRequestStatus: string;

  @Field({ nullable: true })
  rejectionReason?: string;
}
