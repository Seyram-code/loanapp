import 'dotenv/config'
import { randomBytes, scryptSync } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be configured')
if (!process.env.SUPER_ADMIN_EMAIL || !process.env.SUPER_ADMIN_PASSWORD || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, ADMIN_EMAIL, and ADMIN_PASSWORD must be configured')
const databaseUrl = new URL(process.env.DATABASE_URL)
const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port) || 3306,
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.slice(1) || 'lendgh',
  allowPublicKeyRetrieval: true,
  connectionLimit: 2,
})
const prisma = new PrismaClient({ adapter })
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

const accounts = [
  { email: process.env.SUPER_ADMIN_EMAIL, password: process.env.SUPER_ADMIN_PASSWORD, name: 'Lendgh Super Administrator', role: 'SUPER_ADMIN' },
  { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, name: 'Lendgh Administrator', role: 'ADMIN' },
]

const loanTypes = [
  { name: 'Personal Loan', description: 'Flexible lending for personal expenses.', defaultInterestRate: '12.00', defaultTerm: 12, defaultTermUnit: 'MONTH', repaymentFrequency: 'MONTHLY', minimumAmount: '500.00', maximumAmount: '50000.00' },
  { name: 'Business Loan', description: 'Working capital for small businesses.', defaultInterestRate: '10.00', defaultTerm: 18, defaultTermUnit: 'MONTH', repaymentFrequency: 'MONTHLY', minimumAmount: '5000.00', maximumAmount: '250000.00' },
  { name: 'Emergency Loan', description: 'Short-term support for urgent expenses.', defaultInterestRate: '8.00', defaultTerm: 3, defaultTermUnit: 'MONTH', repaymentFrequency: 'MONTHLY', minimumAmount: '200.00', maximumAmount: '10000.00' },
]

const demoCustomers = [
  { customerNumber: 'CUS-900001', firstName: 'Ama', middleName: 'Serwaa', lastName: 'Mensah', phone: '0244001001', email: 'ama.mensah@example.test', city: 'Accra', region: 'Greater Accra', occupation: 'Retail manager', employer: 'Mensah Home Stores', monthlyIncome: '8500.00', gender: 'FEMALE' },
  { customerNumber: 'CUS-900002', firstName: 'Kojo', lastName: 'Asante', phone: '0244001002', email: 'kojo.asante@example.test', city: 'Kumasi', region: 'Ashanti', occupation: 'Accountant', employer: 'Ashanti Traders Ltd', monthlyIncome: '12000.00', gender: 'MALE' },
  { customerNumber: 'CUS-900003', firstName: 'Efua', lastName: 'Owusu', phone: '0244001003', email: 'efua.owusu@example.test', city: 'Takoradi', region: 'Western', occupation: 'Caterer', employer: 'Efua Catering', monthlyIncome: '6800.00', gender: 'FEMALE' },
  { customerNumber: 'CUS-900004', firstName: 'Yaw', middleName: 'Kofi', lastName: 'Boateng', phone: '0244001004', email: 'yaw.boateng@example.test', city: 'Tema', region: 'Greater Accra', occupation: 'Delivery contractor', employer: 'Independent', monthlyIncome: '9500.00', gender: 'MALE' },
  { customerNumber: 'CUS-900005', firstName: 'Adwoa', lastName: 'Agyeman', phone: '0244001005', email: 'adwoa.agyeman@example.test', city: 'Cape Coast', region: 'Central', occupation: 'Teacher', employer: 'Cape Coast Academy', monthlyIncome: '7200.00', gender: 'FEMALE' },
]

const seedMarker = '[development seed]'
const dateDaysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)
const dateMonthsAgo = (months) => new Date(new Date().getFullYear(), new Date().getMonth() - months, 15)

