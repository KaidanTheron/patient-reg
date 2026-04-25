export class RegistrationStatus {
  private constructor(private readonly value: string) {}
  
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

  public toString(): string {
    return this.value;
  }
}