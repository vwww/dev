import { padMonthDay, padYear } from '@/util'
import type { Comparison, TaxYear } from './fundInfo'

export type OutcomeMatrix = MatrixRow[]

export type MatrixRow = [year: number, [MatrixRowFund | undefined, MatrixRowFund | undefined]]

export type MatrixRowFund = {
  lines: Line[]
  cols: (MatrixCell | undefined)[]
}

export type MatrixCell = {
  value: number
  lineCount: number
  lineAdditional?: Line[]
}

export type Line = {
  date: string
  description: string
  price: number
  shares: number
  acb: number
  bookValue: number
}

export type TaxConfig = {
  capitalGainsRate: number
  taxRate: number
}

export function generateComparisonMatrix (comparison: Comparison, tax?: TaxConfig): OutcomeMatrix {
  const [a, b] = comparison

  const zipYears = mergeYears(a.taxYears, b.taxYears)

  return zipYears.map(([year], i) => [
    year,
    [
      makeMatrixRow(zipYears, i, 0, tax),
      makeMatrixRow(zipYears, i, 1, tax)
    ]
  ])
}

type ZipYear = [year: number, (TaxYear | undefined)[]]

function mergeYears (a: TaxYear[], b: TaxYear[]): ZipYear[] {
  const zipYears: ZipYear[] = []
  let i = 0, j = 0
  for (;;) {
    const hasA = i < a.length
    const hasB = j < b.length

    if (hasA && (!hasB || a[i].year <= b[j].year)) {
      const useB = hasB && a[i].year == b[j].year
      const ay = a[i++]
      const by = useB ? b[j++] : undefined
      zipYears.push([ay.year, [ay, by]])
    } else if (hasB) {
      const by = b[j++]
      zipYears.push([by.year, [undefined, by]])
    } else {
      return zipYears
    }
  }
}

function makeMatrixRow (zipYears: ZipYear[], i: number, a: number, tax?: TaxConfig): MatrixRowFund | undefined {
  const [baseYearStr, baseYears] = zipYears[i]
  const baseYear = baseYears[a]
  if (!baseYear) return

  const [startDay, startPrice] = baseYear.startPrice
  let shares = 1 / startPrice
  let acb = 1
  let bookValue = 1

  const initialLine: Line = {
    date: `${padYear(baseYearStr)}-01-${padMonthDay(startDay)}`,
    description: 'Initial investment',
    price: startPrice,
    shares,
    acb,
    bookValue,
  }
  const lines = [initialLine]
  const cols: (MatrixCell | undefined)[] = []
  for (let j = i; j < zipYears.length; j++) {
    const [yearStr, years] = zipYears[j]
    const year = years[a]
    if (!year) {
      cols.push(undefined)
      continue
    }

    let dividendTotal = 0
    for (const [
      exDate,
      recordDate,
      paymentDate,
      price,
      dividend,
      reinvestment,
    ] of year.dividends) {
      const description = dividend
        ? `$${dividend} reinvested at $${price.toFixed(2)}, ex ${exDate}, record ${recordDate}${reinvestment ? `, phantom $${reinvestment}` : ''}`
        : `Year-end price is ${price.toFixed(2)}`

      const dividendPerShareCash = dividend ?? 0
      const dividendPerShareAll = dividendPerShareCash + (reinvestment ?? 0)
      const dividendCash = shares * dividendPerShareCash
      const dividendAmount = shares * dividendPerShareAll
      dividendTotal += dividendAmount
      acb += dividendAmount
      bookValue += dividendAmount
      shares += dividendCash / price

      lines.push({
        date: paymentDate,
        description,
        price,
        shares,
        acb,
        bookValue,
      })
    }

    if (!lines.length) continue

    let lineAdditional: Line[] | undefined

    const lastLine = lines[lines.length - 1]
    const price = lastLine?.price ?? baseYear.startPrice[1]

    if (tax) {
      const date = lastLine?.date ?? padYear(yearStr) + '-12-31'

      if (dividendTotal && year.dividendSplit?.total) {
        const {
          total,
          returnOfCapital,
          capitalGains,
          otherIncome,
          foreignIncome,
          foreignTax,
        } = year.dividendSplit

        acb -= dividendTotal * (returnOfCapital ?? 0) / total
        const taxAmount = dividendTotal * (((otherIncome ?? 0) + (capitalGains ?? 0) * tax.capitalGainsRate + (foreignIncome ?? 0)) * tax.taxRate + (foreignTax ?? 0)) / total

        if (taxAmount) {
          const sharesToSell = taxAmount / price
          let acbPerShare = acb / shares
          let bookValuePerShare = bookValue / shares
          shares -= sharesToSell
          acb -= sharesToSell * acbPerShare
          bookValue -= sharesToSell * bookValuePerShare

          lines.push({
            date,
            description: `Tax ${taxAmount < 0 ? 'refunded' : 'paid'} ${yearStr}`,
            price,
            shares,
            acb,
            bookValue,
          })
        }
      }

      const marketValue = price * shares
      if (marketValue !== acb) {
        const taxEffect = (marketValue - acb) * tax.capitalGainsRate * tax.taxRate

        shares -= taxEffect / price
        acb = bookValue = marketValue - taxEffect
        // shares * price
        // == (sharesOld - taxEffect / price) * price
        // == sharesOld * price - taxEffect
        // == marketValue - taxEffect

        lineAdditional = [
          {
            date,
            description: `Disposal tax effect (capital ${taxEffect < 0 ? 'loss refund' : 'gains tax'})`,
            price,
            shares,
            acb,
            bookValue,
          }
        ]
      }
    }

    cols.push({
      value: shares * price,
      lineCount: lines.length,
      lineAdditional,
    })
  }
  return { lines, cols }
}
