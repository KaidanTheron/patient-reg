import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriverConfig } from "@nestjs/apollo";
import { TypeOrmModule } from "@nestjs/typeorm";
import { datasourceOptions } from "~/config/database.config";
import { ConfigModule } from "@nestjs/config";
import { graphqlOptions } from "~/config/graphql.config";
import { RegistrationModule } from "~/modules/registration/registration.module";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>(graphqlOptions),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(datasourceOptions),
    RegistrationModule,
  ],
})
export class AppModule {}
