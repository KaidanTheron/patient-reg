import { setPatientToken } from "~/domain/session.server";
import type { Route } from "./+types/patient-session";

export async function action({ request }: Route.ActionArgs) {
  return setPatientToken(request);
}
