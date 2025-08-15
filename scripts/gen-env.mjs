#!/usr/bin/env node
import { randomBytes } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

function randHex(len = 32) { return randomBytes(len).toString('hex'); }

const rootEnv = `# generated
DATABASE_URL="mysql://app:app@localhost:3306/ai_saas_admin"
JWT_SECRET="${randHex(32)}"
REFRESH_TOKEN_SECRET="${randHex(32)}"
REFRESH_COOKIE_NAME="ai_saas_refresh"
NEXT_PUBLIC_API_URL="http://localhost:4000"
`;

const apiEnv = `PORT=4000
NODE_ENV=development
DATABASE_URL="mysql://app:app@localhost:3306/ai_saas_admin"
JWT_SECRET="${randHex(32)}"
REFRESH_TOKEN_SECRET="${randHex(32)}"
REFRESH_COOKIE_NAME="ai_saas_refresh"
CLIENT_ORIGIN="http://localhost:3000"
`;

const webEnv = `NEXT_PUBLIC_API_URL=http://localhost:4000
`;

mkdirSync('apps/api', { recursive: true });
mkdirSync('apps/web', { recursive: true });
writeFileSync(join(process.cwd(), '.env'), rootEnv);
writeFileSync(join(process.cwd(), 'apps/api/.env'), apiEnv);
writeFileSync(join(process.cwd(), 'apps/web/.env'), webEnv);
console.log('Generated .env files with random secrets');


