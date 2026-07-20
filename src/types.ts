export interface MarketAsset {
  id: string
  symbol: string
  name: string
  code: string
  price: number
  change: number
  change20: number
  asOf: string
}

export interface ChartPoint {
  date: string
  full_date: string
  close?: number
  ma20?: number | null
  volume?: number
  forecast?: number
  upper?: number
  lower?: number
}

export interface NewsItem {
  title: string
  summary: string
  published: string
  source: string
  url: string
  score: number
  label: '积极' | '中性' | '消极'
  impact: string
  tags: string[]
  rationale: string
  engine: string
}

export interface CurvePoint {
  date: string
  strategy: number
  benchmark: number
  drawdown: number
}

export interface StockCandle {
  date: string
  fullDate: string
  open: number
  close: number
  high: number
  low: number
  range: [number, number]
  ma20: number | null
  ma60: number | null
  volume: number
}

export interface StockAsset {
  id: string
  symbol: string
  name: string
  code: string
  sector: string
  price: number
  open: number
  high: number
  low: number
  change: number
  changeAmount: number
  volume: number
  amount: number
  turnover: number
  high52: number
  low52: number
  ma20: number
  ma60: number
  volumeRatio: number
  asOf: string
  adjustment: string
  chart: StockCandle[]
}

export interface Snapshot {
  meta: {
    product: string
    generatedAt: string
    dataSource: string
    mode: string
  }
  market: MarketAsset[]
  stocks: StockAsset[]
  signal: {
    assetId: string
    action: string
    probability: number
    confidence: number
    horizon: string
    sentimentScore: number
    riskGate: string
    targetLow: number
    targetHigh: number
  }
  chart: ChartPoint[]
  model: {
    name: string
    horizon_days: number
    train_samples: number
    test_samples: number
    test_auc: number
    test_accuracy: number
    latest_probability: number
    feature_importance: Array<{
      key: string
      label: string
      importance: number
      direction: number
    }>
  }
  backtest: {
    metrics: {
      total_return: number
      benchmark_return: number
      annualized_return: number
      annualized_volatility: number
      sharpe: number
      max_drawdown: number
      win_rate: number
      exposure: number
      trades: number
    }
    curve: CurvePoint[]
    testStart: string
    testEnd: string
    assumptions: {
      transactionCostBps: number
      slippageBps: number
      execution: string
      mode: string
    }
  }
  sentiment: {
    score: number
    distribution: { positive: number; neutral: number; negative: number }
    news: NewsItem[]
  }
}
