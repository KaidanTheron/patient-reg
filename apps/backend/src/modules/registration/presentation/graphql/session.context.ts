import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { Request } from "express";
import type { VerifiedPracticeSession } from "~/modules/registration/application/support/verified-practice-session";
import type { VerifiedPatientSession } from "~/modules/registration/application/support/protected-patient-session";

/** GraphQL `req` may carry a patient and/or a practice context (on different operations). */
export type RegistrationGraphqlRequest = Request & {
  patientSession?: VerifiedPatientSession;
  practiceSession?: VerifiedPracticeSession;
};

export type RegistrationGraphqlContext = {
  req: RegistrationGraphqlRequest;
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

export const PracticeSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): VerifiedPracticeSession => {
    const gqlContext =
      GqlExecutionContext.create(
        context,
      ).getContext<RegistrationGraphqlContext>();
    const session = gqlContext.req.practiceSession;

    if (!session) {
      throw new Error("Practice session context is missing");
    }

    return session;
  },
);
