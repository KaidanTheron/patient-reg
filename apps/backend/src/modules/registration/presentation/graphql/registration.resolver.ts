import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import {
  RegistrationService,
} from "../../application/slices/registration";
import {
  ApproveRegistrationInput,
  CreatePracticeInput,
  InitiateRegistrationInput,
  PracticePayload,
  RegistrationRequestPayload,
  SubmitRegistrationDocumentInput,
  VerifyRegistrationInput,
  VerifyRegistrationPayload,
} from "./registration.models";

@Resolver()
export class RegistrationResolver {
  constructor(
    private readonly registration: RegistrationService,
  ) {}

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

  // TODO: should get registrationRequestId from context from guard
  // Do not implement yet
  @Mutation(() => RegistrationRequestPayload)
  async submitRegistrationDocument(
    @Args("input") input: SubmitRegistrationDocumentInput,
  ): Promise<RegistrationRequestPayload> {
    return this.registration.submitRegistrationDocument({
      sessionToken: input.sessionToken,
      registrationRequestId: input.registrationRequestId,
      rsaId: input.rsaId,
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
  async myRegistrationRequests(
    @Args("sessionToken") sessionToken: string,
  ): Promise<RegistrationRequestPayload[]> {
    return this.registration.findAllPatientRegRequests(
      sessionToken,
    );
  }
}
