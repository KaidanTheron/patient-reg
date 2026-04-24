import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AuthLinkService } from "../application/auth-link.service";
import {
  AuthLinkIssuePayload,
  ValidatedRegistrationLinkPayload,
} from "./auth-link.models";

@Resolver()
export class AuthLinkResolver {
  constructor(private readonly authLinks: AuthLinkService) {}

  @Mutation(() => AuthLinkIssuePayload)
  createAuthLink(
    @Args("patient") patient: string,
    @Args("createdBy") createdBy: string,
  ): Promise<AuthLinkIssuePayload> {
    return this.authLinks.issueRegistrationLink({ patient, createdBy });
  }

  @Query(() => ValidatedRegistrationLinkPayload)
  validateRegistrationLink(
    @Args("token") token: string,
    @Args("id") id: string,
  ): Promise<ValidatedRegistrationLinkPayload> {
    return this.authLinks.validateRegistrationLinkToken(token, id);
  }
}
