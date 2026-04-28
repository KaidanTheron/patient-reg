import { ForbiddenException, UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import {
  RegistrationService,
} from "~/modules/registration/application/slices/registration";
import type { VerifiedPatientSession } from "~/modules/registration/application/support/protected-patient-session";
import type { VerifiedPracticeSession } from "~/modules/registration/application/support/verified-practice-session";
import {
  PatientSession,
  PracticeSession,
} from "~/modules/registration/presentation/graphql/session.context";
import { PatientSessionGuard } from "~/modules/registration/presentation/graphql/patient-session.guard";
import { PracticeSessionGuard } from "~/modules/registration/presentation/graphql/practice-session.guard";
import {
  ApproveRegistrationInput,
  ConsentRecordPayload,
  ConsentTemplatePayload,
  InitiateRegistrationInput,
  PatientProfilePayload,
  PracticePayload,
  RejectRegistrationInput,
  RegistrationRequestPayload,
  SubmitRegistrationDocumentInput,
  VerifyRegistrationInput,
  VerifyRegistrationPayload,
} from "~/modules/registration/presentation/graphql/registration.models";

@Resolver()
export class RegistrationResolver {
  constructor(private readonly registration: RegistrationService) {}

  @Mutation(() => RegistrationRequestPayload)
  @UseGuards(PracticeSessionGuard)
  async initiateRegistration(
    @Args("input") input: InitiateRegistrationInput,
    @PracticeSession() practiceSession: VerifiedPracticeSession,
  ): Promise<RegistrationRequestPayload> {
    if (input.practiceId !== practiceSession.practiceId) {
      throw new ForbiddenException("Practice id does not match session");
    }
    return this.registration.initiateRegistration({
      patientIdentityId: input.rsaId,
      initiatedByStaffId: input.initiatedByStaffId,
      practiceSession,
    });
  }

  @Mutation(() => RegistrationRequestPayload)
  @UseGuards(PracticeSessionGuard)
  async approveRegistration(
    @Args("input") input: ApproveRegistrationInput,
    @PracticeSession() practiceSession: VerifiedPracticeSession,
  ): Promise<RegistrationRequestPayload> {
    return this.registration.approveRegistration({
      ...input,
      practiceSession,
    });
  }

  @Mutation(() => RegistrationRequestPayload)
  @UseGuards(PracticeSessionGuard)
  async rejectRegistration(
    @Args("input") input: RejectRegistrationInput,
    @PracticeSession() practiceSession: VerifiedPracticeSession,
  ): Promise<RegistrationRequestPayload> {
    return this.registration.rejectRegistration({
      ...input,
      practiceSession,
    });
  }

  @Mutation(() => RegistrationRequestPayload)
  @UseGuards(PatientSessionGuard)
  async submitRegistrationDocument(
    @Args("input") input: SubmitRegistrationDocumentInput,
    @PatientSession() patientSession: VerifiedPatientSession,
  ): Promise<RegistrationRequestPayload> {
    const { contactDetails, medicalAidDetails, medicalHistory, personalInformation, registrationRequestId } = input;

    return this.registration.submitRegistrationDocument({
      patientSession,
      registrationRequestId,
      contactDetails,
      personalInformation,
      medicalAidDetails,
      medicalHistory,
    });
  }

  @Mutation(() => VerifyRegistrationPayload)
  async verifyRegistration(
    @Args("input") input: VerifyRegistrationInput,
  ): Promise<VerifyRegistrationPayload> {
    const r = await this.registration.verifyRegistrationByLinkToken({
      token: input.token,
      rsaId: input.rsaId,
    });
    if (r.success) {
      return {
        success: true,
        sessionToken: r.sessionToken,
        expiresAt: r.expiresAt,
        registrationLinkId: r.registrationLinkId,
      };
    }
    return {
      success: false,
      errorCode: r.errorCode,
      maxAttempts: r.maxAttempts,
      attemptsAfterFailure: r.attemptsAfterFailure,
    };
  }

  /**
   * Derives date of birth from a valid 13-digit RSA ID (Luhn). Returns
   * `YYYY-MM-DD` in the local calendar sense of the derived date.
   */
  @Query(() => String, {
    name: "dateOfBirthFromRsaId",
    description:
      "ISO-8601 date (YYYY-MM-DD) derived from the RSA ID, for form UX.",
  })
  dateOfBirthFromRsaId(
    @Args("rsaId", { description: "13-digit RSA ID" }) rsaId: string,
  ): string {
    return this.registration.deriveDateOfBirthFromRsaId(rsaId);
  }

  /**
   * Derives gender from a valid 13-digit RSA ID (Luhn). Returns `"MALE"` or
   * `"FEMALE"` based on digits 7–10 of the ID number.
   */
  @Query(() => String, {
    name: "genderFromRsaId",
    description:
      'Gender ("MALE" or "FEMALE") derived from the RSA ID, for form UX.',
  })
  genderFromRsaId(
    @Args("rsaId", { description: "13-digit RSA ID" }) rsaId: string,
  ): string {
    return this.registration.deriveGenderFromRsaId(rsaId);
  }

  @Query(() => PracticePayload, { nullable: true })
  async practice(@Args("id") id: string): Promise<PracticePayload | null> {
    return this.registration.findPracticeById(id);
  }

  @Query(() => [PracticePayload])
  async practices(): Promise<PracticePayload[]> {
    return this.registration.findPractices();
  }

  @Query(() => [RegistrationRequestPayload])
  @UseGuards(PracticeSessionGuard)
  async practiceRegistrationRequests(
    @PracticeSession() practiceSession: VerifiedPracticeSession,
  ): Promise<RegistrationRequestPayload[]> {
    return this.registration.findAllPracticeRegRequests(practiceSession);
  }

  @Query(() => RegistrationRequestPayload)
  @UseGuards(PracticeSessionGuard)
  async practiceRegistrationRequest(
    @Args("id") id: string,
    @PracticeSession() practiceSession: VerifiedPracticeSession,
  ): Promise<RegistrationRequestPayload> {
    return this.registration.findPracticeRegRequestById(practiceSession, id);
  }

  @Query(() => [RegistrationRequestPayload])
  @UseGuards(PatientSessionGuard)
  async myRegistrationRequests(
    @PatientSession() patientSession: VerifiedPatientSession,
  ): Promise<RegistrationRequestPayload[]> {
    return this.registration.findAllPatientRegRequests(patientSession);
  }

  @Query(() => PatientProfilePayload)
  @UseGuards(PatientSessionGuard)
  async myPatientProfile(
    @PatientSession() patientSession: VerifiedPatientSession,
  ): Promise<PatientProfilePayload> {
    return await this.registration.getPatientDetailsForSession({
      kind: "patient",
      patientSession,
    });
  }

  /** Staff query — returns decrypted patient profile for a given registration request. */
  @Query(() => PatientProfilePayload)
  @UseGuards(PracticeSessionGuard)
  async patientProfile(
    @Args("registrationRequestId") registrationRequestId: string,
    @PracticeSession() practiceSession: VerifiedPracticeSession,
  ): Promise<PatientProfilePayload> {
    return await this.registration.getPatientDetailsForSession({
      kind: "practice",
      practiceSession,
      registrationRequestId,
    });
  }

  @Query(() => RegistrationRequestPayload)
  @UseGuards(PatientSessionGuard)
  async myRegistrationRequest(
    @Args("id") id: string,
    @PatientSession() patientSession: VerifiedPatientSession,
  ): Promise<RegistrationRequestPayload> {
    return this.registration.findPatientRegRequestById(patientSession, id);
  }

  @Query(() => ConsentTemplatePayload, {
    description:
      "Returns the active consent template the patient must agree to before submitting registration.",
  })
  @UseGuards(PatientSessionGuard)
  async registrationConsentTemplate(
    @Args("registrationRequestId") registrationRequestId: string,
    @PatientSession() patientSession: VerifiedPatientSession,
  ): Promise<ConsentTemplatePayload> {
    return await this.registration.getConsentTemplate(
      patientSession,
      registrationRequestId,
    );
  }

  @Query(() => ConsentRecordPayload, {
    nullable: true,
    description:
      "Returns the existing consent record for a registration request, or null if consent has not yet been given.",
  })
  @UseGuards(PatientSessionGuard)
  async myConsentRecord(
    @Args("registrationRequestId") registrationRequestId: string,
    @PatientSession() patientSession: VerifiedPatientSession,
  ): Promise<ConsentRecordPayload | null> {
    return await this.registration.getMyConsentRecord(
      patientSession,
      registrationRequestId,
    );
  }

  @Mutation(() => ConsentRecordPayload, {
    description:
      "Records the patient's consent for a registration request. Idempotent — safe to call more than once.",
  })
  @UseGuards(PatientSessionGuard)
  async giveConsent(
    @Args("registrationRequestId") registrationRequestId: string,
    @PatientSession() patientSession: VerifiedPatientSession,
  ): Promise<ConsentRecordPayload> {
    return await this.registration.giveConsent(patientSession, registrationRequestId);
  }
}
