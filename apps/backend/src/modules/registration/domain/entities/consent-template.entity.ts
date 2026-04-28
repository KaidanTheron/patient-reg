export const consentTypeValues = ["REGISTRATION"] as const;
export type ConsentType = (typeof consentTypeValues)[number];

export class ConsentTemplate {
  constructor(
    public readonly id: string,
    public readonly practiceId: string,
    public readonly consentType: ConsentType,
    public readonly version: string,
    public readonly text: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}
}

export class DraftConsentTemplate {
  constructor(
    public readonly practiceId: string,
    public readonly consentType: ConsentType,
    public readonly version: string,
    public readonly text: string,
    public readonly isActive: boolean = true,
  ) {}
}
