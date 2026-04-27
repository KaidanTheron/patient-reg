import { Injectable } from "@nestjs/common";
import { env } from "~/config/env";
import { RegistrationLinkFormatter } from "~/modules/registration/domain/ports/registration-link.formatter";

@Injectable()
export class StringRegistrationLinkFormatter extends RegistrationLinkFormatter {
  format(token: string): string {
    const base = env.PATIENT_APP_URL.replace(/\/$/, "");
    return `${base}/register/${encodeURIComponent(token)}`;
  }
}
