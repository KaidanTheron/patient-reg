import "reflect-metadata";
import dataSource from "~/config/database.config";
import { PatientIdentityEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-identity.entity";
import { CryptoHasher } from "~/modules/registration/infrastructure/security/crypto-hasher";
import { identities, practiceNames } from "~/database/seeds/seed.data";
import { PracticeEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/practice.entity";
import { CryptoEncrypter } from "~/modules/registration/infrastructure/security/crypto-encrypter";

async function main(): Promise<void> {
  const hasher = new CryptoHasher();
  const encrypter = new CryptoEncrypter();
  await dataSource.initialize();

  try {
    const patientIdentities = dataSource.getRepository(PatientIdentityEntity);
    let insertedCount = 0;
    let skippedCount = 0;

    for (const identity of identities) {
      const [hIdentity, ePhone, eEmail, eFirstname, eLastname] = await Promise.all([
        hasher.hash(identity.identity),
        encrypter.encrypt(identity.phone!),
        encrypter.encrypt(identity.email!),
        encrypter.encrypt(identity.firstname!),
        encrypter.encrypt(identity.lastname!),
      ])
      const already = await patientIdentities.exists({
        where: { identity: hIdentity },
      });
      if (already) {
        skippedCount += 1;
        continue;
      }
      await patientIdentities.insert({
        identity: hIdentity,
        email: eEmail,
        phone: ePhone,
        firstname: eFirstname,
        lastname: eLastname,
      });
      insertedCount += 1;
    }

    console.log(
      `Identity seeding complete. Inserted: ${insertedCount}, skipped: ${skippedCount}.`,
    );

    const practices = dataSource.getRepository(PracticeEntity);
    insertedCount = 0;
    skippedCount = 0;

    for (const practice of practiceNames) {
      const already = await practices.exists({ where: { name: practice } });
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
