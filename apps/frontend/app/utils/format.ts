import type { RegistrationRequestPayload } from "~/graphql/graphql";

export function humanizeStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function patientDisplayName(
  patient: RegistrationRequestPayload["patient"],
) {
  const name = [patient?.firstname, patient?.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "Patient details pending";
}

export function nullableValue(value: string | null | undefined) {
  return value?.trim() || "Not provided";
}

export function isEditableRegistration(status: string) {
  const normalized = status.toLowerCase();
  return (
    normalized.includes("awaiting_completion") ||
    normalized.includes("awaiting completion") ||
    normalized.includes("rejected") ||
    normalized.includes("needs_revision") ||
    normalized.includes("needs revision")
  );
}

export function isReviewableRegistration(status: string) {
  const normalized = status.toLowerCase();
  return (
    normalized.includes("awaiting_review") ||
    normalized.includes("awaiting review") ||
    normalized.includes("submitted")
  );
}
