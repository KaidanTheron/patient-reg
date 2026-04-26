export const registrationRequestStatusValues = [
  "AWAITING_COMPLETION",
  "AWAITING_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;

export type RegistrationRequestStatusValue =
  (typeof registrationRequestStatusValues)[number];

export class RegistrationStatus {
  constructor(private readonly value: RegistrationRequestStatusValue) {}
  
  public static awaitingCompletion() {
    return new RegistrationStatus("AWAITING_COMPLETION");
  }

  public static awaitingReview() {
    return new RegistrationStatus("AWAITING_REVIEW");
  }

  public static approved() {
    return new RegistrationStatus("APPROVED");
  }

  public static rejected() {
    return new RegistrationStatus("REJECTED");
  }

  public equals(other: RegistrationStatus): boolean {
    return this.value === other.value;
  }

  public toString(): RegistrationRequestStatusValue {
    return this.value;
  }
}