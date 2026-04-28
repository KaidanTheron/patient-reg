import { useState } from "react";
import type { FormEvent } from "react";
import { useLoaderData, useNavigate } from "react-router";
import {
  AppShell,
  Button,
  Field,
  inputClass,
  Notice,
  Panel,
  TextLink,
} from "~/components/Layout";
import { useInitiateRegistration } from "~/domain/practice/api";
import { getPracticeId } from "~/domain/session.server";
import type { Route } from "./+types/practice-registration-new";

export async function loader({ request }: Route.LoaderArgs) {
  return {
    practiceId: await getPracticeId(request),
  };
}

export default function PracticeRegistrationNewRoute() {
  const navigate = useNavigate();
  const { practiceId } = useLoaderData<typeof loader>();
  const initiate = useInitiateRegistration(practiceId);
  const [staffId, setStaffId] = useState("");
  const [rsaId, setRsaId] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  if (!practiceId) {
    return (
      <AppShell title="Initiate registration">
        <Notice title="No practice selected" tone="warning">
          Select a practice before creating a registration request.
        </Notice>
        <div className="mt-4">
          <TextLink to="/">Select practice</TextLink>
        </div>
      </AppShell>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);

    if (!practiceId) {
      setClientError("Select a practice before creating a request.");
      return;
    }
    if (!/^\d+$/.test(rsaId)) {
      setClientError("Patient identity number must contain only numbers.");
      return;
    }
    if (!staffId.trim()) {
      setClientError("Staff ID is required.");
      return;
    }

    await initiate.mutateAsync({
      practiceId,
      initiatedByStaffId: staffId.trim(),
      rsaId,
    });
    navigate("/practice/registrations");
  }

  return (
    <AppShell
      eyebrow="Practice workflow"
      title="Initiate registration"
      actions={<TextLink to="/practice/registrations">Back to requests</TextLink>}
    >
      <Panel>
        <form className="grid max-w-xl gap-4" onSubmit={handleSubmit}>
          <Field label="Staff ID">
            <input
              className={inputClass}
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
            />
          </Field>
          <Field label="Patient South African ID">
            <input
              className={inputClass}
              inputMode="numeric"
              value={rsaId}
              onChange={(event) =>
                setRsaId(event.target.value.replace(/\D/g, ""))
              }
            />
          </Field>
          {clientError ? (
            <Notice title="Check the form" tone="warning">
              {clientError}
            </Notice>
          ) : null}
          {initiate.error ? (
            <Notice title="Could not initiate registration" tone="danger">
              {(initiate.error as Error).message}
            </Notice>
          ) : null}
          <div>
            <Button type="submit" disabled={initiate.isPending}>
              {initiate.isPending ? "Creating request..." : "Create request"}
            </Button>
          </div>
        </form>
      </Panel>
    </AppShell>
  );
}
