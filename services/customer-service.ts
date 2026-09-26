import { prisma } from '../lib/prisma'
import { recordAudit } from '../lib/audit'
import { customerCreateSchema, type CustomerCreateInput } from '../schemas/customer'
import { Prisma } from '@prisma/client'

async function nextCustomerNumber(transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const sequence = await transaction.numberSequence.upsert({
    where: { key: 'customer' },
    create: { key: 'customer', nextValue: 2 },
    update: { nextValue: { increment: 1 } },
  })
  return `CUS-${String(sequence.nextValue - 1).padStart(6, '0')}`
}

export async function createCustomer(input: CustomerCreateInput, userId: string) {
  const data = customerCreateSchema.parse(input)
  return prisma.$transaction(async (transaction) => {
    if (data.referredByCustomerId && !await transaction.customer.findUnique({ where: { id: data.referredByCustomerId }, select: { id: true } })) {
      throw new Error('Referring customer was not found')
    }
    const customerNumber = await nextCustomerNumber(transaction)
    const customer = await transaction.customer.create({ data: { ...data, customerNumber } })
    await recordAudit(transaction, { userId, action: 'CUSTOMER_CREATED', entity: 'Customer', entityId: customer.id, description: `Customer ${customerNumber} was created`, metadata: { customerNumber } })
    return customer
  })
}

export async function updateCustomer(id: string, input: Partial<CustomerCreateInput>, userId: string) {
  const data = customerCreateSchema.partial().parse(input)
  const customer = await prisma.customer.update({ where: { id }, data })
  await recordAudit(prisma, { userId, action: 'CUSTOMER_UPDATED', entity: 'Customer', entityId: id, description: `Customer ${customer.customerNumber} details were updated`, metadata: { customerNumber: customer.customerNumber } })
  return customer
}

export async function listCustomers() {
  return prisma.customer.findMany({ include: { _count: { select: { loans: true } } }, orderBy: { createdAt: 'desc' } })
}

export async function searchCustomers(options: { query?: string; status?: 'ACTIVE' | 'INACTIVE'; sort?: string; direction?: 'asc' | 'desc'; page?: number; pageSize?: number }) {
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(50, Math.max(5, options.pageSize ?? 10))
  const query = options.query?.trim()
  const where: Prisma.CustomerWhereInput = { ...(options.status ? { status: options.status } : {}), ...(query ? { OR: [{ customerNumber: { contains: query } }, { firstName: { contains: query } }, { middleName: { contains: query } }, { lastName: { contains: query } }, { phone: { contains: query } }, { alternatePhone: { contains: query } }, { email: { contains: query } }] } : {}) }
  const orderBy = options.sort === 'name' ? [{ lastName: options.direction ?? 'asc' as const }, { firstName: options.direction ?? 'asc' as const }] : options.sort === 'status' ? { status: options.direction ?? 'asc' as const } : { createdAt: options.direction ?? 'desc' as const }
  const [rows, total] = await prisma.$transaction([prisma.customer.findMany({ where, include: { loans: { where: { status: { in: ['DISBURSED', 'ACTIVE'] } }, select: { repayments: { select: { amount: true } }, repaymentSchedules: { select: { remainingAmount: true } } } } }, orderBy, skip: (page - 1) * pageSize, take: pageSize }), prisma.customer.count({ where })])
  return { customers: rows.map((customer) => ({ id: customer.id, customerNumber: customer.customerNumber, name: [customer.firstName, customer.middleName, customer.lastName].filter(Boolean).join(' '), phone: customer.phone, email: customer.email, occupation: customer.occupation, activeLoans: customer.loans.length, totalOutstanding: customer.loans.reduce((total, loan) => total.add(loan.repaymentSchedules.reduce((sum, schedule) => sum.add(schedule.remainingAmount), new Prisma.Decimal(0))), new Prisma.Decimal(0)).toFixed(2), status: customer.status, createdAt: customer.createdAt.toISOString() })), total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function updateCustomerStatus(id: string, status: 'ACTIVE' | 'INACTIVE', userId: string) {
  const customer = await prisma.customer.update({ where: { id }, data: { status } })
  await recordAudit(prisma, { userId, action: status === 'INACTIVE' ? 'CUSTOMER_DEACTIVATED' : 'CUSTOMER_UPDATED', entity: 'Customer', entityId: id, description: `Customer ${customer.customerNumber} status changed to ${status}`, metadata: { status } })
  return customer
}
