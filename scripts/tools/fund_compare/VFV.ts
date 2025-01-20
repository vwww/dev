import type { Fund } from './fundInfo'

export default {
  name: 'VFV',
  taxYears: [
    {
      year: '2023',
      startPrice: [
        '01-03',
        92.76
      ],
      dividends: [
        [
          '2023-03-24',
          '2023-03-27',
          '2023-04-03',
          98.11,
          0.328133
        ],
        [
          '2023-06-29',
          '2023-06-30',
          '2023-07-10',
          103.8,
          0.323476
        ],
        [
          '2023-09-28',
          '2023-09-29',
          '2023-10-06',
          104.4,
          0.316489
        ],
        [
          '2023-12-28',
          '2023-12-29',
          '2024-01-08',
          112.8,
          0.374806
        ]
      ],
      dividendSplit: {
        total: 1.342904,
        returnOfCapital: 0.002710,
        capitalGains: 0,
        otherIncome: 0,
        foreignIncome: 1.586124,
        foreignTax: -0.245930
      }
    },
  ]
} as Fund
