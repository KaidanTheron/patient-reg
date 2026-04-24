import { AuthLinkState } from "../domain/auth-link.types";
import { AuthLinkFormatter } from "../domain/ports/auth-link.formatter";

export class StringAuthLinkFormatter extends AuthLinkFormatter {
    format(token: string): string {
        return `http://localhost:5173/${token}`
    }
}