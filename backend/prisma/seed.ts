/**
 * Creates the staff logins (and optionally member logins) in Supabase.
 *
 *   npx prisma db seed
 *
 * Passwords come from the environment — nothing is hard-coded:
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD        (required)
 *   SEED_ACCOUNTANT_EMAIL / SEED_ACCOUNTANT_PASSWORD
 *   SEED_SECRETARY_EMAIL / SEED_SECRETARY_PASSWORD
 *   SEED_BOARD_EMAIL / SEED_BOARD_PASSWORD
 *   SEED_FARM_EMAIL / SEED_FARM_PASSWORD
 *   SEED_MEMBER_PASSWORD   optional: creates a MEMBER login for every member (with an email) in the
 *                          shared members collection, using this temporary password
 * Existing users are left unchanged (re-running is safe).
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const staff: Array<{ role: UserRole; emailVar: string; passVar: string; name: string }> = [
  { role: 'ADMIN', emailVar: 'SEED_ADMIN_EMAIL', passVar: 'SEED_ADMIN_PASSWORD', name: 'System Administrator' },
  { role: 'ACCOUNTANT', emailVar: 'SEED_ACCOUNTANT_EMAIL', passVar: 'SEED_ACCOUNTANT_PASSWORD', name: 'Chief Accountant' },
  { role: 'SECRETARY', emailVar: 'SEED_SECRETARY_EMAIL', passVar: 'SEED_SECRETARY_PASSWORD', name: 'Secretary' },
  { role: 'BOARD_MEMBER', emailVar: 'SEED_BOARD_EMAIL', passVar: 'SEED_BOARD_PASSWORD', name: 'Board Chair' },
  { role: 'FARM_WORKER', emailVar: 'SEED_FARM_EMAIL', passVar: 'SEED_FARM_PASSWORD', name: 'Farm Manager' },
];

async function ensureUser(email: string, password: string, fullName: string, role: UserRole, phone?: string) {
  const clean = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: clean } });
  if (existing) return { created: false, user: existing };
  if (password.length < 10) throw new Error(`Password for ${clean} must be at least 10 characters`);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email: clean, passwordHash, fullName, role, phone, status: 'ACTIVE' } });
  return { created: true, user };
}

async function main() {
  if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
    throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before seeding.');
  }
  for (const s of staff) {
    const email = process.env[s.emailVar];
    const pass = process.env[s.passVar];
    if (!email || !pass) { console.log(`skip ${s.role} (set ${s.emailVar} / ${s.passVar})`); continue; }
    const r = await ensureUser(email, pass, process.env[`${s.emailVar.replace('_EMAIL', '_NAME')}`] || s.name, s.role);
    console.log(`${r.created ? 'created' : 'exists '} ${s.role.padEnd(12)} ${email}`);
  }

  const memberPass = process.env.SEED_MEMBER_PASSWORD;
  if (memberPass) {
    const row = await prisma.appState.findUnique({ where: { key: 'dc_sacco_members_v2' } });
    const members: any[] = Array.isArray(row?.value) ? (row!.value as any[]) : [];
    let n = 0;
    for (const m of members) {
      if (!m.email) continue;
      const r = await ensureUser(m.email, memberPass, m.name, 'MEMBER', m.phone);
      if (r.created) {
        const count = await prisma.memberProfile.count();
        await prisma.memberProfile.create({ data: { userId: r.user.id, memberNumber: m.memberId || `DC-MBR-${String(count + 101).padStart(5, '0')}`, ninOrPassport: m.nin || null } });
        n++;
      }
    }
    console.log(`created ${n} member login(s) with the temporary password — ask members to change it`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
