import { prisma } from '../lib/prisma'
import { recordAudit } from '../lib/audit'
import { loanTypeCreateSchema, loanTypeUpdateSchema } from '../schemas/loan-type'

export async function listLoanTypes() {
  return prisma.loanType.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { loans: true } } } })
}

export async function createLoanType(input: unknown, userId: string) {
  const data = loanTypeCreateSchema.parse(input)
  const loanType = await prisma.loanType.create({ data })
  await recordAudit(prisma, { userId, action: 'SETTINGS_UPDATED', entity: 'LoanType', entityId: loanType.id, description: `Loan type ${loanType.name} was created`, metadata: { name: loanType.name } })
  return loanType
}

export async function updateLoanType(id: string, input: unknown, userId: string) {
  const data = loanTypeUpdateSchema.parse(input)
  const loanType = await prisma.loanType.update({ where: { id }, data })
  await recordAudit(prisma, { userId, action: 'SETTINGS_UPDATED', entity: 'LoanType', entityId: id, description: `Loan type ${loanType.name} was updated`, metadata: { name: loanType.name, status: loanType.status } })
  return loanType
}
