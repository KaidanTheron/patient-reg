import { Injectable } from "@nestjs/common";
import { Notifier } from "~/modules/registration/domain/ports/notifier";

@Injectable()
export class ConsoleNotifier extends Notifier {
  public notify(recipient: string, body: string): Promise<boolean> {
    console.log(recipient, body);

    return new Promise((resolve) => resolve(true));
  }
}
