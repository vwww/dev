import type { Fund } from './fundInfo'

// TODO handle stock splits
// 2021-07-05 2:1 split

export default {
  name: 'HULC',
  taxYears: [
    { year: 2021, startPrice: [4, 27.68*2], dividends: [['2022-01-10', '2022-01-10', '2022-01-10', 68.25]] },
    { year: 2022, startPrice: [4, 71.23], dividends: [['2023-01-09', '2023-01-09', '2023-01-09', 52.32]] },
    { year: 2023, startPrice: [3, 60.63], dividends: [['2024-01-08', '2024-01-08', '2024-01-08', 75.53]] },
    { year: 2024, startPrice: [2, 74.82], dividends: [['2025-01-07', '2025-01-07', '2025-01-07', 102.22]] },
  ]
} as Fund
