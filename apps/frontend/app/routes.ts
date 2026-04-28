import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("register/:token", "routes/patient-registration-link.tsx"),
  route("session/patient", "routes/patient-session.tsx"),
  route("practice/registrations", "routes/practice-registrations.tsx"),
  route("practice/registrations/new", "routes/practice-registration-new.tsx"),
  route(
    "practice/registrations/:registrationRequestId",
    "routes/practice-registration-detail.tsx",
  ),
] satisfies RouteConfig;
