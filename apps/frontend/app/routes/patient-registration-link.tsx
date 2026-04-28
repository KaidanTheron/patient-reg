import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useFetcher, useLoaderData, useParams } from "react-router";
import {
  emptyRegistrationForm,
  formFromProfile,
  RegistrationFields,
  type RegistrationFormState,
} from "~/components/RegistrationFields";
import {
  AppShell,
  Button,
  Field,
  inputClass,
  Notice,
  Panel,
} from "~/components/Layout";
import { executeGraphql } from "~/domain/graphql/execute";
import { CheckRegistrationLinkValidityDocument } from "~/domain/graphql/operations";
import {
  useDerivedRsaIdDetails,
  useGiveConsent,
  useMyConsentRecord,
  useMyPatientProfile,
  useMyRegistrationRequest,
  useMyRegistrationRequests,
  useRegistrationConsentTemplate,
  useSubmitRegistrationDocument,
  useVerifyRegistration,
} from "~/domain/patient/api";
import type { Route } from "./+types/patient-registration-link";
import {
  humanizeStatus,
  isEditableRegistration,
  nullableValue,
} from "~/utils/format";

export async function loader({ params }: Route.LoaderArgs) {
  const token = params.token ?? "";
  const data = await executeGraphql({
    document: CheckRegistrationLinkValidityDocument,
    variables: { token },
  });

  return {
    token,
    isValid: data.checkRegistrationLinkValidity,
  };
}

function verificationMessage(
  errorCode?: string | null,
  attemptsAfterFailure?: number | null,
  maxAttempts?: number | null,
) {
  const remaining =
    maxAttempts != null && attemptsAfterFailure != null
      ? Math.max(maxAttempts - attemptsAfterFailure, 0)
      : null;
  const suffix =
    remaining == null
      ? ""
      : ` ${remaining} ${remaining === 1 ? "attempt" : "attempts"} left.`;

  switch (errorCode) {
    case "IDENTITY_MISMATCH":
      return `That ID does not match this registration link.${suffix}`;
    case "ATTEMPTS_EXHAUSTED":
      return "Too many incorrect attempts were made. This link has been revoked.";
    case "EXPIRED":
      return "This registration link has expired. Please ask your practice for a new link.";
    case "LINK_REVOKED":
      return "This registration link has been revoked. Please ask your practice for a new link.";
    case "INVALID_LINK_TOKEN":
    case "REGISTRATION_LINK_NOT_FOUND":
      return "This registration link is not valid. Please ask your practice for a new link.";
    default:
      return "Verification failed. Please check the ID number and try again.";
  }
}

