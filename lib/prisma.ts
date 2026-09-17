import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const configuredDatabaseUrl = process.env.DATABASE_URL
if (!configuredDatabaseUrl) throw new Error('DATABASE_URL must be configured')
const databaseUrl = new URL(configuredDatabaseUrl)
const adapter = new PrismaMariaDb({
	host: databaseUrl.hostname,
	port: Number(databaseUrl.port) || 3306,
	user: decodeURIComponent(databaseUrl.username),
	password: decodeURIComponent(databaseUrl.password),
	database: databaseUrl.pathname.slice(1) || 'lendgh',
	ssl: process.env.DATABASE_SSL === 'true',
	allowPublicKeyRetrieval: true,
	connectionLimit: 5,
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
