import { Test, TestingModule } from "@nestjs/testing";
import { AuthLinkResolver } from "./auth-link.resolver";
import { AuthLinkService } from "../application/auth-link.service";

describe("AuthLinkResolver", () => {
  let resolver: AuthLinkResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthLinkResolver,
        {
          provide: AuthLinkService,
          useValue: {
            issueRegistrationLink: jest.fn(),
            validateRegistrationLinkToken: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get(AuthLinkResolver);
  });

  it("should be defined", () => {
    expect(resolver).toBeDefined();
  });
});
