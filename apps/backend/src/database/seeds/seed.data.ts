import { PatientIdentityEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-identity.entity";
import { ConsentType } from "~/modules/registration/domain/entities/consent-template.entity";

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

export type ConsentTemplateSeed = {
  consentType: ConsentType;
  version: string;
  text: string;
};

export const consentTemplateSeedsByPractice: Readonly<
  Record<string, readonly ConsentTemplateSeed[]>
> = {
  "Winelands Family Practice": [
    {
      consentType: "REGISTRATION",
      version: "1.0",
      text:
        "I, the undersigned, hereby consent to Winelands Family Practice collecting, " +
        "storing, and using my personal and medical information for the purposes of " +
        "patient registration, providing healthcare services, and managing my patient " +
        "record. I understand that my information will be kept confidential and will " +
        "only be shared with authorised personnel directly involved in my care, or as " +
        "required by law. I acknowledge that I may request access to or correction of " +
        "my information at any time by contacting the practice.",
    },
  ],
  "Intercare Panorama": [
    {
      consentType: "REGISTRATION",
      version: "1.0",
      text:
        "I, the undersigned, hereby consent to Intercare Panorama collecting, storing, " +
        "and using my personal and medical information for the purposes of patient " +
        "registration, the provision of medical services, and the management of my " +
        "healthcare record. I understand my information is protected in accordance with " +
        "applicable South African legislation, including POPIA. I may withdraw consent " +
        "or request corrections to my record by contacting the practice directly.",
    },
  ],
};
