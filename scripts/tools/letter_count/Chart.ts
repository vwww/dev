export interface ChartBase {
  type: 'bar' | 'column' | 'pie'

  options: Highcharts.Options

  update (chart: Highcharts.Chart, data: ChartUpdateData): void
}

export interface ChartUpdateData {
  chrCount: number[]
  sumCount: number
  maxCount: number
}

export const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-!;:"\'[] '
export const VOWELS = 'AEIOUY'
