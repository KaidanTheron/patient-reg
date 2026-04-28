import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { executeGraphql } from "~/domain/graphql/execute";
import {
  ApproveRegistrationDocument,
  InitiateRegistrationDocument,
  PatientProfileForPracticeDocument,
  PracticeRegistrationRequestDocument,
  PracticeRegistrationRequestsDocument,
  PracticesDocument,
  RejectRegistrationDocument,
} from "~/domain/graphql/operations";
import type {
  ApproveRegistrationInput,
  InitiateRegistrationInput,
  RejectRegistrationInput,
} from "~/graphql/graphql";

const practiceKeys = {
  all: ["practice"] as const,
  practices: () => [...practiceKeys.all, "practices"] as const,
  requests: (practiceId: string | null) =>
    [...practiceKeys.all, practiceId, "requests"] as const,
  request: (practiceId: string | null, requestId: string) =>
    [...practiceKeys.requests(practiceId), requestId] as const,
  patientProfile: (practiceId: string | null, requestId: string) =>
    [...practiceKeys.request(practiceId, requestId), "patient-profile"] as const,
};

export function usePractices() {
  return useQuery({
    queryKey: practiceKeys.practices(),
    queryFn: () => executeGraphql({ document: PracticesDocument }),
  });
}

export function usePracticeRegistrationRequests(practiceId: string | null) {
  return useQuery({
    queryKey: practiceKeys.requests(practiceId),
    enabled: Boolean(practiceId),
    queryFn: () =>
      executeGraphql({
        document: PracticeRegistrationRequestsDocument,
        bearerToken: practiceId,
      }),
  });
}

export function usePracticeRegistrationRequest(
  practiceId: string | null,
  registrationRequestId: string,
) {
  return useQuery({
    queryKey: practiceKeys.request(practiceId, registrationRequestId),
    enabled: Boolean(practiceId && registrationRequestId),
    queryFn: () =>
      executeGraphql({
        document: PracticeRegistrationRequestDocument,
        variables: { id: registrationRequestId },
        bearerToken: practiceId,
      }),
  });
}

export function usePatientProfileForPractice(
  practiceId: string | null,
  registrationRequestId: string,
) {
  return useQuery({
    queryKey: practiceKeys.patientProfile(practiceId, registrationRequestId),
    enabled: Boolean(practiceId && registrationRequestId),
    queryFn: () =>
      executeGraphql({
        document: PatientProfileForPracticeDocument,
        variables: { registrationRequestId },
        bearerToken: practiceId,
      }),
  });
}

export function useInitiateRegistration(practiceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InitiateRegistrationInput) =>
      executeGraphql({
        document: InitiateRegistrationDocument,
        variables: { input },
        bearerToken: practiceId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: practiceKeys.requests(practiceId),
      });
    },
  });
}

export function useApproveRegistration(practiceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApproveRegistrationInput) =>
      executeGraphql({
        document: ApproveRegistrationDocument,
        variables: { input },
        bearerToken: practiceId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: practiceKeys.all });
    },
  });
}

export function useRejectRegistration(practiceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RejectRegistrationInput) =>
      executeGraphql({
        document: RejectRegistrationDocument,
        variables: { input },
        bearerToken: practiceId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: practiceKeys.all });
    },
  });
}
