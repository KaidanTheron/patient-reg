export class ContactDetails {
  private constructor(
    public readonly email: string,
    public readonly phoneNumber: string,
    public readonly residentialAddress: string,
  ) {}

  static create(params: {
    email: string;
    phoneNumber: string;
    residentialAddress: string;
  }): ContactDetails {
    const email = params.email.trim();
    const phoneNumber = params.phoneNumber.trim();
    const residentialAddress = params.residentialAddress.trim();
    if (!email || !phoneNumber || !residentialAddress) {
      throw new Error(
        "Email, phone number, and residential address are required",
      );
    }
    return new ContactDetails(email, phoneNumber, residentialAddress);
  }

  /**
   * Restores a document after decryption or tests; reuses the same invariants
   * as {@link create}.
   */
  static fromPlain(params: {
    email: string;
    phoneNumber: string;
    residentialAddress: string;
  }): ContactDetails {
    return ContactDetails.create(params);
  }
}
