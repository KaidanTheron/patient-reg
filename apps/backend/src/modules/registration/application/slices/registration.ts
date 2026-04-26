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
import { Encrypter } from "../../domain/ports/encrypter";

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

export type DeriveDataCommand = {
    patientIdentityId: string
}

@Injectable()
export class RegistrationService {
    constructor(
        private readonly registrationRequests: RegistrationRequestRepository,
        private readonly registrationLinks: RegistrationLinkRepository,
        private readonly patientIdentities: PatientIdentityRepository,
        private readonly practices: PracticeRepository,
        private readonly notifier: Notifier,
        private readonly hasher: Hasher,
        private readonly encrypter: Encrypter,
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

    // rejects a registration submission
    async rejectRegistration() {};

    // creates registration request, auth link and notifies patient
    async initiateRegistration(
        command: InitiateRegistrationCommand,
    ): Promise<InitiateRegistrationResult> {
        const { patientIdentityId: rawIdentity, practiceId, initiatedByStaffId } = command;
        const identity = RsaIdNumber.create(rawIdentity);
        const hashedIdentity = await HashedRsaId.create(identity, this.hasher);

        const [patient, practice] = await Promise.all([
            this.patientIdentities.findById(hashedIdentity),
            this.practices.findById(practiceId)
        ]);

        if (!patient) {
            throw new Error("Registrant not found.");
        }

        if (!patient.email && !patient.phone) {
            throw new Error("Registrant contact details not found, unable to initiate registration privately.")
        }

        if (!practice) {
            throw new Error("Practice not found.");
        }

        const alreadyExists = await this.registrationRequests.findByPatientAndPractice(hashedIdentity, practiceId);
        if (alreadyExists) {
            throw new Error("A registration request for this patient already exists")
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
        const rawEmail = await patient.email?.decrypt(this.encrypter);
        const rawPhone = await patient.phone?.decrypt(this.encrypter);
        await this.notifier.notify(
            rawEmail ?? rawPhone!, // one of the two will be defined because of check
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

    deriveData(command: DeriveDataCommand) {
        const { patientIdentityId: rawIdentity } = command;
        const identity = RsaIdNumber.create(rawIdentity);

        return identity.deriveDateOfBirth();
    };
}