import "reflect-metadata";
import dataSource from "~/config/database.config";
import { PatientIdentityEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/patient-identity.entity";
import { CryptoHasher } from "~/modules/registration/infrastructure/security/crypto-hasher";
import { consentTemplateSeedsByPractice, identities, practiceNames } from "~/database/seeds/seed.data";
import { PracticeEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/practice.entity";
import { ConsentTemplateEntity } from "~/modules/registration/infrastructure/persistence/typeorm/entities/consent-template.entity";
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
      const { firstname, identity: id, lastname, email, phone } = identity;

      const [hIdentity, ePhone, eEmail, eFirstname, eLastname] = await Promise.all([
        hasher.hash(id),
        phone ? encrypter.encrypt(phone) : undefined,
        email ? encrypter.encrypt(email) : undefined,
        firstname ? encrypter.encrypt(firstname) : undefined,
        lastname ? encrypter.encrypt(lastname) : undefined,
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

    const consentTemplates = dataSource.getRepository(ConsentTemplateEntity);
    insertedCount = 0;
    skippedCount = 0;

    for (const practiceName of practiceNames) {
      const practice = await practices.findOne({ where: { name: practiceName } });
      if (!practice) {
        console.warn(`Practice "${practiceName}" not found; skipping consent templates.`);
        continue;
      }

      const templates = consentTemplateSeedsByPractice[practiceName] ?? [];
      for (const template of templates) {
        const already = await consentTemplates.exists({
          where: {
            practice: { id: practice.id },
            consentType: template.consentType,
            version: template.version,
          },
        });
        if (already) {
          skippedCount += 1;
          continue;
        }
        await consentTemplates.insert({
          practice: { id: practice.id },
          consentType: template.consentType,
          version: template.version,
          text: template.text,
          isActive: true,
        });
        insertedCount += 1;
      }
    }

    console.log(
      `Consent template seeding complete. Inserted: ${insertedCount}, skipped: ${skippedCount}.`,
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
