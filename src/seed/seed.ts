import { DataSource } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { v7 as uuidv7 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/insighta',
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
    entities: [Profile, User],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Database connected');

  const filePath = path.join(__dirname, '..', 'data', 'profiles.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { profiles } = JSON.parse(raw);

  console.log(`Found ${profiles.length} profiles to seed`);

  const repo = dataSource.getRepository(Profile);
  
  // Assign UUIDs to new records in memory
  const profilesToUpsert = profiles.map(p => ({
    id: uuidv7(),
    ...p
  }));

  // Bulk upsert is 1000x faster for cloud databases than sequential findOne -> save
  await repo.upsert(profilesToUpsert, {
    conflictPaths: ['name'],
    skipUpdateIfNoValuesChanged: true,
  });

  console.log(`Seed complete: Pushed ${profiles.length} profiles to Supabase`);

  const userRepo = dataSource.getRepository(User);
  const testUsers = [
    {
      github_id: 'test-admin',
      email: 'admin@test.insighta',
      display_name: 'Test Admin',
      avatar_url: '',
      role: 'admin',
    },
    {
      github_id: 'test-analyst',
      email: 'analyst@test.insighta',
      display_name: 'Test Analyst',
      avatar_url: '',
      role: 'analyst',
    },
  ];

  for (const u of testUsers) {
    const existing = await userRepo.findOne({ where: { github_id: u.github_id } });
    if (existing) {
      await userRepo.update(existing.id, { role: u.role, email: u.email, display_name: u.display_name });
      console.log(`User ${u.github_id} already exists (role=${u.role})`);
    } else {
      await userRepo.save(userRepo.create(u));
      console.log(`Created user ${u.github_id} (role=${u.role})`);
    }
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
