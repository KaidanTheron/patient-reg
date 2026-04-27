export abstract class Hasher {
  abstract hash(rawValue: string): Promise<string>;
}
