import { ConfigService } from "@nestjs/config";
import z from "zod";
import { config } from "dotenv";

config()

enum DBType {
    postgres = "postgres",
}

const envSchema = z.object({
    DB_PASSWORD: z.string(),
    DB_USERNAME: z.string(),
    DB_PORT: z.coerce.number().default(5432),
    DB_HOST: z.string().default("localhost"),
    DB_TYPE: z.enum(DBType).default(DBType.postgres),
})

const getEnv = () => {
    const configService = new ConfigService();

    return envSchema.parse({
        DB_PASSWORD: configService.get("DB_PASSWORD"),
        DB_USERNAME: configService.get("DB_USERNAME"),
        DB_PORT: configService.get("DB_PORT"),
        DB_HOST: configService.get("DB_HOST"),
        DB_TYPE: configService.get("DB_TYPE"),
    });
}

console.log(getEnv())

export const env = getEnv();
