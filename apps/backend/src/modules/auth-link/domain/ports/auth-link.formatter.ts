import { AuthLinkState } from "../auth-link.types";

export abstract class AuthLinkFormatter {
    abstract format(token: string): string;
}