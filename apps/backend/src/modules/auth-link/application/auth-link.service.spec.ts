import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { AuthLinkService } from "./auth-link.service";
import { AuthLinkRepository } from "../domain/ports/auth-link.repository";
import { AuthLinkTokenSigner } from "../domain/ports/auth-link-token.signer";
import { AuthLinkStatus } from "../domain/auth-link-status";
import { AUTH_LINK_TTL_MS } from "../domain/auth-link.constants";

describe("AuthLinkService", () => {
  let service: AuthLinkService;
  let repository: jest.Mocked<Pick<AuthLinkRepository, keyof AuthLinkRepository>>;
  let signer: jest.Mocked<Pick<AuthLinkTokenSigner, keyof AuthLinkTokenSigner>>;

  beforeEach(async () => {
    repository = {
      revokeAllActiveForPatient: jest.fn().mockResolvedValue(undefined),
      createNew: jest.fn(),
      findByUuid: jest.fn(),
      saveState: jest.fn().mockResolvedValue(undefined),
    };
    signer = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthLinkService,
        { provide: AuthLinkRepository, useValue: repository },
        { provide: AuthLinkTokenSigner, useValue: signer },
      ],
    }).compile();

    service = module.get(AuthLinkService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("issueRegistrationLink", () => {
    it("revokes existing active links, persists a new link, and returns a signed token", async () => {
      repository.createNew.mockImplementation(async (params) => ({
        id: 1,
        uuid: "link-uuid",
        patient: params.patient,
        status: AuthLinkStatus.ACTIVE,
        createdBy: params.createdBy,
        expiresAt: params.expiresAt,
        lastAttemptAt: null,
        attemptCount: 0,
      }));
      signer.sign.mockReturnValue("jwt-token");

      const result = await service.issueRegistrationLink({
        patient: "patient-a",
        createdBy: "staff-1",
      });

      expect(repository.revokeAllActiveForPatient).toHaveBeenCalledWith(
        "patient-a",
      );
      const created = repository.createNew.mock.calls[0][0];
      expect(created.patient).toBe("patient-a");
      expect(created.createdBy).toBe("staff-1");
      expect(created.expiresAt.getTime() - Date.now()).toBeGreaterThan(
        AUTH_LINK_TTL_MS - 2000,
      );
      expect(signer.sign).toHaveBeenCalledWith("link-uuid", created.expiresAt);
      expect(result).toEqual({
        token: "jwt-token",
        uuid: "link-uuid",
        expiresAt: created.expiresAt,
      });
    });
  });

  describe("validateRegistrationLinkToken", () => {
    it("returns uuid and patient when token and persisted link are active", async () => {
      signer.verify.mockReturnValue({ linkUuid: "link-uuid" });
      const expiresAt = new Date(Date.now() + 60_000);
      repository.findByUuid.mockResolvedValue({
        id: 1,
        uuid: "link-uuid",
        patient: "patient-a",
        status: AuthLinkStatus.ACTIVE,
        createdBy: "staff-1",
        expiresAt,
        attemptCount: 0,
      });

      await expect(
        service.validateRegistrationLinkToken("tok"),
      ).resolves.toEqual({ uuid: "link-uuid", patient: "patient-a" });
    });

    it("rejects invalid jwt", async () => {
      signer.verify.mockImplementation(() => {
        throw new Error("bad token");
      });

      await expect(
        service.validateRegistrationLinkToken("tok"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects missing link", async () => {
      signer.verify.mockReturnValue({ linkUuid: "missing" });
      repository.findByUuid.mockResolvedValue(null);

      await expect(
        service.validateRegistrationLinkToken("tok"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects revoked link", async () => {
      signer.verify.mockReturnValue({ linkUuid: "link-uuid" });
      repository.findByUuid.mockResolvedValue({
        id: 1,
        uuid: "link-uuid",
        patient: "patient-a",
        status: AuthLinkStatus.REVOKED,
        createdBy: "staff-1",
        expiresAt: new Date(Date.now() + 60_000),
        attemptCount: 0,
      });

      await expect(
        service.validateRegistrationLinkToken("tok"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects expired link", async () => {
      signer.verify.mockReturnValue({ linkUuid: "link-uuid" });
      repository.findByUuid.mockResolvedValue({
        id: 1,
        uuid: "link-uuid",
        patient: "patient-a",
        status: AuthLinkStatus.ACTIVE,
        createdBy: "staff-1",
        expiresAt: new Date(Date.now() - 60_000),
        attemptCount: 0,
      });

      await expect(
        service.validateRegistrationLinkToken("tok"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("revokeAfterSuccessfulVerification", () => {
    it("marks an active link as revoked", async () => {
      const link = {
        id: 1,
        uuid: "link-uuid",
        patient: "patient-a",
        status: AuthLinkStatus.ACTIVE,
        createdBy: "staff-1",
        expiresAt: new Date(Date.now() + 60_000),
        lastAttemptAt: null,
        attemptCount: 0,
      };
      repository.findByUuid.mockResolvedValue(link);

      await service.revokeAfterSuccessfulVerification("link-uuid");

      expect(repository.saveState).toHaveBeenCalledWith({
        ...link,
        status: AuthLinkStatus.REVOKED,
      });
    });
  });

  describe("recordFailedVerificationAttempt", () => {
    it("increments attempts and sets lastAttemptAt", async () => {
      const before = new Date(Date.now() - 5_000);
      const link = {
        id: 1,
        uuid: "link-uuid",
        patient: "patient-a",
        status: AuthLinkStatus.ACTIVE,
        createdBy: "staff-1",
        expiresAt: new Date(Date.now() + 60_000),
        lastAttemptAt: before,
        attemptCount: 2,
      };
      repository.findByUuid.mockResolvedValue(link);

      await service.recordFailedVerificationAttempt("link-uuid");

      expect(repository.saveState).toHaveBeenCalledWith(
        expect.objectContaining({
          attemptCount: 3,
          lastAttemptAt: expect.any(Date),
        }),
      );
    });
  });
});
