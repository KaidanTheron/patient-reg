import { Practice } from "~/modules/registration/domain/entities/practice.entity";

/**
 * For staff-only calls protected by `PracticeSessionGuard` where
 * `Authorization: Bearer` carries the practice id (this project’s minimal auth).
 */
export type VerifiedPracticeSession = {
  practiceId: Practice["id"];
};
