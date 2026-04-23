import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";

export const graphqlOptions: ApolloDriverConfig = {
    driver: ApolloDriver,
    autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    sortSchema: true,
}