import type {
  ContactDetailsPayload,
  MedicalAidDetailsPayload,
  MedicalHistoryPayload,
  PatientProfilePayload,
  PersonalInformationPayload,
} from "~/graphql/graphql";
import { nullableValue } from "~/utils/format";

type FieldSource = {
  label: string;
  current?: string | null;
  submitted?: string | null;
};

export type RegistrationDiffStatus =
  | "new"
  | "updated"
  | "missing"
  | "unchanged";

type RegistrationDocumentShape = {
  contactDetails?: ContactDetailsPayload | null;
  personalInformation?: PersonalInformationPayload | null;
  medicalAidDetails?: MedicalAidDetailsPayload | null;
  medicalHistory?: MedicalHistoryPayload | null;
};

export function buildRegistrationDiff(
  current?: PatientProfilePayload | null,
  submitted?: RegistrationDocumentShape | null,
) {
  const fields: FieldSource[] = [
    {
      label: "First name",
      current: current?.personalInformation?.firstname,
      submitted: submitted?.personalInformation?.firstname,
    },
    {
      label: "Last name",
      current: current?.personalInformation?.lastname,
      submitted: submitted?.personalInformation?.lastname,
    },
    {
      label: "Date of birth",
      current: current?.personalInformation?.dateOfBirth,
      submitted: submitted?.personalInformation?.dateOfBirth,
    },
    {
      label: "Gender",
      current: current?.personalInformation?.gender,
      submitted: submitted?.personalInformation?.gender,
    },
    {
      label: "Email",
      current: current?.contactDetails?.email,
      submitted: submitted?.contactDetails?.email,
    },
    {
      label: "Phone",
      current: current?.contactDetails?.phone,
      submitted: submitted?.contactDetails?.phone,
    },
    {
      label: "Alternative phone",
      current: current?.contactDetails?.altphone,
      submitted: submitted?.contactDetails?.altphone,
    },
    {
      label: "Residential address",
      current: current?.contactDetails?.address,
      submitted: submitted?.contactDetails?.address,
    },
    {
      label: "Medical aid scheme",
      current: current?.medicalAidDetails?.scheme,
      submitted: submitted?.medicalAidDetails?.scheme,
    },
    {
      label: "Member number",
      current: current?.medicalAidDetails?.memberNumber,
      submitted: submitted?.medicalAidDetails?.memberNumber,
    },
    {
      label: "Main member",
      current: current?.medicalAidDetails?.mainMember,
      submitted: submitted?.medicalAidDetails?.mainMember,
    },
    {
      label: "Main member ID",
      current: current?.medicalAidDetails?.mainMemberId,
      submitted: submitted?.medicalAidDetails?.mainMemberId,
    },
    {
      label: "Dependant code",
      current: current?.medicalAidDetails?.dependantCode,
      submitted: submitted?.medicalAidDetails?.dependantCode,
    },
    {
      label: "Allergies",
      current: current?.medicalHistory?.allergies,
      submitted: submitted?.medicalHistory?.allergies,
    },
    {
      label: "Current medication",
      current: current?.medicalHistory?.currentMedication,
      submitted: submitted?.medicalHistory?.currentMedication,
    },
    {
      label: "Chronic conditions",
      current: current?.medicalHistory?.chronicConditions,
      submitted: submitted?.medicalHistory?.chronicConditions,
    },
    {
      label: "Previous surgeries",
      current: current?.medicalHistory?.previousSurgeries,
      submitted: submitted?.medicalHistory?.previousSurgeries,
    },
    {
      label: "Family history",
      current: current?.medicalHistory?.familyHistory,
      submitted: submitted?.medicalHistory?.familyHistory,
    },
  ];

  return fields.map((field) => {
    const currentDisplay = nullableValue(field.current);
    const submittedDisplay = nullableValue(field.submitted);
    const status = getDiffStatus(field.current, field.submitted);

    return {
      ...field,
      currentDisplay,
      submittedDisplay,
      status,
      changed: status !== "unchanged",
    };
  });
}

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function normalized(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function getDiffStatus(
  current: string | null | undefined,
  submitted: string | null | undefined,
): RegistrationDiffStatus {
  const currentHasValue = hasValue(current);
  const submittedHasValue = hasValue(submitted);

  if (!currentHasValue && submittedHasValue) return "new";
  if (currentHasValue && !submittedHasValue) return "missing";
  if (normalized(current) !== normalized(submitted)) return "updated";

  return "unchanged";
}
