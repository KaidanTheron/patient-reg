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
}
