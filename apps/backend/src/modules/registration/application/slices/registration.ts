import { Injectable } from "@nestjs/common";
import { Practice } from "../../domain/entities/practice.entity";
import { PatientIdentityRepository } from "../../domain/ports/patient-identity.repository";
import { PracticeRepository } from "../../domain/ports/practice.repository";
import { RegistrationRequestRepository } from "../../domain/ports/registration-request.repository";
import { Notifier } from "../../domain/ports/notifier";
import { RegistrationLinkTokenSigner } from "../../domain/ports/registration-link-token.signer";
import { RegistrationLinkFormatter } from "../../domain/ports/registration-link.formatter";
import { DraftRegistrationRequest, UpdateRegistrationRequest } from "../../domain/entities/registration-request.entity";
import { DraftRegistrationLink } from "../../domain/entities/registration-link.entity";
import { HashedRsaId } from "../../domain/value-objects/hashed-rsaid";
import { RsaIdNumber } from "../../domain/value-objects/rsaid";
import { Hasher } from "../../domain/ports/hasher";
import { RegistrationLinkRepository } from "../../domain/ports/registration-link.repository";

export type CreatePracticeCommand = {
  name: string;
};

export type PracticeResult = {
  id: string;
  name: string;
};

export type ApproveRegistrationCommand = {
  registrationRequestId: string;
  approvedByStaffId: string;
};

export type ApproveRegistrationResult = {
  registrationRequestId: string;
  registrationRequestStatus: string;
};

export type InitiateRegistrationCommand = {
  patientIdentityId: string;
  practiceId: string;
  initiatedByStaffId: string;
};

export type InitiateRegistrationResult = {
  registrationRequestId: string;
  registrationRequestStatus: string;
};

@Injectable()
export class RegistrationService {
    constructor(
        private readonly registrationRequests: RegistrationRequestRepository,
        private readonly registrationLinks: RegistrationLinkRepository,
        private readonly patientIdentities: PatientIdentityRepository,
        private readonly practices: PracticeRepository,
        private readonly notifier: Notifier,
        private readonly hasher: Hasher,
        private readonly registrationLinkTokenSigner: RegistrationLinkTokenSigner,
        private readonly registrationLinkFormatter: RegistrationLinkFormatter,
    ) {}

    // updates registration request status, updates patient record and links patient and practice
    async approveRegistration(
        command: ApproveRegistrationCommand,
    ): Promise<ApproveRegistrationResult> {
        const request = await this.registrationRequests.findById(
            command.registrationRequestId,
        );

        if (!request) {
            throw new Error("Registration request not found");
        }

        request.approve();

        await this.registrationRequests.update(
            command.registrationRequestId,
            new UpdateRegistrationRequest(request.getStatus()),
        );

        return {
            registrationRequestId: request.id,
            registrationRequestStatus: request.getStatus().toString(),
        };
    }

    // creates registration request, auth link and notifies patient
    async initiateRegistration(
        command: InitiateRegistrationCommand,
    ): Promise<InitiateRegistrationResult> {
        const { patientIdentityId: rawIdentity, practiceId, initiatedByStaffId } = command;
        const identity = RsaIdNumber.create(rawIdentity);
        const hashedIdentity = await HashedRsaId.create(identity, this.hasher);

        const [patientValid, practice] = await Promise.all([
            this.patientIdentities.exists(hashedIdentity),
            this.practices.findById(practiceId)
        ]);

        if (!patientValid) {
            throw new Error("Registrant not found.");
        }

        if (!practice) {
            throw new Error("Practice not found.");
        }

        const newRequest = new DraftRegistrationRequest(
            hashedIdentity,
            practiceId,
        );

        const created = await this.registrationRequests.create(newRequest);

        await this.registrationLinks.revokeActiveForPatient(hashedIdentity);

        const draftLink = DraftRegistrationLink.create(
            hashedIdentity,
            initiatedByStaffId,
        );
        const link = await this.registrationLinks.create(draftLink);

        const token = this.registrationLinkTokenSigner.sign({
            registrationLinkId: link.id,
            expiresAt: link.expiresAt,
        });
        const sendableUrl = this.registrationLinkFormatter.format(token);
        await this.notifier.notify(
            hashedIdentity.toString(),
            `Open ${sendableUrl} in your browser to continue registration (request ${created.id}).`,
        );

        return {
            registrationRequestId: created.id,
            registrationRequestStatus: created.getStatus().toString(),
        };
    }


    async createPractice(
        command: CreatePracticeCommand,
    ): Promise<PracticeResult> {
        if (!command.name.trim()) {
            throw new Error("Practice name is required");
        }

        const practice = await this.practices.create(command.name.trim());

        return this.toResult(practice);
    }

    async findPracticeById(id: Practice["id"]): Promise<PracticeResult | null> {
        const practice = await this.practices.findById(id);
        return practice ? this.toResult(practice) : null;
    }

    async findPractices(): Promise<PracticeResult[]> {
        const practices = await this.practices.findAll();
        return practices.map((practice) => this.toResult(practice));
    }

    private toResult(practice: Practice): PracticeResult {
        return {
            id: practice.id,
            name: practice.name,
        };
    }

    // accepts registation document
    async submitRegistration() {};

    // resends registration link for patient
    async resendRegistrationLink() {};

    // verifies that user is patient corresponding to registration link
    async verifyRegistration() {};
}