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
    SECRET: z.string().default("supersecretsecretkey"),
})

const getEnv = () => {
    const configService = new ConfigService();

    const result = envSchema.safeParse(envSchema.keyof().options.reduce((prev, curr) => ({
        ...prev,
        [curr]: configService.get(curr)
    }), {}));

    if (!result.success) {
        const flattenedError = z.flattenError(result.error);
        throw new Error(JSON.stringify(flattenedError.fieldErrors, null, 2), { cause: "Invalid Environment Variables" });
    }

    return result.data;
}

export const env = getEnv();
