import { createCookieSessionStorage, redirect } from "react-router";

const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;
const sessionSecret =
  process.env.SESSION_SECRET ?? "patient-reg-local-session-secret";

export const practiceSessionStorage = createCookieSessionStorage<{
  practiceId?: string;
}>({
  cookie: {
    name: "practice_session",
    httpOnly: true,
    maxAge: ONE_WEEK_SECONDS,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export const patientSessionStorage = createCookieSessionStorage<{
  patientToken?: string;
}>({
  cookie: {
    name: "patient_session",
    httpOnly: true,
    maxAge: ONE_WEEK_SECONDS,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getPracticeId(request: Request) {
  const session = await practiceSessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  return session.get("practiceId") ?? null;
}

export async function selectPractice(request: Request) {
  const formData = await request.formData();
  const practiceId = String(formData.get("practiceId") ?? "").trim();

  if (!practiceId) {
    throw new Response("Practice id is required", { status: 400 });
  }

  const session = await practiceSessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  session.set("practiceId", practiceId);

  return redirect("/practice/registrations", {
    headers: {
      "Set-Cookie": await practiceSessionStorage.commitSession(session),
    },
  });
}

export async function setPatientToken(request: Request) {
  const formData = await request.formData();
  const patientToken = String(formData.get("patientToken") ?? "").trim();
  const expiresAt = String(formData.get("expiresAt") ?? "").trim();

  if (!patientToken) {
    throw new Response("Patient token is required", { status: 400 });
  }

  const session = await patientSessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  session.set("patientToken", patientToken);

  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": await patientSessionStorage.commitSession(session, {
        expires: expiresAt ? new Date(expiresAt) : undefined,
      }),
    },
  });
}
