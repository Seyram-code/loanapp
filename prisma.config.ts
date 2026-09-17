import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const databaseUrl = new URL(env('DATABASE_URL'))
if (process.env.DATABASE_SSL === 'true') databaseUrl.searchParams.set('sslaccept', 'accept_invalid_certs')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'node prisma/seed.mjs' },
  datasource: { url: databaseUrl.toString() },
})