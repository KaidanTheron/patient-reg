import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { Request } from "express";
import type { VerifiedPatientSession } from "../../application/support/protected-patient-session";

export type PatientSessionRequest = Request & {
  patientSession?: VerifiedPatientSession;
};

export type RegistrationGraphqlContext = {
  req: PatientSessionRequest;
};

export const PatientSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): VerifiedPatientSession => {
    const gqlContext =
      GqlExecutionContext.create(
        context,
      ).getContext<RegistrationGraphqlContext>();
    const session = gqlContext.req.patientSession;

    if (!session) {
      throw new Error("Patient session context is missing");
    }

    return session;
  },
);
