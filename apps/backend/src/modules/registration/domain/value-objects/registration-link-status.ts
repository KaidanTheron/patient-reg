export const registrationLinkStatusValues = ["ACTIVE", "REVOKED"] as const;

export type RegistrationLinkStatusValue =
  (typeof registrationLinkStatusValues)[number];

export class RegistrationLinkStatus {
  private constructor(private readonly value: RegistrationLinkStatusValue) {}

  public static active() {
    return new RegistrationLinkStatus("ACTIVE");
  }

  public static revoked() {
    return new RegistrationLinkStatus("REVOKED");
  }

  public static fromPersisted(value: string): RegistrationLinkStatus {
    switch (value) {
      case "ACTIVE":
        return RegistrationLinkStatus.active();
      case "REVOKED":
        return RegistrationLinkStatus.revoked();
      default:
        throw new Error(`Unknown registration link status: ${value}`);
    }
  }

  public equals(other: RegistrationLinkStatus): boolean {
    return this.value === other.value;
  }

  public toString(): RegistrationLinkStatusValue {
    return this.value;
  }
}