try {
  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, passwordHash: hashPassword(account.password), role: account.role, status: 'ACTIVE' },
      create: { name: account.name, email: account.email, passwordHash: hashPassword(account.password), role: account.role, status: 'ACTIVE' },
    })
    console.log(`${account.role} account ready: ${account.email}`)
  }

  for (const loanType of loanTypes) {
    await prisma.loanType.upsert({ where: { name: loanType.name }, update: loanType, create: loanType })
  }
  console.log(`Seeded ${loanTypes.length} loan types`)

  if (process.env.SEED_DEMO_DATA !== 'false') {
    const users = await prisma.user.findMany({ where: { email: { in: accounts.map((account) => account.email) } }, select: { id: true, email: true } })
    const superAdmin = users.find((user) => user.email === process.env.SUPER_ADMIN_EMAIL)
    const admin = users.find((user) => user.email === process.env.ADMIN_EMAIL)
    if (!superAdmin || !admin) throw new Error('Seed accounts could not be loaded')

    const customers = {}
    for (const customer of demoCustomers) {
      customers[customer.customerNumber] = await prisma.customer.upsert({
        where: { customerNumber: customer.customerNumber },
        update: customer,
        create: customer,
      })
    }

    const types = await prisma.loanType.findMany({ where: { name: { in: loanTypes.map((type) => type.name) } } })
    const typeByName = Object.fromEntries(types.map((type) => [type.name, type]))
    const loans = [
      { loanNumber: 'LN-900001', customerNumber: 'CUS-900001', type: 'Personal Loan', amount: '18000.00', status: 'PENDING', applicationDate: dateDaysAgo(3), purpose: 'Home improvement', createdById: admin.id },
      { loanNumber: 'LN-900002', customerNumber: 'CUS-900002', type: 'Business Loan', amount: '75000.00', status: 'APPROVED', applicationDate: dateDaysAgo(18), approvalDate: dateDaysAgo(10), purpose: 'Inventory expansion', createdById: admin.id, approvedById: superAdmin.id },
      { loanNumber: 'LN-900003', customerNumber: 'CUS-900003', type: 'Emergency Loan', amount: '4500.00', status: 'ACTIVE', applicationDate: dateDaysAgo(90), approvalDate: dateDaysAgo(84), disbursementDate: dateDaysAgo(80), purpose: 'Medical expenses', createdById: admin.id, approvedById: superAdmin.id, disbursedById: admin.id },
      { loanNumber: 'LN-900004', customerNumber: 'CUS-900004', type: 'Personal Loan', amount: '12000.00', status: 'COMPLETED', applicationDate: dateMonthsAgo(16), approvalDate: dateMonthsAgo(16), disbursementDate: dateMonthsAgo(15), purpose: 'Vehicle repairs', createdById: admin.id, approvedById: superAdmin.id, disbursedById: admin.id },
    ]

    for (const loanInput of loans) {
      const type = typeByName[loanInput.type]
      const customer = customers[loanInput.customerNumber]
      const loanData = {
        loanNumber: loanInput.loanNumber,
        customerId: customer.id,
        loanTypeId: type.id,
        requestedAmount: loanInput.amount,
        approvedAmount: ['APPROVED', 'ACTIVE', 'COMPLETED'].includes(loanInput.status) ? loanInput.amount : null,
        interestRate: type.defaultInterestRate,
        interestType: 'FLAT',
        term: type.defaultTerm,
        repaymentFrequency: type.repaymentFrequency,
        purpose: loanInput.purpose,
        applicationDate: loanInput.applicationDate,
        approvalDate: loanInput.approvalDate ?? null,
        disbursementDate: loanInput.disbursementDate ?? null,
        maturityDate: loanInput.status === 'COMPLETED' ? dateDaysAgo(60) : null,
        status: loanInput.status,
        createdById: loanInput.createdById,
        approvedById: loanInput.approvedById ?? null,
        disbursedById: loanInput.disbursedById ?? null,
        notes: seedMarker,
      }
      const loan = await prisma.loan.upsert({ where: { loanNumber: loanInput.loanNumber }, update: loanData, create: loanData })

      if (['ACTIVE', 'COMPLETED'].includes(loanInput.status)) {
        const installment = Number(loanInput.amount) / type.defaultTerm
        await prisma.loanRepaymentSchedule.deleteMany({ where: { loanId: loan.id } })
        await prisma.loanRepaymentSchedule.createMany({ data: Array.from({ length: type.defaultTerm }, (_, index) => {
          const paid = loanInput.status === 'COMPLETED' || index < 2 ? installment : 0
          const dueDate = new Date(loanInput.disbursementDate)
          dueDate.setMonth(dueDate.getMonth() + index + 1)
          return { loanId: loan.id, installmentNumber: index + 1, dueDate, expectedAmount: installment, principalAmount: installment, interestAmount: 0, amountPaid: paid, remainingAmount: installment - paid, status: paid === installment ? 'PAID' : 'PENDING', paidDate: paid === installment ? new Date(dueDate.getTime() - 24 * 60 * 60 * 1000) : null }
        }) })
        await prisma.loanDisbursement.deleteMany({ where: { loanId: loan.id } })
        await prisma.loanDisbursement.create({ data: { loanId: loan.id, amount: loanInput.amount, disbursementDate: loanInput.disbursementDate, paymentMethod: 'BANK_TRANSFER', referenceNumber: `SEED-${loanInput.loanNumber}`, disbursedById: loanInput.disbursedById } })
      }
    }

    const activeLoan = await prisma.loan.findUnique({ where: { loanNumber: 'LN-900003' } })
    const completedLoan = await prisma.loan.findUnique({ where: { loanNumber: 'LN-900004' } })
    await prisma.repayment.deleteMany({ where: { referenceNumber: { startsWith: 'SEED-' } } })
    await prisma.repayment.createMany({ data: [
      { repaymentNumber: 'PAY-900001', loanId: activeLoan.id, customerId: customers['CUS-900003'].id, amount: '1500.00', paymentDate: dateDaysAgo(35), paymentMethod: 'MOBILE_MONEY', referenceNumber: 'SEED-LN-900003-1', recordedById: admin.id, status: 'PAID', notes: seedMarker },
      { repaymentNumber: 'PAY-900002', loanId: activeLoan.id, customerId: customers['CUS-900003'].id, amount: '1500.00', paymentDate: dateDaysAgo(5), paymentMethod: 'CASH', referenceNumber: 'SEED-LN-900003-2', recordedById: admin.id, status: 'PAID', notes: seedMarker },
      { repaymentNumber: 'PAY-900003', loanId: completedLoan.id, customerId: customers['CUS-900004'].id, amount: '12000.00', paymentDate: dateDaysAgo(65), paymentMethod: 'BANK_TRANSFER', referenceNumber: 'SEED-LN-900004-1', recordedById: superAdmin.id, status: 'PAID', notes: seedMarker },
    ] })

    await prisma.notification.deleteMany({ where: { message: { contains: seedMarker } } })
    await prisma.notification.createMany({ data: [
      { userId: admin.id, title: 'Loan awaiting review', message: `Loan LN-900001 is pending review. ${seedMarker}`, type: 'LOAN', read: false },
      { userId: superAdmin.id, title: 'Repayment received', message: `A development repayment was recorded for LN-900003. ${seedMarker}`, type: 'REPAYMENT', read: false },
      { userId: admin.id, title: 'Portfolio update', message: `Development data includes active and completed loans. ${seedMarker}`, type: 'INFO', read: true },
    ] })

    await prisma.auditLog.deleteMany({ where: { description: { contains: seedMarker } } })
    await prisma.auditLog.createMany({ data: [
      { userId: admin.id, action: 'CUSTOMER_CREATED', entity: 'Customer', entityId: customers['CUS-900001'].id, description: `Development customer Ama Mensah created ${seedMarker}`, metadata: { source: 'seed' } },
      { userId: superAdmin.id, action: 'LOAN_APPROVED', entity: 'Loan', entityId: completedLoan.id, description: `Development loan LN-900004 approved ${seedMarker}`, metadata: { source: 'seed' } },
      { userId: admin.id, action: 'REPAYMENT_RECORDED', entity: 'Repayment', entityId: null, description: `Development repayment recorded ${seedMarker}`, metadata: { source: 'seed' } },
    ] })
    console.log(`Seeded ${demoCustomers.length} customers, ${loans.length} loans, repayments, notifications, and audit logs`)
  }
} finally {
  await prisma.$disconnect()
}
