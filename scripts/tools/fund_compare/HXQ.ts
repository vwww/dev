import type { Fund } from './fundInfo'

// TODO handle stock splits
// 2021-07-05 2:1 split
// 2021-07-06 2:1 split

export default {
  name: 'HXQ',
  taxYears: [
    // 2017-2021 skipped because QQC does not have data
    { year: 2022, startPrice: [4, 58.49], dividends: [['2023-01-09', '2023-01-09', '2023-01-09', 42.27]] },
    { year: 2023, startPrice: [3, 42.21], dividends: [['2024-01-08', '2024-01-08', '2024-01-08', 63.44]] },
    { year: 2024, startPrice: [2, 62.94], dividends: [['2025-01-08', '2025-01-08', '2025-01-08', 87.19]] },
  ]
} as Fund
