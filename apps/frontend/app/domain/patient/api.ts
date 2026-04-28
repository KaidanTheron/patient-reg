import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { executeGraphql } from "~/domain/graphql/execute";
import {
  DateOfBirthFromRsaIdDocument,
  GenderFromRsaIdDocument,
  GiveConsentDocument,
  MyConsentRecordDocument,
  MyPatientProfileDocument,
  MyRegistrationRequestDocument,
  MyRegistrationRequestsDocument,
  RegistrationConsentTemplateDocument,
  SubmitRegistrationDocument,
  VerifyRegistrationDocument,
} from "~/domain/graphql/operations";
import type {
  SubmitRegistrationDocumentInput,
  VerifyRegistrationInput,
} from "~/graphql/graphql";

const patientKeys = {
  all: ["patient"] as const,
  requests: (token: string | null) => [...patientKeys.all, token, "requests"] as const,
  request: (token: string | null, requestId: string | null) =>
    [...patientKeys.requests(token), requestId] as const,
  profile: (token: string | null) => [...patientKeys.all, token, "profile"] as const,
  consentTemplate: (token: string | null, requestId: string | null) =>
    [...patientKeys.request(token, requestId), "consent-template"] as const,
  consentRecord: (token: string | null, requestId: string | null) =>
    [...patientKeys.request(token, requestId), "consent-record"] as const,
  derived: (rsaId: string) => [...patientKeys.all, "derived", rsaId] as const,
};

export function useVerifyRegistration() {
  return useMutation({
    mutationFn: (input: VerifyRegistrationInput) =>
      executeGraphql({
        document: VerifyRegistrationDocument,
        variables: { input },
      }),
  });
}

export function useMyRegistrationRequests(patientToken: string | null) {
  return useQuery({
    queryKey: patientKeys.requests(patientToken),
    enabled: Boolean(patientToken),
    queryFn: () =>
      executeGraphql({
        document: MyRegistrationRequestsDocument,
        bearerToken: patientToken,
      }),
  });
}

export function useMyRegistrationRequest(
  patientToken: string | null,
  registrationRequestId: string | null,
) {
  return useQuery({
    queryKey: patientKeys.request(patientToken, registrationRequestId),
    enabled: Boolean(patientToken && registrationRequestId),
    queryFn: () =>
      executeGraphql({
        document: MyRegistrationRequestDocument,
        variables: { id: registrationRequestId! },
        bearerToken: patientToken,
      }),
  });
}

export function useMyPatientProfile(patientToken: string | null) {
  return useQuery({
    queryKey: patientKeys.profile(patientToken),
    enabled: Boolean(patientToken),
    queryFn: () =>
      executeGraphql({
        document: MyPatientProfileDocument,
        bearerToken: patientToken,
      }),
  });
}

export function useDerivedRsaIdDetails(rsaId: string, enabled: boolean) {
  return useQuery({
    queryKey: patientKeys.derived(rsaId),
    enabled: enabled && Boolean(rsaId),
    queryFn: async () => {
      const [dob, gender] = await Promise.all([
        executeGraphql({
          document: DateOfBirthFromRsaIdDocument,
          variables: { rsaId },
        }),
        executeGraphql({
          document: GenderFromRsaIdDocument,
          variables: { rsaId },
        }),
      ]);

      return {
        dateOfBirth: dob.dateOfBirthFromRsaId,
        gender: gender.genderFromRsaId,
      };
    },
  });
}

export function useRegistrationConsentTemplate(
  patientToken: string | null,
  registrationRequestId: string | null,
) {
  return useQuery({
    queryKey: patientKeys.consentTemplate(patientToken, registrationRequestId),
    enabled: Boolean(patientToken && registrationRequestId),
    queryFn: () =>
      executeGraphql({
        document: RegistrationConsentTemplateDocument,
        variables: { registrationRequestId: registrationRequestId! },
        bearerToken: patientToken,
      }),
  });
}

export function useMyConsentRecord(
  patientToken: string | null,
  registrationRequestId: string | null,
) {
  return useQuery({
    queryKey: patientKeys.consentRecord(patientToken, registrationRequestId),
    enabled: Boolean(patientToken && registrationRequestId),
    queryFn: () =>
      executeGraphql({
        document: MyConsentRecordDocument,
        variables: { registrationRequestId: registrationRequestId! },
        bearerToken: patientToken,
      }),
  });
}

export function useGiveConsent(patientToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationRequestId: string) =>
      executeGraphql({
        document: GiveConsentDocument,
        variables: { registrationRequestId },
        bearerToken: patientToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
}

export function useSubmitRegistrationDocument(patientToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitRegistrationDocumentInput) =>
      executeGraphql({
        document: SubmitRegistrationDocument,
        variables: { input },
        bearerToken: patientToken,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
}
