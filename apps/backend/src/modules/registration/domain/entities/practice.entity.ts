export class Practice {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  static create(id: string, name: string): Practice {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Practice name is required");
    return new Practice(id, trimmed);
  }
}
