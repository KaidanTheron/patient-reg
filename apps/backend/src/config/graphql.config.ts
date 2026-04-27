import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import type { Request } from "express";
import { join } from "path";

export const graphqlOptions: ApolloDriverConfig = {
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), "src/schema.gql"),
  sortSchema: true,
  context: ({ req }: { req: Request }) => ({ req }),
};
