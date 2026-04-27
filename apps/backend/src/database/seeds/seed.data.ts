import { PatientIdentityEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-identity.entity";

export const identities: readonly Omit<PatientIdentityEntity, "id">[] = [
  {
    email: "notreal@notreal.com",
    identity: "0501018431087",
    phone: "+27825550199",
    firstname: "Johan",
    lastname: "de Wet"
  },
  {
    email: "old.email@example.com",
    identity: "9001015009086",
    phone: "+27821234567",
    firstname: "Emily",
    lastname: "Jacobs"
  },
];

export const practiceNames: readonly string[] = [
  "Winelands Family Practice",
  "Intercare Panorama",
];
