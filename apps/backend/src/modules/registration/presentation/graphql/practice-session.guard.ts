import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { VerifiedPracticeSession } from "../../application/support/verified-practice-session";
import { extractBearerToken } from "./extract-bearer";
import type { RegistrationGraphqlContext } from "./session.context";

@Injectable()
export class PracticeSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const gqlContext =
      GqlExecutionContext.create(
        context,
      ).getContext<RegistrationGraphqlContext>();
    const token = extractBearerToken(gqlContext.req.headers.authorization);

    if (token == null) {
      throw new UnauthorizedException("Missing practice session token");
    }

    const practiceId = token.trim();
    if (!practiceId) {
      throw new UnauthorizedException("Empty practice id");
    }

    const session: VerifiedPracticeSession = { practiceId };
    gqlContext.req.practiceSession = session;
    return true;
  }
}
