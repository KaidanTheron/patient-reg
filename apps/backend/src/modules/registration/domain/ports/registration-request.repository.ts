import { DraftRegistrationRequest, RegistrationRequest, UpdateRegistrationRequest } from "../entities/registration-request.entity";

export abstract class RegistrationRequestRepository {
  abstract findById(id: RegistrationRequest["id"]): Promise<RegistrationRequest | null>;

  abstract findByPatientAndPractice(patient: RegistrationRequest["patientIdentityId"], practice: RegistrationRequest["practiceId"]): Promise<RegistrationRequest | null>;

  abstract create(request: DraftRegistrationRequest): Promise<RegistrationRequest>;

  abstract update(id: RegistrationRequest["id"], request: Partial<UpdateRegistrationRequest>): Promise<void>;
}