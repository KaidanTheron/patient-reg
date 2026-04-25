import { Injectable } from "@nestjs/common";
import { Practice } from "../../domain/entities/practice.entity";
import { NewRegistrationRequest } from "../../domain/entities/registration-request.entity";
import { PatientIdentityRepository } from "../../domain/ports/patient-identity.repository";
import { PracticeRepository } from "../../domain/ports/practice.repository";
import { RegistrationRequestRepository } from "../../domain/ports/registration-request.repository";
import { HashedRsaId } from "../../domain/value-objects/hashed-rsaid";
import { Notifier } from "../../domain/ports/notifier";

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
  patientIdentityId: HashedRsaId;
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
        private readonly patientIdentities: PatientIdentityRepository,
        private readonly practices: PracticeRepository,
        private readonly notifier: Notifier,
    ) {}

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
            request,
        );

        return {
            registrationRequestId: request.id,
            registrationRequestStatus: request.getStatus().toString(),
        };
    }

    async initiateRegistration(
        command: InitiateRegistrationCommand,
    ): Promise<InitiateRegistrationResult> {
        const { patientIdentityId, practiceId } = command;
        const patientValid = await this.patientIdentities.exists(patientIdentityId);

        if (!patientValid) {
            throw new Error("Registrant not found.");
        }

        const practice = await this.practices.findById(practiceId);

        if (!practice) {
            throw new Error("Practice not found.");
        }

        const newRequest = NewRegistrationRequest.create(
            patientIdentityId,
            practiceId,
        );

        const created = await this.registrationRequests.create(newRequest);

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
}