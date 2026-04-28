import { useState } from "react";
import type { FormEvent } from "react";
import { useLoaderData, useParams } from "react-router";
import { RegistrationDiff } from "~/components/RegistrationDiff";
import {
  AppShell,
  Button,
  Field,
  inputClass,
  Notice,
  Panel,
  TextLink,
} from "~/components/Layout";
import {
  useApproveRegistration,
  usePatientProfileForPractice,
  usePracticeRegistrationRequest,
  useRejectRegistration,
} from "~/domain/practice/api";
import { getPracticeId } from "~/domain/session.server";
import type { Route } from "./+types/practice-registration-detail";
import {
  humanizeStatus,
  isReviewableRegistration,
  nullableValue,
  patientDisplayName,
} from "~/utils/format";

export async function loader({ request }: Route.LoaderArgs) {
  return {
    practiceId: await getPracticeId(request),
  };
}

export default function PracticeRegistrationDetailRoute() {
  const params = useParams();
  const registrationRequestId = params.registrationRequestId ?? "";
  const { practiceId } = useLoaderData<typeof loader>();
  const requestQuery = usePracticeRegistrationRequest(
    practiceId,
    registrationRequestId,
  );
  const patientProfileQuery = usePatientProfileForPractice(
    practiceId,
    registrationRequestId,
  );
  const approve = useApproveRegistration(practiceId);
  const reject = useRejectRegistration(practiceId);
  const [approvalStaffId, setApprovalStaffId] = useState("");
  const [rejectionStaffId, setRejectionStaffId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const request = requestQuery.data?.practiceRegistrationRequest;
  const patientProfile = patientProfileQuery.data?.patientProfile;
  const reviewable = request
    ? isReviewableRegistration(request.registrationRequestStatus)
    : false;

  async function handleApprove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!approvalStaffId.trim()) return;
    await approve.mutateAsync({
      registrationRequestId,
      approvedByStaffId: approvalStaffId.trim(),
    });
  }

  async function handleReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectionStaffId.trim() || !rejectionReason.trim()) return;
    await reject.mutateAsync({
      registrationRequestId,
      rejectedByStaffId: rejectionStaffId.trim(),
      reason: rejectionReason.trim(),
    });
  }

  if (!practiceId) {
    return (
      <AppShell title="Review registration">
        <Notice title="No practice selected" tone="warning">
          Select a practice before reviewing registration requests.
        </Notice>
        <div className="mt-4">
          <TextLink to="/">Select practice</TextLink>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Practice workflow"
      title="Review registration"
      actions={<TextLink to="/practice/registrations">Back to requests</TextLink>}
    >
      <div className="grid gap-4">
        {requestQuery.isLoading || patientProfileQuery.isLoading ? (
          <Notice title="Loading registration" />
        ) : null}
        {requestQuery.error ? (
          <Notice title="Unable to load registration" tone="danger">
            {(requestQuery.error as Error).message}
          </Notice>
        ) : null}
        {patientProfileQuery.error ? (
          <Notice title="Unable to load patient record" tone="danger">
            {(patientProfileQuery.error as Error).message}
          </Notice>
        ) : null}
        {request ? (
          <>
            <Panel>
              <div className="grid gap-2 md:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Patient</p>
                  <p className="font-semibold">{patientDisplayName(request.patient)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Contact</p>
                  <p>{nullableValue(request.patient?.email)}</p>
                  <p>{nullableValue(request.patient?.phone)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Status</p>
                  <p className="font-semibold">
                    {humanizeStatus(request.registrationRequestStatus)}
                  </p>
                </div>
              </div>
              {request.rejectionReason ? (
                <div className="mt-4">
                  <Notice title="Previous rejection reason" tone="warning">
                    {request.rejectionReason}
                  </Notice>
                </div>
              ) : null}
            </Panel>

            {!request.document ? (
              <Notice title="No submitted document yet" tone="neutral">
                The patient has not submitted registration details for review.
              </Notice>
            ) : (
              <Panel>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">Field-level diff</h2>
                    <p className="text-sm text-slate-500">
                      Highlighted rows differ from the current patient record.
                    </p>
                  </div>
                </div>
                <RegistrationDiff
                  current={patientProfile}
                  submitted={request.document}
                />
              </Panel>
            )}

            {reviewable && request.document ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel>
                  <form className="grid gap-3" onSubmit={handleApprove}>
                    <h2 className="text-lg font-semibold">Approve</h2>
                    <Field label="Approving staff ID">
                      <input
                        className={inputClass}
                        value={approvalStaffId}
                        onChange={(event) =>
                          setApprovalStaffId(event.target.value)
                        }
                      />
                    </Field>
                    {approve.error ? (
                      <Notice title="Could not approve" tone="danger">
                        {(approve.error as Error).message}
                      </Notice>
                    ) : null}
                    {approve.isSuccess ? (
                      <Notice title="Registration approved" tone="success" />
                    ) : null}
                    <div>
                      <Button
                        type="submit"
                        disabled={approve.isPending || !approvalStaffId.trim()}
                      >
                        {approve.isPending ? "Approving..." : "Approve"}
                      </Button>
                    </div>
                  </form>
                </Panel>

                <Panel>
                  <form className="grid gap-3" onSubmit={handleReject}>
                    <h2 className="text-lg font-semibold">Reject</h2>
                    <Field label="Rejecting staff ID">
                      <input
                        className={inputClass}
                        value={rejectionStaffId}
                        onChange={(event) =>
                          setRejectionStaffId(event.target.value)
                        }
                      />
                    </Field>
                    <Field label="Reason">
                      <textarea
                        className={inputClass}
                        rows={4}
                        value={rejectionReason}
                        onChange={(event) =>
                          setRejectionReason(event.target.value)
                        }
                      />
                    </Field>
                    {reject.error ? (
                      <Notice title="Could not reject" tone="danger">
                        {(reject.error as Error).message}
                      </Notice>
                    ) : null}
                    {reject.isSuccess ? (
                      <Notice title="Registration rejected" tone="success" />
                    ) : null}
                    <div>
                      <Button
                        type="submit"
                        variant="danger"
                        disabled={
                          reject.isPending ||
                          !rejectionStaffId.trim() ||
                          !rejectionReason.trim()
                        }
                      >
                        {reject.isPending ? "Rejecting..." : "Reject"}
                      </Button>
                    </div>
                  </form>
                </Panel>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
