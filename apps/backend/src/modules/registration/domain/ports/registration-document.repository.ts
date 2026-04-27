import {
  DraftRegistrationDocument,
  RegistrationDocument,
  UpdateRegistrationDocument,
} from "~/modules/registration/domain/entities/registration-document.entity";

export abstract class RegistrationDocumentRepository {
  abstract create(
    document: DraftRegistrationDocument,
  ): Promise<RegistrationDocument>;

  abstract findByRegistrationRequestId(
    registrationRequestId: string,
  ): Promise<RegistrationDocument | null>;

  abstract update(
    id: RegistrationDocument["id"],
    update: UpdateRegistrationDocument,
  ): Promise<RegistrationDocument>;
}
