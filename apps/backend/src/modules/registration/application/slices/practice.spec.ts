import { Practice } from "../../domain/entities/practice.entity";
import { PracticeRepository } from "../../domain/ports/practice.repository";
import { PracticeService } from "./registration";

class InMemoryPracticeRepository extends PracticeRepository {
  readonly practices = new Map<string, Practice>();

  async create(name: Practice["name"]): Promise<Practice> {
    const practice = Practice.create("practice-1", name);
    this.practices.set(practice.id, practice);
    return practice;
  }

  async findById(id: Practice["id"]): Promise<Practice | null> {
    return this.practices.get(id) ?? null;
  }

  async findAll(): Promise<Practice[]> {
    return [...this.practices.values()];
  }
}

describe("PracticeService", () => {
  let repository: InMemoryPracticeRepository;
  let service: PracticeService;

  beforeEach(() => {
    repository = new InMemoryPracticeRepository();
    service = new PracticeService(repository);
  });

  it("creates a practice", async () => {
    const result = await service.createPractice({ name: "Example Practice" });

    expect(result).toEqual({
      id: "practice-1",
      name: "Example Practice",
    });
    expect(await repository.findById(result.id)).not.toBeNull();
  });
});
