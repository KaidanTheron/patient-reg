import "reflect-metadata";
import dataSource from "../../config/database.config";
import { PatientIdentityEntity } from "../../modules/registration/infrastructure/persistence/typeorm/entities/patient-identity.entity";
import { CryptoHasher } from "../../modules/registration/infrastructure/security/crypto-hasher";
import { identities, practiceNames } from "./seed.data";
import { PracticeEntity } from "src/modules/registration/infrastructure/persistence/typeorm/entities/practice.entity";
import { CryptoEncrypter } from "src/modules/registration/infrastructure/security/crypto-encrypter";

async function main(): Promise<void> {
    const hasher = new CryptoHasher();
    const encrypter = new CryptoEncrypter();
    await dataSource.initialize();

    try {
        const patientIdentities = dataSource.getRepository(PatientIdentityEntity);
        let insertedCount = 0;
        let skippedCount = 0;

        for (const identity of identities) {
            const hashedIdentity = await hasher.hash(identity.identity);
            const encryptedPhone = await encrypter.encrypt(identity.phone!);
            const encryptedEmail = await encrypter.encrypt(identity.email!);
            const already = await patientIdentities.exists({ where: { identity: hashedIdentity } });
            if (already) {
                skippedCount += 1;
                continue;
            }
            await patientIdentities.insert({ identity: hashedIdentity, email: encryptedEmail, phone: encryptedPhone });
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
