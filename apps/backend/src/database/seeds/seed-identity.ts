import "reflect-metadata";
import dataSource from "../../config/database.config";
import { PatientIdentityEntity } from "../../modules/registration/infrastructure/persistence/typeorm/entities/patient-identity.entity";
import { CryptoHasher } from "../../modules/registration/infrastructure/security/crypto-hasher";
import { identitySeedPlainSaIds } from "./identity.seed.data";

async function main(): Promise<void> {
    const hasher = new CryptoHasher();
    await dataSource.initialize();

    try {
        const repo = dataSource.getRepository(PatientIdentityEntity);
        let insertedCount = 0;
        let skippedCount = 0;

        for (const plain of identitySeedPlainSaIds) {
            const hashedIdentity = await hasher.hash(plain);
            const already = await repo.exists({ where: { identity: hashedIdentity } });
            if (already) {
                skippedCount += 1;
                continue;
            }
            await repo.insert({ identity: hashedIdentity });
            insertedCount += 1;
        }

        console.log(
            `Identity seeding complete. Inserted: ${insertedCount}, skipped: ${skippedCount}.`,
        );
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
