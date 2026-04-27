import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { RegistrationService } from "../../application/slices/registration";
import type { VerifiedPatientSession } from "../../application/support/protected-patient-session";
import { PatientSession } from "./patient-session.context";
import { PatientSessionGuard } from "./patient-session.guard";
import {
  ApproveRegistrationInput,
  CreatePracticeInput,
  InitiateRegistrationInput,
  PracticePayload,
  PatientProfilePayload,
  RegistrationRequestPayload,
  SubmitRegistrationDocumentInput,
  VerifyRegistrationInput,
  VerifyRegistrationPayload,
} from "./registration.models";

@Resolver()
export class RegistrationResolver {
  constructor(private readonly registration: RegistrationService) {}

  @Mutation(() => PracticePayload)
  async createPractice(
    @Args("input") input: CreatePracticeInput,
  ): Promise<PracticePayload> {
    return this.registration.createPractice(input);
  }

  @Mutation(() => RegistrationRequestPayload)
  async initiateRegistration(
    @Args("input") input: InitiateRegistrationInput,
  ): Promise<RegistrationRequestPayload> {
    return this.registration.initiateRegistration({
      patientIdentityId: input.rsaId,
      practiceId: input.practiceId,
      initiatedByStaffId: input.initiatedByStaffId,
    });
  }

  @Mutation(() => RegistrationRequestPayload)
  async approveRegistration(
    @Args("input") input: ApproveRegistrationInput,
  ): Promise<RegistrationRequestPayload> {
    return this.registration.approveRegistration(input);
  }

  @Mutation(() => RegistrationRequestPayload)
  @UseGuards(PatientSessionGuard)
  async submitRegistrationDocument(
    @Args("input") input: SubmitRegistrationDocumentInput,
    @PatientSession() patientSession: VerifiedPatientSession,
  ): Promise<RegistrationRequestPayload> {
    return this.registration.submitRegistrationDocument({
      patientSession,
      registrationRequestId: input.registrationRequestId,
      email: input.email,
      phoneNumber: input.phoneNumber,
      residentialAddress: input.residentialAddress,
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

  @Query(() => PracticePayload, { nullable: true })
  async practice(@Args("id") id: string): Promise<PracticePayload | null> {
    return this.registration.findPracticeById(id);
  }

  @Query(() => [PracticePayload])
  async practices(): Promise<PracticePayload[]> {
    return this.registration.findPractices();
  }

  @Query(() => [RegistrationRequestPayload])
  async practiceRegistrationRequests(
    @Args("practiceId") practiceId: string,
  ): Promise<RegistrationRequestPayload[]> {
    return this.registration.findAllPracticeRegRequests(practiceId);
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
    const d = await this.registration.getPatientDetailsForSession(
      patientSession,
    );
    return {
      email: d.email ?? null,
      phone: d.phone ?? null,
      residentialAddress: d.residentialAddress ?? null,
    };
  }

  @Query(() => RegistrationRequestPayload)
  @UseGuards(PatientSessionGuard)
  async myRegistrationRequest(
    @Args("id") id: string,
    @PatientSession() patientSession: VerifiedPatientSession,
  ): Promise<RegistrationRequestPayload> {
    return this.registration.findPatientRegRequestById(patientSession, id);
  }
}
