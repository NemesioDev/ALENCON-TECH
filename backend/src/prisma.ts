import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_SUPABASE_POOLER_URL =
  'postgresql://postgres.ejvxpwmnrivqgiyocyns:WI96fRT1up2snDGH@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_SUPABASE_POOLER_URL;
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    'postgresql://postgres.ejvxpwmnrivqgiyocyns:WI96fRT1up2snDGH@aws-0-us-east-1.pooler.supabase.com:5432/postgres';
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
