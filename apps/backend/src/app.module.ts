import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { AuthLinkModule } from "./modules/auth-link/auth-link.module";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
    }),
    TypeOrmModule.forRoot(),
    AuthLinkModule,
  ],
})
export class AppModule {}
