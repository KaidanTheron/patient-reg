import { Form, useNavigate } from "react-router";
import { AppShell, Button, Notice, Panel } from "~/components/Layout";
import { usePractices } from "~/domain/practice/api";
import { selectPractice } from "~/domain/session.server";
import type { Route } from "./+types/home";

export async function action({ request }: Route.ActionArgs) {
  return selectPractice(request);
}

export default function HomeRoute() {
  const navigate = useNavigate();
  const practicesQuery = usePractices();

  return (
    <AppShell
      eyebrow="Practice entrypoint"
      title="Select a practice"
      actions={<Button onClick={() => navigate("/practice/registrations")}>Open dashboard</Button>}
    >
      <div className="grid gap-4">
        {practicesQuery.isLoading ? <Notice title="Loading practices" /> : null}
        {practicesQuery.error ? (
          <Notice title="Unable to load practices" tone="danger">
            {(practicesQuery.error as Error).message}
          </Notice>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          {practicesQuery.data?.practices.map((practice) => (
            <Panel key={practice.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{practice.name}</h2>
                  <p className="text-sm text-slate-500">
                    Continue as a staff member for this practice.
                  </p>
                </div>
                <Form method="post">
                  <input type="hidden" name="practiceId" value={practice.id} />
                  <Button type="submit">Select</Button>
                </Form>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
