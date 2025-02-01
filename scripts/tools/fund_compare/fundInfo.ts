import { z } from 'zod'

export type DividendPrice = [
  // YYYY-MM-DD
  exDate: string, // ex-dividend/ex-distribution date
  recordDate: string, // record date
  paymentDate: string, // pay date

  price: number, // closing price as of dividend payment date (for reinvestment)
  dividend?: number, // actual cash dividend per share

  reinvestment?: number, // actual reinvested dividend per share

  // for UI
  expanded?: boolean
]
const DividendPrice = z.union([
  z.tuple([z.string(), z.string(), z.string(), z.number()]),
  z.tuple([z.string(), z.string(), z.string(), z.number(), z.number()]),
  z.tuple([z.string(), z.string(), z.string(), z.number(), z.number(), z.number()]),
  z.tuple([z.string(), z.string(), z.string(), z.number(), z.number(), z.number(), z.boolean()]),
])

const TaxYear = z.object({
  year: z.number(),
  startPrice: z.tuple([
    z.number(), // day
    z.number(), // price
  ]),
  dividends: DividendPrice.array(),
  dividendSplit: z.object({
    total: z.number(),
    returnOfCapital: z.number().optional(),
    capitalGains: z.number().optional(),
    otherIncome: z.number().optional(),
    foreignIncome: z.number().optional(),
    foreignTax: z.number().optional(),
    // eligibleDividend: z.number().optional() // not supported
  }).optional(),

  // for UI
  expanded: z.boolean().optional(),
})
export type TaxYear = z.infer<typeof TaxYear>

const Fund = z.object({
  name: z.string(),
  taxYears: TaxYear.array(), // ordered by year ascending
})
export type Fund = z.infer<typeof Fund>

const Comparison = z.tuple([Fund, Fund])
export type Comparison = z.infer<typeof Comparison>

export function loadComparison (s: string): Comparison {
  return Comparison.parse(JSON.parse(s))
}
