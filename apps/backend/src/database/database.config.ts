import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const datasourceOptions: TypeOrmModuleOptions = {
  driver: "postgres",
};
