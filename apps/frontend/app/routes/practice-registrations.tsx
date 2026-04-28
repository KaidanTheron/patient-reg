import { Link, useNavigate } from "react-router";
import { useLoaderData } from "react-router";
import { AppShell, Button, Notice, Panel, TextLink } from "~/components/Layout";
import { usePracticeRegistrationRequests } from "~/domain/practice/api";
import { getPracticeId } from "~/domain/session.server";
import type { Route } from "./+types/practice-registrations";
import {
  humanizeStatus,
  nullableValue,
  patientDisplayName,
} from "~/utils/format";

export async function loader({ request }: Route.LoaderArgs) {
  return {
    practiceId: await getPracticeId(request),
  };
}

export default function PracticeRegistrationsRoute() {
  const navigate = useNavigate();
  const { practiceId } = useLoaderData<typeof loader>();
  const requestsQuery = usePracticeRegistrationRequests(practiceId);

  if (!practiceId) {
    return (
      <AppShell title="Practice dashboard">
        <Notice title="No practice selected" tone="warning">
          Select a practice before opening the registration dashboard.
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
      title="Registration requests"
      actions={
        <>
          <TextLink to="/">Switch practice</TextLink>
          <Button onClick={() => navigate("/practice/registrations/new")}>
            New request
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {requestsQuery.isLoading ? <Notice title="Loading requests" /> : null}
        {requestsQuery.error ? (
          <Notice title="Unable to load requests" tone="danger">
            {(requestsQuery.error as Error).message}
          </Notice>
        ) : null}
        {requestsQuery.data?.practiceRegistrationRequests.length === 0 ? (
          <Panel>
            <p className="text-sm text-slate-600">
              No registration requests have been created for this practice.
            </p>
          </Panel>
        ) : null}
        <div className="grid gap-3">
          {requestsQuery.data?.practiceRegistrationRequests.map((request) => (
            <Link
              key={request.registrationRequestId}
              to={`/practice/registrations/${request.registrationRequestId}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {patientDisplayName(request.patient)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {nullableValue(request.patient?.email)} ·{" "}
                    {nullableValue(request.patient?.phone)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {humanizeStatus(request.registrationRequestStatus)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
