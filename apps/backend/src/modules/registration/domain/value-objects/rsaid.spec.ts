import { RsaIdNumber } from "./rsaid";

// fake, valid south african id numbers
const VALID_MALE_ID = "9001045000089";
const VALID_FEMALE_ID = "0105120084089";

describe("RsaIdNumber", () => {
  describe("create (validation)", () => {
    it("accepts a structurally valid ID number", () => {
      expect(() => RsaIdNumber.create(VALID_MALE_ID)).not.toThrow();
    });

    it("throws when the input is fewer than 13 digits", () => {
      expect(() => RsaIdNumber.create(VALID_FEMALE_ID.slice(1))).toThrow(
        "RSA ID must be exactly 13 digits",
      );
    });

    it("throws when the input is more than 13 digits", () => {
      expect(() => RsaIdNumber.create(VALID_MALE_ID + "1")).toThrow(
        "RSA ID must be exactly 13 digits",
      );
    });

    it("throws when the input contains non-digit characters", () => {
      expect(() => RsaIdNumber.create(Array.from({ length: 13 }, () => "H").join(""))).toThrow(
        "RSA ID must be exactly 13 digits",
      );
    });

    it("throws when the Luhn check digit is wrong", () => {
      // last digit changed from 9 to 0 so checksum invalid.
      expect(() => RsaIdNumber.create(VALID_MALE_ID.slice(0, VALID_MALE_ID.length - 1) + "0")).toThrow(
        "RSA ID failed Luhn validation",
      );
    });

    it("returns an RsaIdNumber instance on success", () => {
      const id = RsaIdNumber.create(VALID_MALE_ID);
      expect(id).toBeInstanceOf(RsaIdNumber);
    });

    it("toString returns the original digit string", () => {
      const id = RsaIdNumber.create(VALID_MALE_ID);
      expect(id.toString()).toBe(VALID_MALE_ID);
    });
  });

  describe("equals", () => {
    it("returns true for two instances created from the same value", () => {
      const a = RsaIdNumber.create(VALID_MALE_ID);
      const b = RsaIdNumber.create(VALID_MALE_ID);
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for two instances created from different values", () => {
      const a = RsaIdNumber.create(VALID_MALE_ID);
      const b = RsaIdNumber.create(VALID_FEMALE_ID);
      expect(a.equals(b)).toBe(false);
    });
  });

  describe("deriveDateOfBirth", () => {
    it("derives the correct date of birth for a 20th-century ID", () => {
      const id = RsaIdNumber.create(VALID_MALE_ID);
      const dob = id.deriveDateOfBirth();
      expect(dob.getFullYear()).toBe(1990);
      expect(dob.getMonth()).toBe(0);
      expect(dob.getDate()).toBe(4);
    });

    it("derives the correct date of birth for a 21st-century ID", () => {
      const id = RsaIdNumber.create(VALID_FEMALE_ID);
      const dob = id.deriveDateOfBirth();
      expect(dob.getFullYear()).toBe(2001);
      expect(dob.getMonth()).toBe(4);
      expect(dob.getDate()).toBe(12);
    });
  });

  describe("deriveGender", () => {
    it("returns MALE when the gender digit is 5 or greater", () => {
      const id = RsaIdNumber.create(VALID_MALE_ID);
      expect(id.deriveGender().value).toBe("MALE");
    });

    it("returns FEMALE when the gender digit is less than 5", () => {
      const id = RsaIdNumber.create(VALID_FEMALE_ID);
      expect(id.deriveGender().value).toBe("FEMALE");
    });
  });
});
