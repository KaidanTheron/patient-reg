import { execSync } from 'child_process';

// built this little script to generate clean architecture module boilerplate
// includes a lot of stuff that doesn't have to be used in a module, just remove if that's the case

const exec = (command) => {
    execSync(command, { stdio: "inherit" })
}

const toPascalCase = (str) => {
    return str.replace(/[^a-zA-Z]/g, " ").trim().split(" ").map((str) => str.charAt(0).toUpperCase() + str.slice(1)).join("")
}

const toSnakeCase = (str) => {
    return str.toLowerCase().replace(/[^a-zA-Z]/g, " ").trim().replace(" ", "_");
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: node new-module.js <name of module>");
  process.exit(1);
}

const moduleName = args[0];

if (moduleName.includes(" ") || moduleName.includes("_")) {
    console.error("Module name can not include spaces or underscores")
}

const className = toPascalCase(moduleName);
const entityName = toSnakeCase(moduleName);

try {
    exec(`nest generate module ${moduleName} modules`);
    exec(`mkdir src/modules/${moduleName}/domain`);
    exec(`mkdir src/modules/${moduleName}/domain/ports`);
    exec(`touch src/modules/${moduleName}/domain/ports/${moduleName}.repository.ts`)
    exec(`echo 'export abstract class ${className}Repository {}' > src/modules/${moduleName}/domain/ports/${moduleName}.repository.ts`)
    exec(`nest generate service ${moduleName} modules/${moduleName}/application`);
    exec(`mkdir src/modules/${moduleName}/infrastructure`);
    exec(`nest generate resolver ${moduleName} modules/${moduleName}/presentation`);
    exec(`touch src/modules/${moduleName}/${moduleName}.entity.ts`)
    exec(`echo 'import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("${entityName}")
export class ${className} {
    @PrimaryGeneratedColumn()
    id: number
}' > src/modules/${moduleName}/${moduleName}.entity.ts`)
} catch (e) {
    console.error("Module creation failed", e.message)
}