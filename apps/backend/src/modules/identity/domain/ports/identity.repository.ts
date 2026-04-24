export abstract class IdentityRepository {
    abstract createNew(id: string): Promise<void>;

    abstract exists(id: string): Promise<boolean>;
}
