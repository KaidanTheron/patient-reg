import {
  DraftRegistrationLink,
  RegistrationLink,
  UpdateRegistrationLink,
} from "~/modules/registration/domain/entities/registration-link.entity";

export abstract class RegistrationLinkRepository {
  abstract create(link: DraftRegistrationLink): Promise<RegistrationLink>;

  abstract findById(
    id: RegistrationLink["id"],
  ): Promise<RegistrationLink | null>;

  abstract findActiveByPatient(
    patient: RegistrationLink["patient"],
  ): Promise<RegistrationLink | null>;

  abstract revokeActiveForPatient(
    patient: RegistrationLink["patient"],
  ): Promise<void>;

  abstract update(
    id: RegistrationLink["id"],
    link: UpdateRegistrationLink,
  ): Promise<void>;
}
