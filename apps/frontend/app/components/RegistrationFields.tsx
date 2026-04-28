import { Field, inputClass } from "~/components/Layout";
import type {
  ContactDetailsInput,
  ContactDetailsPayload,
  MedicalAidDetailsInput,
  MedicalAidDetailsPayload,
  MedicalHistoryInput,
  MedicalHistoryPayload,
  PatientProfilePayload,
  PersonalInformationInput,
  PersonalInformationPayload,
} from "~/graphql/graphql";

export type RegistrationFormState = {
  contactDetails: ContactDetailsInput;
  personalInformation: PersonalInformationInput;
  medicalAidDetails: MedicalAidDetailsInput;
  medicalHistory: MedicalHistoryInput;
};

const genderOptions = ["MALE", "FEMALE"] as const;
const medicalAidSchemeOptions = [
  "DISCOVERY_HEALTH",
  "MOMENTUM_HEALTH",
  "BONITAS",
  "MEDSHIELD",
  "FEDHEALTH",
  "GEMS",
  "BESTMED",
  "MEDIHELP",
  "COMPCARE",
  "OTHER",
] as const;

function optionLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

type RegistrationDocumentShape = {
  contactDetails?: ContactDetailsPayload | null;
  personalInformation?: PersonalInformationPayload | null;
  medicalAidDetails?: MedicalAidDetailsPayload | null;
  medicalHistory?: MedicalHistoryPayload | null;
};

export function emptyRegistrationForm(): RegistrationFormState {
  return {
    contactDetails: {
      email: "",
      phone: "",
      altphone: "",
      residentialAddress: "",
    },
    personalInformation: {
      firstname: "",
      lastname: "",
      dateOfBirth: "",
      gender: "",
    },
    medicalAidDetails: {
      scheme: "",
      memberNumber: "",
      mainMember: "",
      mainMemberId: "",
      dependantCode: "",
    },
    medicalHistory: {
      allergies: "",
      currentMedication: "",
      chronicConditions: "",
      previousSurgeries: "",
      familyHistory: "",
    },
  };
}

export function formFromProfile(
  profile?: PatientProfilePayload | null,
  derived?: { dateOfBirth?: string; gender?: string },
  document?: RegistrationDocumentShape | null,
): RegistrationFormState {
  const current = emptyRegistrationForm();
  const source = document ?? profile;

  return {
    contactDetails: {
      email: source?.contactDetails?.email ?? current.contactDetails.email,
      phone: source?.contactDetails?.phone ?? current.contactDetails.phone,
      altphone:
        source?.contactDetails?.altphone ?? current.contactDetails.altphone,
      residentialAddress:
        source?.contactDetails?.address ??
        current.contactDetails.residentialAddress,
    },
    personalInformation: {
      firstname:
        source?.personalInformation?.firstname ??
        current.personalInformation.firstname,
      lastname:
        source?.personalInformation?.lastname ??
        current.personalInformation.lastname,
      dateOfBirth:
        source?.personalInformation?.dateOfBirth ??
        derived?.dateOfBirth ??
        current.personalInformation.dateOfBirth,
      gender:
        source?.personalInformation?.gender ??
        derived?.gender ??
        current.personalInformation.gender,
    },
    medicalAidDetails: {
      scheme:
        source?.medicalAidDetails?.scheme ?? current.medicalAidDetails.scheme,
      memberNumber:
        source?.medicalAidDetails?.memberNumber ??
        current.medicalAidDetails.memberNumber,
      mainMember:
        source?.medicalAidDetails?.mainMember ??
        current.medicalAidDetails.mainMember,
      mainMemberId:
        source?.medicalAidDetails?.mainMemberId ??
        current.medicalAidDetails.mainMemberId,
      dependantCode:
        source?.medicalAidDetails?.dependantCode ??
        current.medicalAidDetails.dependantCode,
    },
    medicalHistory: {
      allergies:
        source?.medicalHistory?.allergies ?? current.medicalHistory.allergies,
      currentMedication:
        source?.medicalHistory?.currentMedication ??
        current.medicalHistory.currentMedication,
      chronicConditions:
        source?.medicalHistory?.chronicConditions ??
        current.medicalHistory.chronicConditions,
      previousSurgeries:
        source?.medicalHistory?.previousSurgeries ??
        current.medicalHistory.previousSurgeries,
      familyHistory:
        source?.medicalHistory?.familyHistory ??
        current.medicalHistory.familyHistory,
    },
  };
}

