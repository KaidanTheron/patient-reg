import { Practice } from "~/modules/registration/domain/entities/practice.entity";

export abstract class PracticeRepository {
  abstract create(name: Practice["name"]): Promise<Practice>;

  abstract findById(id: Practice["id"]): Promise<Practice | null>;

  abstract findAll(): Promise<Practice[]>;
}
