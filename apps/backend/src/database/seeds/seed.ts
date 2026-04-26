import "reflect-metadata";
import dataSource from "../../config/database.config";
import { PatientIdentityEntity } from "../../modules/registration/infrastructure/persistence/typeorm/entities/patient-identity.entity";
import { CryptoHasher } from "../../modules/registration/infrastructure/security/crypto-hasher";
import { identitySeedPlainSaIds, practiceNames } from "./seed.data";
import { PracticeEntity } from "src/modules/registration/infrastructure/persistence/typeorm/entities/practice.entity";

async function main(): Promise<void> {
    const hasher = new CryptoHasher();
    await dataSource.initialize();

    try {
        const patientIdentities = dataSource.getRepository(PatientIdentityEntity);
        let insertedCount = 0;
        let skippedCount = 0;

        for (const plain of identitySeedPlainSaIds) {
            const hashedIdentity = await hasher.hash(plain);
            const already = await patientIdentities.exists({ where: { identity: hashedIdentity } });
            if (already) {
                skippedCount += 1;
                continue;
            }
            await patientIdentities.insert({ identity: hashedIdentity });
            insertedCount += 1;
        }

        console.log(
            `Identity seeding complete. Inserted: ${insertedCount}, skipped: ${skippedCount}.`,
        );

        const practices = dataSource.getRepository(PracticeEntity)
        insertedCount = 0;
        skippedCount = 0;

        for (const practice of practiceNames) {
            const already = await practices.exists({ where: { name: practice }});
            if (already) {
                skippedCount += 0;
                continue;
            }
            await practices.insert({ name: practice });
            insertedCount += 1;
        }


        console.log(
            `Practice seeding complete. Inserted: ${insertedCount}, skipped: ${skippedCount}.`,
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
