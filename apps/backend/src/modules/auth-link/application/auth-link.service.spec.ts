import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { AuthLinkService } from "./auth-link.service";
import { AuthLinkRepository } from "../domain/ports/auth-link.repository";
import { AuthLinkTokenSigner } from "../domain/ports/auth-link-token.signer";
import { AuthLinkNotifier } from "../domain/ports/auth-link.notifier";
import { AuthLinkFormatter } from "../domain/ports/auth-link.formatter";
import { IdentityHasher } from "../../identity/domain/ports/identity.hasher";
import { AuthLinkStatus } from "../domain/auth-link-status";
import { AUTH_LINK_TTL_MS } from "../domain/auth-link.constants";

describe("AuthLinkService", () => {
  let service: AuthLinkService;
  let repository: jest.Mocked<Pick<AuthLinkRepository, keyof AuthLinkRepository>>;
  let signer: jest.Mocked<Pick<AuthLinkTokenSigner, keyof AuthLinkTokenSigner>>;
  let notifier: jest.Mocked<Pick<AuthLinkNotifier, "notify">>;
  let formatter: jest.Mocked<Pick<AuthLinkFormatter, "format">>;
  let identityHasher: jest.Mocked<Pick<IdentityHasher, "hash">>;

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
    notifier = {
      notify: jest.fn().mockResolvedValue(true),
    };
    formatter = {
      format: jest.fn().mockReturnValue("http://localhost:5173/jwt-token"),
    };
    identityHasher = {
      hash: jest.fn(async (plain: string) => `hashed:${plain}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthLinkService,
        { provide: AuthLinkRepository, useValue: repository },
        { provide: AuthLinkTokenSigner, useValue: signer },
        { provide: AuthLinkNotifier, useValue: notifier },
        { provide: AuthLinkFormatter, useValue: formatter },
        { provide: IdentityHasher, useValue: identityHasher },
      ],
    }).compile();

    service = module.get(AuthLinkService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("issueRegistrationLink", () => {
    it("revokes existing active links, persists a new link, and notifies with a formatted URL", async () => {
      repository.createNew.mockImplementation(async (params) => ({
        id: 1,
        uuid: "link-uuid",
        patient: params.patient,
        status: AuthLinkStatus.ACTIVE,
        createdBy: params.createdBy,
        expiresAt: params.expiresAt,
        attemptCount: 0,
      }));
      signer.sign.mockReturnValue("jwt-token");

      await service.issueRegistrationLink({
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
      expect(formatter.format).toHaveBeenCalledWith("jwt-token");
      expect(notifier.notify).toHaveBeenCalledWith(
        "patient-a",
        "Open http://localhost:5173/jwt-token in your browser",
      );
    });
  });

  describe("validateRegistrationLinkToken", () => {
    it("returns uuid and patient when token, id hash, and persisted link are active", async () => {
      signer.verify.mockReturnValue({ linkUuid: "link-uuid" });
      const expiresAt = new Date(Date.now() + 60_000);
      const plainId = "9001010000082";
      repository.findByUuid.mockResolvedValue({
        id: 1,
        uuid: "link-uuid",
        patient: `hashed:${plainId}`,
        status: AuthLinkStatus.ACTIVE,
        createdBy: "staff-1",
        expiresAt,
        attemptCount: 0,
      });

      await expect(
        service.validateRegistrationLinkToken("tok", plainId),
      ).resolves.toEqual({ uuid: "link-uuid", patient: `hashed:${plainId}` });
      expect(identityHasher.hash).toHaveBeenCalledWith(plainId);
    });

    it("rejects when hashed id does not match link patient", async () => {
      signer.verify.mockReturnValue({ linkUuid: "link-uuid" });
      repository.findByUuid.mockResolvedValue({
        id: 1,
        uuid: "link-uuid",
        patient: "hashed:other-id",
        status: AuthLinkStatus.ACTIVE,
        createdBy: "staff-1",
        expiresAt: new Date(Date.now() + 60_000),
        attemptCount: 0,
      });

      await expect(
        service.validateRegistrationLinkToken("tok", "9001010000082"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects invalid jwt", async () => {
      signer.verify.mockImplementation(() => {
        throw new Error("bad token");
      });

      await expect(
        service.validateRegistrationLinkToken("tok", "id"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects missing link", async () => {
      signer.verify.mockReturnValue({ linkUuid: "missing" });
      repository.findByUuid.mockResolvedValue(null);

      await expect(
        service.validateRegistrationLinkToken("tok", "id"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects revoked link", async () => {
      signer.verify.mockReturnValue({ linkUuid: "link-uuid" });
      const plainId = "9001010000082";
      repository.findByUuid.mockResolvedValue({
        id: 1,
        uuid: "link-uuid",
        patient: `hashed:${plainId}`,
        status: AuthLinkStatus.REVOKED,
        createdBy: "staff-1",
        expiresAt: new Date(Date.now() + 60_000),
        attemptCount: 0,
      });

      await expect(
        service.validateRegistrationLinkToken("tok", plainId),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects expired link", async () => {
      signer.verify.mockReturnValue({ linkUuid: "link-uuid" });
      const plainId = "9001010000082";
      repository.findByUuid.mockResolvedValue({
        id: 1,
        uuid: "link-uuid",
        patient: `hashed:${plainId}`,
        status: AuthLinkStatus.ACTIVE,
        createdBy: "staff-1",
        expiresAt: new Date(Date.now() - 60_000),
        attemptCount: 0,
      });

      await expect(
        service.validateRegistrationLinkToken("tok", plainId),
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
    it("increments attempts", async () => {
      const link = {
        id: 1,
        uuid: "link-uuid",
        patient: "patient-a",
        status: AuthLinkStatus.ACTIVE,
        createdBy: "staff-1",
        expiresAt: new Date(Date.now() + 60_000),
        attemptCount: 2,
      };
      repository.findByUuid.mockResolvedValue(link);

      await service.recordFailedVerificationAttempt("link-uuid");

      expect(repository.saveState).toHaveBeenCalledWith(
        expect.objectContaining({
          attemptCount: 3,
        }),
      );
    });
  });
});
