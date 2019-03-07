import type { Fund } from './fundInfo'

// TODO handle stock splits
// 2013-11-18 1:2 reverse split
// 2021-07-05 2:1 split

export default {
  name: 'HXS',
  taxYears: [
    // 2011-2012 skipped because VFV does not have data
    { year: 2013, startPrice: [2, 12.71], dividends: [['2014-01-06', '2014-01-06', '2014-01-06', 17.08]] },
    { year: 2014, startPrice: [2, 17.17], dividends: [['2015-01-05', '2015-01-05', '2015-01-05', 21.17]] },
    { year: 2015, startPrice: [2, 21.61], dividends: [['2016-01-05', '2016-01-05', '2016-01-05', 25.60]] },
    { year: 2016, startPrice: [4, 25.39], dividends: [['2017-01-09', '2017-01-09', '2017-01-09', 27.73]] },
    { year: 2017, startPrice: [3, 27.97], dividends: [['2018-01-08', '2018-01-08', '2018-01-08', 32.00]] },
    { year: 2018, startPrice: [2, 31.59], dividends: [['2019-01-08', '2019-01-08', '2019-01-08', 32.52]] },
    { year: 2019, startPrice: [2, 32.46], dividends: [['2020-01-08', '2020-01-08', '2020-01-08', 41.00]] },
    { year: 2020, startPrice: [2, 40.90], dividends: [['2021-01-08', '2021-01-08', '2021-01-08', 47.58]] },
    { year: 2021, startPrice: [4, 46.40], dividends: [['2022-01-10', '2022-01-10', '2022-01-10', 58.67]] },
    { year: 2022, startPrice: [4, 60.49], dividends: [['2023-01-09', '2023-01-09', '2023-01-09', 52.32]] },
    { year: 2023, startPrice: [3, 52.45], dividends: [['2024-01-08', '2024-01-08', '2024-01-08', 64.58]] },
    { year: 2024, startPrice: [2, 64.19], dividends: [['2025-01-07', '2025-01-07', '2025-01-07', 86.99]] },
  ]
} as Fund
