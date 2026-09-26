export type RepaymentDateFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY'

function addMonthsClamped(date: Date, months: number) {
  const next = new Date(date)
  const dayOfMonth = next.getUTCDate()
  next.setUTCDate(1)
  next.setUTCMonth(next.getUTCMonth() + months)
  const lastDayOfMonth = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate()
  next.setUTCDate(Math.min(dayOfMonth, lastDayOfMonth))
  return next
}

function addPeriod(date: Date, frequency: RepaymentDateFrequency) {
  if (frequency === 'DAILY') {
    const next = new Date(date)
    next.setUTCDate(next.getUTCDate() + 1)
    return next
  }
  if (frequency === 'WEEKLY' || frequency === 'BIWEEKLY') {
    const next = new Date(date)
    next.setUTCDate(next.getUTCDate() + (frequency === 'WEEKLY' ? 7 : 14))
    return next
  }
  return addMonthsClamped(date, frequency === 'MONTHLY' ? 1 : 3)
}

export function calculateRepaymentDueDates(startDate: Date, installments: number, frequency: RepaymentDateFrequency) {
  const dates: Date[] = []
  let dueDate = new Date(startDate)

  for (let installment = 0; installment < installments; installment += 1) {
    dueDate = addPeriod(dueDate, frequency)
    dates.push(new Date(dueDate))
  }

  return dates
}