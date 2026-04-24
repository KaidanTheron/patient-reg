import "reflect-metadata";
import dataSource from "../../config/database.config";
import { Identity } from "../../modules/identity/identity.entity";
import { CryptoIdentityHasher } from "../../modules/identity/infrastructure/crypto-identity.hasher";
import { identitySeedPlainSaIds } from "./identity.seed.data";

async function main(): Promise<void> {
    const hasher = new CryptoIdentityHasher();
    await dataSource.initialize();

    try {
        const repo = dataSource.getRepository(Identity);

        for (const plain of identitySeedPlainSaIds) {
            const saId = await hasher.hash(plain);
            const already = await repo.exists({ where: { saId } });
            if (already) {
                console.log(plain, "already exists")
                continue;
            }
            await repo.insert({ saId });
        }
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
