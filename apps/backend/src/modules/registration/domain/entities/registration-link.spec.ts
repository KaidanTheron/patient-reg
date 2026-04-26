import { HashedRsaId } from "../value-objects/hashed-rsaid";
import { RegistrationLinkStatus } from "../value-objects/registration-link-status";
import {
  DraftRegistrationLink,
  RegistrationLink,
} from "./registration-link.entity";

describe("RegistrationLink", () => {
  const patient = HashedRsaId.fromPersisted("hashed-rsa-id");
  const createdByStaffId = "staff-1";

  it("creates an active persisted registration link", () => {
    const link = new RegistrationLink(
      "link-1",
      RegistrationLinkStatus.active(),
      new Date("2099-01-01T00:00:00.000Z"),
      patient,
      createdByStaffId,
      0,
      3,
    );

    expect(link.getStatus().equals(RegistrationLinkStatus.active())).toBe(true);
    expect(link.canBeUsed(patient, new Date("2098-01-01T00:00:00.000Z"))).toBe(
      true,
    );
  });

  it("revokes a link when consumed", () => {
    const link = new RegistrationLink(
      "link-1",
      RegistrationLinkStatus.active(),
      new Date("2099-01-01T00:00:00.000Z"),
      patient,
      createdByStaffId,
      0,
      3,
    );

    link.consume(patient, new Date("2098-01-01T00:00:00.000Z"));

    expect(link.getStatus().equals(RegistrationLinkStatus.revoked())).toBe(
      true,
    );
    expect(link.canBeUsed(patient, new Date("2098-01-01T00:00:00.000Z"))).toBe(
      false,
    );
  });

  it("creates a draft registration link for a patient", () => {
    const link = DraftRegistrationLink.create(patient, createdByStaffId);

    expect(link.patient).toBe(patient);
    expect(link.createdByStaffId).toBe(createdByStaffId);
    expect(link.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(link.maxAttempts).toBe(3);
  });
});
