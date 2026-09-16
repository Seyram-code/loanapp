# Financial calculations

All server-side loan calculations use Prisma `Decimal` values and round monetary outputs to two decimal places at installment boundaries.

## Definitions

- **Principal:** approved amount when present; otherwise requested amount.
- **Flat interest:** `principal * (term interest rate / 100)`. The entered rate applies once to the selected Week or Month payment term. For example, GHS 1,000 at 20% produces GHS 200 interest and GHS 1,200 total repayment.
- **Reducing-balance installment:** `P * r * (1 + r)^n / ((1 + r)^n - 1)`, where `P` is principal, `r` is the periodic rate, and `n` is the number of installments. A zero-rate loan uses `P / n`.
- **Total repayment:** principal plus flat interest, or the reducing-balance installment multiplied by the term.
- **Installment amount:** total repayment divided by term for flat interest, or the amortized reducing-balance payment.
- **Paid amount:** the Decimal sum of repayment records for the loan.
- **Outstanding balance:** the Decimal sum of each schedule row's remaining amount.
- **Overdue amount:** the Decimal sum of unpaid schedule rows whose due date is before the calculation time.

The calculation service exposes interest-method-specific functions so additional methods can be added without moving formulas into UI components or route handlers.
