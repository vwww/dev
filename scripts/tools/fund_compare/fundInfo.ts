import * as d from 'decoders'

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
const DividendPrice = d.either(
  d.tuple(d.string, d.string, d.string, d.number),
  d.tuple(d.string, d.string, d.string, d.number, d.number),
  d.tuple(d.string, d.string, d.string, d.number, d.number, d.number),
  d.tuple(d.string, d.string, d.string, d.number, d.number, d.number, d.boolean),
)

const TaxYear = d.object({
  year: d.number,
  startPrice: d.tuple(
    d.number, // day
    d.number, // price
  ),
  dividends: d.array(DividendPrice),
  dividendSplit: d.optional(d.object({
    total: d.number,
    returnOfCapital: d.optional(d.number),
    capitalGains: d.optional(d.number),
    otherIncome: d.optional(d.number),
    foreignIncome: d.optional(d.number),
    foreignTax: d.optional(d.number),
    // eligibleDividend: d.optional(d.number) // not supported
  })),

  // for UI
  expanded: d.optional(d.boolean),
})
export type TaxYear = d.DecoderType<typeof TaxYear>

const Fund = d.object({
  name: d.string,
  taxYears: d.array(TaxYear), // ordered by year ascending
})
export type Fund = d.DecoderType<typeof Fund>

const Comparison = d.tuple(Fund, Fund)
export type Comparison = d.DecoderType<typeof Comparison>

export function loadComparison (str: string): Comparison {
  return Comparison.verify(JSON.parse(str), d.formatShort)
}