export default function PatientRegistrationLinkRoute() {
  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const patientSessionFetcher = useFetcher();
  const token = loaderData.token || params.token || "";
  const verify = useVerifyRegistration();
  const [rsaId, setRsaId] = useState("");
  const [patientToken, setPatientToken] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [formState, setFormState] = useState<RegistrationFormState>(
    emptyRegistrationForm,
  );
  const [formWasSeededFor, setFormWasSeededFor] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const requestsQuery = useMyRegistrationRequests(patientToken);
  const selectedRequestQuery = useMyRegistrationRequest(
    patientToken,
    selectedRequestId,
  );
  const profileQuery = useMyPatientProfile(patientToken);
  const derivedQuery = useDerivedRsaIdDetails(rsaId, Boolean(patientToken));
  const consentTemplateQuery = useRegistrationConsentTemplate(
    patientToken,
    selectedRequestId,
  );
  const consentRecordQuery = useMyConsentRecord(patientToken, selectedRequestId);
  const giveConsent = useGiveConsent(patientToken);
  const submitRegistration = useSubmitRegistrationDocument(patientToken);

  const selectedRequest = selectedRequestQuery.data?.myRegistrationRequest;
  const canEdit = selectedRequest
    ? isEditableRegistration(selectedRequest.registrationRequestStatus)
    : false;
  const hasConsent = Boolean(consentRecordQuery.data?.myConsentRecord);
  const canSubmit = Boolean(canEdit && selectedRequestId && hasConsent);

  useEffect(() => {
    if (!selectedRequestId || !profileQuery.data || !derivedQuery.data) return;
    if (formWasSeededFor === selectedRequestId) return;

    setFormState(
      formFromProfile(
        profileQuery.data.myPatientProfile,
        derivedQuery.data,
        selectedRequestQuery.data?.myRegistrationRequest.document,
      ),
    );
    setFormWasSeededFor(selectedRequestId);
  }, [
    derivedQuery.data,
    formWasSeededFor,
    profileQuery.data,
    selectedRequestId,
    selectedRequestQuery.data,
  ]);

  const verifyError = useMemo(() => {
    const result = verify.data?.verifyRegistration;
    if (!result || result.success) return null;
    return verificationMessage(
      result.errorCode,
      result.attemptsAfterFailure,
      result.maxAttempts,
    );
  }, [verify.data]);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);
    if (!/^\d+$/.test(rsaId)) {
      setClientError("Enter the ID number using numbers only.");
      return;
    }

    const data = await verify.mutateAsync({
      token,
      rsaId,
    });
    const result = data.verifyRegistration;
    if (result.success && result.sessionToken) {
      setPatientToken(result.sessionToken);
      void patientSessionFetcher.submit(
        {
          patientToken: result.sessionToken,
          expiresAt: result.expiresAt ?? "",
        },
        {
          method: "post",
          action: "/session/patient",
        },
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRequestId || !canSubmit) return;

    await submitRegistration.mutateAsync({
      registrationRequestId: selectedRequestId,
      contactDetails: formState.contactDetails,
      personalInformation: formState.personalInformation,
      medicalAidDetails: formState.medicalAidDetails,
      medicalHistory: formState.medicalHistory,
    });
    setSelectedRequestId(null);
    setFormWasSeededFor(null);
  }

  if (!loaderData.isValid) {
    return (
      <AppShell title="Registration link">
        <Notice title="Oops, this link is not valid" tone="danger">
          Please contact one of your PatientReg registered practices to send you
          a new registration link.
        </Notice>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Patient registration"
      title={patientToken ? "Registration inbox" : "Verify your identity"}
    >
      <div className="grid gap-4">
        <Panel>
          <form className="grid max-w-xl gap-3" onSubmit={handleVerify}>
            <Field label="South African ID">
              <input
                className={inputClass}
                inputMode="numeric"
                value={rsaId}
                disabled={Boolean(patientToken)}
                onChange={(event) =>
                  setRsaId(event.target.value.replace(/\D/g, ""))
                }
              />
            </Field>
            {!patientToken ? (
              <div>
                <Button type="submit" disabled={verify.isPending}>
                  {verify.isPending ? "Verifying..." : "Verify identity"}
                </Button>
              </div>
            ) : null}
            {clientError ? (
              <Notice title="Check the ID number" tone="warning">
                {clientError}
              </Notice>
            ) : null}
            {verifyError ? (
              <Notice title="Verification failed" tone="danger">
                {verifyError}
              </Notice>
            ) : null}
            {patientToken ? (
              <Notice title="Identity verified" tone="success">
                Your ID is kept only for this page session and cannot be edited
                after verification.
              </Notice>
            ) : null}
          </form>
        </Panel>

        {patientToken && !selectedRequestId ? (
          <Panel>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Requests</h2>
            </div>
            {requestsQuery.isLoading ? <Notice title="Loading requests" /> : null}
            {requestsQuery.error ? (
              <Notice title="Unable to load requests" tone="danger">
                {(requestsQuery.error as Error).message}
              </Notice>
            ) : null}
            <div className="grid gap-3">
              {requestsQuery.data?.myRegistrationRequests.map((request) => (
                <button
                  key={request.registrationRequestId}
                  className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-slate-400"
                  onClick={() => {
                    setSelectedRequestId(request.registrationRequestId);
                    setFormWasSeededFor(null);
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{request.practiceName}</p>
                      {request.rejectionReason ? (
                        <p className="mt-1 text-sm text-red-700">
                          {request.rejectionReason}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      {humanizeStatus(request.registrationRequestStatus)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        ) : null}

        {patientToken && selectedRequestId ? (
          <div className="grid gap-4">
            <div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSelectedRequestId(null);
                  setFormWasSeededFor(null);
                }}
              >
                Back to requests
              </Button>
            </div>

            {selectedRequestQuery.isLoading ||
            profileQuery.isLoading ||
            derivedQuery.isLoading ? (
              <Notice title="Loading registration" />
            ) : null}
            {selectedRequestQuery.error ? (
              <Notice title="Unable to load registration" tone="danger">
                {(selectedRequestQuery.error as Error).message}
              </Notice>
            ) : null}

            {selectedRequest ? (
              <>
                <Panel>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {selectedRequest.practiceName}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {nullableValue(selectedRequest.rejectionReason)}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      {humanizeStatus(
                        selectedRequest.registrationRequestStatus,
                      )}
                    </span>
                  </div>
                </Panel>

                {canEdit ? (
                  <>
                    <Panel>
                      <h2 className="mb-3 text-lg font-semibold">Consent</h2>
                      {consentTemplateQuery.isLoading ? (
                        <Notice title="Loading consent" />
                      ) : null}
                      {consentTemplateQuery.data ? (
                        <div className="grid gap-3">
                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {
                              consentTemplateQuery.data
                                .registrationConsentTemplate.text
                            }
                          </p>
                          {hasConsent ? (
                            <Notice title="Consent recorded" tone="success" />
                          ) : (
                            <div>
                              <Button
                                type="button"
                                disabled={giveConsent.isPending}
                                onClick={() =>
                                  selectedRequestId &&
                                  giveConsent.mutate(selectedRequestId)
                                }
                              >
                                {giveConsent.isPending
                                  ? "Recording consent..."
                                  : "Give consent"}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </Panel>

                    <Panel>
                      <form className="grid gap-4" onSubmit={handleSubmit}>
                        <RegistrationFields
                          value={formState}
                          onChange={setFormState}
                        />
                        {!hasConsent ? (
                          <Notice title="Consent required" tone="warning">
                            Consent must be recorded before submitting the
                            registration document.
                          </Notice>
                        ) : null}
                        {submitRegistration.error ? (
                          <Notice title="Could not submit" tone="danger">
                            {(submitRegistration.error as Error).message}
                          </Notice>
                        ) : null}
                        <div>
                          <Button
                            type="submit"
                            disabled={!canSubmit || submitRegistration.isPending}
                          >
                            {submitRegistration.isPending
                              ? "Submitting..."
                              : "Submit registration"}
                          </Button>
                        </div>
                      </form>
                    </Panel>
                  </>
                ) : (
                  <Panel>
                    <h2 className="mb-3 text-lg font-semibold">
                      Submitted document
                    </h2>
                    {selectedRequest.document ? (
                      <RegistrationFields
                        value={formFromProfile(null, undefined, selectedRequest.document)}
                        onChange={() => undefined}
                        disabled
                      />
                    ) : (
                      <p className="text-sm text-slate-600">
                        This request is not currently editable.
                      </p>
                    )}
                  </Panel>
                )}
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