export function RegistrationFields({
  value,
  onChange,
  disabled = false,
}: {
  value: RegistrationFormState;
  onChange: (next: RegistrationFormState) => void;
  disabled?: boolean;
}) {
  function updateSection<TSection extends keyof RegistrationFormState>(
    section: TSection,
    key: keyof RegistrationFormState[TSection],
    fieldValue: string,
  ) {
    onChange({
      ...value,
      [section]: {
        ...value[section],
        [key]: fieldValue,
      },
    });
  }

  return (
    <div className="grid gap-6">
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-semibold text-slate-950">
          Personal information
        </legend>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="First name">
            <input
              className={inputClass}
              disabled={disabled}
              value={value.personalInformation.firstname ?? ""}
              onChange={(event) =>
                updateSection(
                  "personalInformation",
                  "firstname",
                  event.target.value,
                )
              }
            />
          </Field>
          <Field label="Last name">
            <input
              className={inputClass}
              disabled={disabled}
              value={value.personalInformation.lastname ?? ""}
              onChange={(event) =>
                updateSection(
                  "personalInformation",
                  "lastname",
                  event.target.value,
                )
              }
            />
          </Field>
          <Field label="Date of birth">
            <input
              className={inputClass}
              disabled={disabled}
              type="date"
              value={value.personalInformation.dateOfBirth ?? ""}
              onChange={(event) =>
                updateSection(
                  "personalInformation",
                  "dateOfBirth",
                  event.target.value,
                )
              }
            />
          </Field>
          <Field label="Gender">
            <select
              className={inputClass}
              disabled={disabled}
              value={value.personalInformation.gender ?? ""}
              onChange={(event) =>
                updateSection("personalInformation", "gender", event.target.value)
              }
            >
              <option value="">Not provided</option>
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {optionLabel(option)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-semibold text-slate-950">
          Contact details
        </legend>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Email">
            <input
              className={inputClass}
              disabled={disabled}
              value={value.contactDetails.email ?? ""}
              onChange={(event) =>
                updateSection("contactDetails", "email", event.target.value)
              }
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              disabled={disabled}
              value={value.contactDetails.phone ?? ""}
              onChange={(event) =>
                updateSection("contactDetails", "phone", event.target.value)
              }
            />
          </Field>
          <Field label="Alternative phone">
            <input
              className={inputClass}
              disabled={disabled}
              value={value.contactDetails.altphone ?? ""}
              onChange={(event) =>
                updateSection("contactDetails", "altphone", event.target.value)
              }
            />
          </Field>
          <Field label="Residential address">
            <input
              className={inputClass}
              disabled={disabled}
              value={value.contactDetails.residentialAddress ?? ""}
              onChange={(event) =>
                updateSection(
                  "contactDetails",
                  "residentialAddress",
                  event.target.value,
                )
              }
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-semibold text-slate-950">
          Medical aid
        </legend>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Scheme">
            <select
              className={inputClass}
              disabled={disabled}
              value={value.medicalAidDetails.scheme ?? ""}
              onChange={(event) =>
                updateSection("medicalAidDetails", "scheme", event.target.value)
              }
            >
              <option value="">No medical aid</option>
              {medicalAidSchemeOptions.map((option) => (
                <option key={option} value={option}>
                  {optionLabel(option)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Member number">
            <input
              className={inputClass}
              disabled={disabled}
              value={value.medicalAidDetails.memberNumber ?? ""}
              onChange={(event) =>
                updateSection(
                  "medicalAidDetails",
                  "memberNumber",
                  event.target.value,
                )
              }
            />
          </Field>
          <Field label="Main member">
            <input
              className={inputClass}
              disabled={disabled}
              value={value.medicalAidDetails.mainMember ?? ""}
              onChange={(event) =>
                updateSection(
                  "medicalAidDetails",
                  "mainMember",
                  event.target.value,
                )
              }
            />
          </Field>
          <Field label="Main member ID">
            <input
              className={inputClass}
              disabled={disabled}
              value={value.medicalAidDetails.mainMemberId ?? ""}
              onChange={(event) =>
                updateSection(
                  "medicalAidDetails",
                  "mainMemberId",
                  event.target.value,
                )
              }
            />
          </Field>
          <Field label="Dependant code">
            <input
              className={inputClass}
              disabled={disabled}
              value={value.medicalAidDetails.dependantCode ?? ""}
              onChange={(event) =>
                updateSection(
                  "medicalAidDetails",
                  "dependantCode",
                  event.target.value,
                )
              }
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-semibold text-slate-950">
          Medical history
        </legend>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Allergies">
            <textarea
              className={inputClass}
              disabled={disabled}
              rows={3}
              value={value.medicalHistory.allergies ?? ""}
              onChange={(event) =>
                updateSection("medicalHistory", "allergies", event.target.value)
              }
            />
          </Field>
          <Field label="Current medication">
            <textarea
              className={inputClass}
              disabled={disabled}
              rows={3}
              value={value.medicalHistory.currentMedication ?? ""}
              onChange={(event) =>
                updateSection(
                  "medicalHistory",
                  "currentMedication",
                  event.target.value,
                )
              }
            />
          </Field>
          <Field label="Chronic conditions">
            <textarea
              className={inputClass}
              disabled={disabled}
              rows={3}
              value={value.medicalHistory.chronicConditions ?? ""}
              onChange={(event) =>
                updateSection(
                  "medicalHistory",
                  "chronicConditions",
                  event.target.value,
                )
              }
            />
          </Field>
          <Field label="Previous surgeries">
            <textarea
              className={inputClass}
              disabled={disabled}
              rows={3}
              value={value.medicalHistory.previousSurgeries ?? ""}
              onChange={(event) =>
                updateSection(
                  "medicalHistory",
                  "previousSurgeries",
                  event.target.value,
                )
              }
            />
          </Field>
          <Field label="Family history">
            <textarea
              className={inputClass}
              disabled={disabled}
              rows={3}
              value={value.medicalHistory.familyHistory ?? ""}
              onChange={(event) =>
                updateSection(
                  "medicalHistory",
                  "familyHistory",
                  event.target.value,
                )
              }
            />
          </Field>
        </div>
      </fieldset>
    </div>
  );
}
