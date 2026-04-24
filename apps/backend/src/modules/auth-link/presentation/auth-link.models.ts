import { Field, GraphQLISODateTime, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AuthLinkIssuePayload {
  @Field()
  uuid: string;

  @Field(() => GraphQLISODateTime)
  expiresAt: Date;
}

@ObjectType()
export class ValidatedRegistrationLinkPayload {
  @Field()
  uuid: string;

  @Field()
  patient: string;
}
