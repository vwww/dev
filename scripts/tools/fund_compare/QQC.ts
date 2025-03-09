import type { Fund } from './fundInfo'

export default {
  name: 'QQC',
  taxYears: [
    {
      year: 2022,
      startPrice: [4, 24.75],
      dividends: [
        ['2022-03-29', '2022-03-30', '2022-04-07', 21.97, 0.04446],
        ['2022-06-28', '2022-06-29', '2022-07-08', 18.73, 0.04236],
        ['2022-09-28', '2022-09-29', '2022-10-07', 18.09, 0.03675],
        ['2022-12-28', '2022-12-29', '2023-01-09', 17.77, 0.03666, 0.27337],
      ],
      dividendSplit: {
        total: 0.43360,
        returnOfCapital: 0.04209,
        capitalGains: 0.27258,
        otherIncome: 0.00934,
        foreignIncome: 0.12691,
        foreignTax: -0.01732
      }
    },
    {
      year: 2023,
      startPrice: [3, 17.71],
      dividends: [
        ['2023-03-29', '2023-03-30', '2023-04-10', 21.03, 0.03066],
        ['2023-06-28', '2023-06-29', '2023-07-10', 23.80, 0.03039],
        ['2023-09-27', '2023-09-28', '2023-10-06', 24.38, 0.03122],
        ['2023-12-27', '2023-12-28', '2024-01-08', 26.46, 0.05167, 0.64792],
      ],
      dividendSplit: {
        total: 0.79186,
        returnOfCapital: 0.04483,
        capitalGains: 0.60835,
        otherIncome: 0,
        foreignIncome: 0.15961,
        foreignTax: -0.02093
      }
    },
  ]
} as Fund
