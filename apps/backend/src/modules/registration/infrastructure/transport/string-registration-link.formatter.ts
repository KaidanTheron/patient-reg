import { Injectable } from "@nestjs/common";
import { RegistrationLinkFormatter } from "../../domain/ports/registration-link.formatter";

@Injectable()
export class StringRegistrationLinkFormatter extends RegistrationLinkFormatter {
  format(token: string): string {
    return `http://localhost:5173/register?token=${encodeURIComponent(token)}`;
  }
}
