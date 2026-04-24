export abstract class IdentityHasher {
    abstract hash(id: string): Promise<string>;
}