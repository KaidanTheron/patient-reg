export abstract class AuthLinkNotifier {
    abstract notify(recipient: string, body: string): Promise<boolean>;
}