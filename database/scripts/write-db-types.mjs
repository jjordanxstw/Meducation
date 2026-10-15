// Finishes `pnpm db:local:types`: adds the header, formats, and replaces the generated file.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const target = 'packages/shared/src/types/database.generated.ts';
const header = `/**\n * GENERATED from the local Supabase stack — do not edit by hand.\n * Regenerate after a migration: pnpm db:local:types\n */\n`;
writeFileSync(target, header + readFileSync(`${target}.tmp`, 'utf8'));
rmSync(`${target}.tmp`);
execSync(`npx prettier --write ${target}`, { stdio: 'inherit' });
