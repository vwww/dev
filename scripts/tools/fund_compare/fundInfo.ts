export type Comparison = [Fund, Fund]

export type Fund = {
  name: string
  taxYears: TaxYear[] // ordered by year ascending
}

export type TaxYear = {
  year: number
  startPrice: [
    day: number,
    price: number,
  ]
  dividends: DividendPrice[]
  dividendSplit?: {
    total: number
    returnOfCapital?: number
    capitalGains?: number
    otherIncome?: number
    foreignIncome?: number
    foreignTax?: number
    // eligibleDividend?: number // not supported
  }
}

export type DividendPrice = [
  // YYYY-MM-DD
  exDate: string, // ex-dividend/ex-distribution date
  recordDate: string, // record date
  paymentDate: string, // pay date

  price: number, // closing price as of dividend payment date (for reinvestment)
  dividend?: number, // actual cash dividend per share

  reinvestment?: number, // actual reinvested dividend per share
]

export function loadComparison (s: string): Comparison {
  // TODO validate import against schema
  return JSON.parse(s)
}

export function copyFundInfo (fund: Fund): Fund {
  // TODO use deepCopy
  return JSON.parse(JSON.stringify(fund))
}
