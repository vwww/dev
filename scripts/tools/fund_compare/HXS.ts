import type { Fund } from './fundInfo'

// TODO handle stock splits
// 2013-11-18 1:2 reverse split
// 2021-07-05 2:1 split

export default {
  name: 'HXS',
  taxYears: [
    { year: 2023, startPrice: [3, 52.45], dividends: [['2024-01-08', '2024-01-08', '2024-01-08', 64.58]] },
  ]
} as Fund
