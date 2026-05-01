import { DataSource } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as dns from 'dns';
import { User } from '../users/entities/user.entity';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

async function genTokens() {
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in .env');
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/insighta',
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
    entities: [User],
    synchronize: false,
  });

  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);

  const targets = [
    { github_id: 'test-admin', label: 'ADMIN' },
    { github_id: 'test-analyst', label: 'ANALYST' },
  ];

  const output: Record<string, { access: string; refresh: string }> = {};

  for (const t of targets) {
    const user = await userRepo.findOne({ where: { github_id: t.github_id } });
    if (!user) {
      throw new Error(`User ${t.github_id} not found. Run "npm run seed" first.`);
    }

    const payload = { sub: user.id, role: user.role };
    const access = jwt.sign(payload, accessSecret, { expiresIn: '7d' });
    const refresh = jwt.sign(payload, refreshSecret, { expiresIn: '30d' });

    const hash = await bcrypt.hash(refresh, 10);
    await userRepo.update(user.id, { refresh_token_hash: hash });

    output[t.label] = { access, refresh };
  }

  await dataSource.destroy();

  console.log('\n=== PASTE THESE INTO THE GRADER FORM ===\n');
  console.log('Admin Test Token:');
  console.log(output.ADMIN.access);
  console.log('\nAnalyst Test Token:');
  console.log(output.ANALYST.access);
  console.log('\nRefresh Test Token (paired with admin):');
  console.log(output.ADMIN.refresh);
  console.log('\n========================================\n');
}

genTokens().catch((err) => {
  console.error('Token generation failed:', err);
  process.exit(1);
});
