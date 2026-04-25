import { NewRegistrationRequest, RegistrationRequest } from "../entities/registration-request.entity";

export abstract class RegistrationRequestRepository {
  abstract findById(id: RegistrationRequest["id"]): Promise<RegistrationRequest | null>;

  abstract findByPatientAndPractice(patient: RegistrationRequest["patientIdentityId"], practice: RegistrationRequest["practiceId"]): Promise<RegistrationRequest | null>;

  abstract create(request: NewRegistrationRequest): Promise<RegistrationRequest>;

  abstract update(id: RegistrationRequest["id"], request: Partial<RegistrationRequest>): Promise<void>;
}