import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { ProtectedPatientSession } from "../../application/support/protected-patient-session";
import { extractBearerToken } from "./extract-bearer";
import type { RegistrationGraphqlContext } from "./session.context";

@Injectable()
export class PatientSessionGuard implements CanActivate {
  constructor(
    private readonly protectedPatientSession: ProtectedPatientSession,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext =
      GqlExecutionContext.create(
        context,
      ).getContext<RegistrationGraphqlContext>();
    const token = extractBearerToken(gqlContext.req.headers.authorization);

    if (!token) {
      throw new UnauthorizedException("Missing patient session token");
    }

    try {
      gqlContext.req.patientSession =
        await this.protectedPatientSession.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException("Invalid patient session token");
    }
  }
}
