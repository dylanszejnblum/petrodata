import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

/**
 * Manually mint an API key for a premium customer.
 *   pnpm apikey:create "Acme Corp — dylan@acme.com"
 *
 * The plaintext key is printed ONCE and never stored (only its SHA-256 hash is).
 * If it's lost, revoke and mint a new one. Revoke with:
 *   UPDATE api_key SET active = false WHERE prefix = 'vm_live_xxxx';
 */
const prisma = new PrismaClient();

async function main() {
  const label = process.argv.slice(2).join(' ').trim();
  if (!label) {
    console.error('Usage: pnpm apikey:create "<label — who the key is for>"');
    process.exit(1);
  }

  const key = `vm_live_${randomBytes(24).toString('hex')}`; // 48 hex chars of entropy
  const keyHash = createHash('sha256').update(key).digest('hex');
  const prefix = key.slice(0, 16); // non-secret, for identifying the key later

  const row = await prisma.apiKey.create({ data: { label, keyHash, prefix, active: true } });

  console.log('\n  API key created — copy it now, it will NOT be shown again:\n');
  console.log(`    ${key}\n`);
  console.log(`  id:     ${row.id}`);
  console.log(`  label:  ${row.label}`);
  console.log(`  prefix: ${row.prefix}`);
  console.log('\n  Send it to the customer over a secure channel.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
