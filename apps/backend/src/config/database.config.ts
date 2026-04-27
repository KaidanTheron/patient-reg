import { DataSource, type DataSourceOptions } from "typeorm";
import { env } from "~/config/env";

export const datasourceOptions: DataSourceOptions = {
  password: env.DB_PASSWORD,
  username: env.DB_USERNAME,
  host: env.DB_HOST,
  type: env.DB_TYPE,
  port: env.DB_PORT,
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  synchronize: false,
  migrationsRun: false,
  migrations: [__dirname + "/../database/migrations/*.ts"],
  migrationsTableName: "migrations",
  extra: {
    connectionLimit: env.DB_MAX_CONNECTIONS ?? 1,
  },
};

const dataSource = new DataSource(datasourceOptions);

// You might want to do
// dataSource.initialize()
// but I found mine working regardless of it

export default dataSource;
