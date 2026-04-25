export class RegistrationLinkStatus {
    private constructor(private readonly value: string) {}
   
    public static active() {
      return new RegistrationLinkStatus("ACTIVE");
    }
  
    public static revoked() {
      return new RegistrationLinkStatus("REVOKED");
    }
  
  
    public equals(other: RegistrationLinkStatus): boolean {
      return this.value === other.value;
    }
  
    public toString(): string {
      return this.value;
    }
}