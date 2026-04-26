import { Injectable } from "@nestjs/common";
import { env } from "src/config/env";
import { RegistrationLinkFormatter } from "../../domain/ports/registration-link.formatter";

@Injectable()
export class StringRegistrationLinkFormatter extends RegistrationLinkFormatter {
  format(token: string): string {
    const base = env.PATIENT_APP_URL.replace(/\/$/, "");
    return `${base}/register/${encodeURIComponent(token)}`;
  }
}
