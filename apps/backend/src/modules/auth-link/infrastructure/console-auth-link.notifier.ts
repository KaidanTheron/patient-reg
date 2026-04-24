import { Injectable } from "@nestjs/common";
import { AuthLinkNotifier } from "../domain/ports/auth-link.notifier";

@Injectable()
export class ConsoleAuthLinkNotifier extends AuthLinkNotifier {
    public async notify(recipient: string, body: string): Promise<boolean> {
        console.log(JSON.stringify({ recipient, body }, null, 2))

        return new Promise((resolve) => resolve(true));
    }
}