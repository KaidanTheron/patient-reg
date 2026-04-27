export abstract class Notifier {
  public abstract notify(recipient: string, body: string): Promise<boolean>;
}
