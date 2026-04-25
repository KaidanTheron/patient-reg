const luhn = (id: string) => {
  const checksum = Number(id[12])
  const checkString = id.slice(0, 12);
  let sum = 0;
  let shouldDouble = true;

  for (let index = checkString.length - 1; index >= 0; index -= 1) {
    let digit = Number(checkString[index]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const expected = (10 - (sum % 10)) % 10 
  return checksum === expected;
}

export class RsaIdNumber {
  private constructor(private readonly value: string) {}

  static create(value: string): RsaIdNumber {
    if (!/^\d{13}$/.test(value)) {
      throw new Error("RSA ID must be exactly 13 digits");
    }
    if (!luhn(value)) {
      throw new Error("RSA ID failed Luhn validation");
    }

    return new RsaIdNumber(value);
  }

  equals(other: RsaIdNumber): boolean {
    return this.value === other.value;
  }

  // assume that person is not older than 100
  deriveDateOfBirth(): Date {
    const yy = Number(this.value.slice(0, 2));
    const mm = Number(this.value.slice(2, 4));
    const dd = Number(this.value.slice(4, 6));

    const currentYear = new Date().getFullYear() % 100;
    const century = yy <= currentYear ? 2000 : 1900;

    return new Date(century + yy, mm - 1, dd);
  }

  toString(): string {
    return this.value;
  }
}