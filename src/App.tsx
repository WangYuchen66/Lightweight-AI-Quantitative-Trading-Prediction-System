import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleGauge,
  Database,
  Download,
  ExternalLink,
  Eye,
  Fingerprint,
  FlaskConical,
  Layers3,
  Menu,
  Radio,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import snapshotData from './data/snapshot.json'
import type { ChartPoint, NewsItem, Snapshot, StockAsset, StockCandle } from './types'

const snapshot = snapshotData as Snapshot

const pct = (value: number, digits = 1) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(digits)}%`
const plainPct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`
const number = (value: number) => new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value)
const moneyCn = (value: number) => value >= 1e8 ? `${(value / 1e8).toFixed(1)} 亿` : `${(value / 1e4).toFixed(0)} 万`

const spring = { type: 'spring' as const, stiffness: 110, damping: 18 }

const scenarioMap = {
  base: { name: '基准情景', icon: CircleGauge, probability: 0, returnShift: 0, exposure: 1, note: '维持当前已观测的价格结构与信息条件' },
  policy: { name: '政策增量', icon: Sparkles, probability: 0.072, returnShift: 0.018, exposure: 1.18, note: '政策预期改善，风险偏好与流动性因子同步修复' },
  sentiment: { name: '舆情冲击', icon: Radio, probability: -0.108, returnShift: -0.025, exposure: 0.62, note: '负面事件密度上升，舆情约束触发风险敞口收缩' },
  liquidity: { name: '流动性收缩', icon: Activity, probability: -0.064, returnShift: -0.016, exposure: 0.74, note: '成交活跃度回落且波动率抬升，信号置信水平下降' },
}

type ScenarioKey = keyof typeof scenarioMap

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="NEXUS Alpha 首页">
      <span className="brand-mark"><span /></span>
      <span className="brand-word">NEXUS<span>/ALPHA</span></span>
    </a>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  const nav = [
    ['市场表征', '#market'],
    ['舆情归因', '#sentiment'],
    ['实证检验', '#backtest'],
    ['情景分析', '#scenario'],
    ['研究方法', '#method'],
  ]
  return (
    <header className="site-header">
      <Logo />
      <nav className="desktop-nav" aria-label="主导航">
        {nav.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
      </nav>
      <div className="header-actions">
        <span className="live-chip"><i />研究快照</span>
        <button className="icon-button" aria-label="信号通知"><Bell size={18} /></button>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="切换导航">{open ? <X /> : <Menu />}</button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav className="mobile-nav" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {nav.map(([label, href]) => <a href={href} onClick={() => setOpen(false)} key={href}>{label}</a>)}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}

function TickerTape() {
  const items = [...snapshot.market, ...snapshot.market]
  return (
    <div className="ticker-shell" aria-label="市场指数行情">
      <div className="ticker-track">
        {items.map((asset, index) => (
          <div className="ticker-item" key={`${asset.id}-${index}`}>
            <span>{asset.name}</span>
            <strong>{number(asset.price)}</strong>
            <em className={asset.change >= 0 ? 'up' : 'down'}>{pct(asset.change, 2)}</em>
          </div>
        ))}
      </div>
    </div>
  )
}

function Hero() {
  const primary = snapshot.market[0]
  return (
    <section className="hero" id="top">
      <div className="hero-orbit orbit-one" />
      <div className="hero-orbit orbit-two" />
      <div className="hero-copy">
        <motion.div className="eyebrow" initial={false} animate={{ opacity: 1, y: 0 }}>
          <span><BrainCircuit size={14} /></span> 多模态因子研究 · 风险约束决策
        </motion.div>
        <motion.h1 initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          AI量化交易<br /><span>预测系统</span>
        </motion.h1>
        <motion.p initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          将价量结构、风险因子与财经语义映射为可解释、可回溯、可检验的研究信号，<br className="desktop-only" />并以信息边界和不确定性度量约束结论强度。
        </motion.p>
        <motion.div className="hero-actions" initial={false} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <a className="primary-button" href="#market">查看市场研究 <ArrowRight size={17} /></a>
          <a className="text-button" href="#method">研究方法与边界 <ChevronRight size={16} /></a>
        </motion.div>
        <div className="trust-row">
          <span><ShieldCheck size={15} /> 严格样本外检验</span>
          <span><Fingerprint size={15} /> 全链路信号溯源</span>
          <span><Database size={15} /> 多源公开数据</span>
        </div>
      </div>

      <motion.div className="hero-signal" initial={false} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ ...spring, delay: .12 }}>
        <div className="scanline" />
        <div className="signal-topline">
          <span className="mono">SIGNAL / {primary.code}</span>
          <span className="pulse-label"><i /> 已更新</span>
        </div>
        <div className="signal-identity">
          <div>
            <small>模型决策</small>
            <h2>{snapshot.signal.action}</h2>
          </div>
          <div className="signal-glyph"><TrendingUp size={31} /></div>
        </div>
        <div className="probability-rail">
          <div className="rail-label"><span>未来 5 日上行概率</span><strong>{(snapshot.signal.probability * 100).toFixed(1)}%</strong></div>
          <div className="rail"><motion.i initial={{ width: 0 }} animate={{ width: `${snapshot.signal.probability * 100}%` }} transition={{ duration: 1.1, delay: .45 }} /></div>
          <div className="rail-scale"><span>0</span><span>中性</span><span>100</span></div>
        </div>
        <div className="signal-stats">
          <div><small>模型观测区间</small><strong>{number(snapshot.signal.targetLow)}—{number(snapshot.signal.targetHigh)}</strong></div>
          <div><small>预测时域</small><strong>{snapshot.signal.horizon}</strong></div>
        </div>
        <div className="signal-footer">
          <span><ShieldCheck size={15} /> 风险约束：{snapshot.signal.riskGate}</span>
          <span className="mono">CONF. {snapshot.signal.confidence}</span>
        </div>
      </motion.div>
    </section>
  )
}

function SectionHeading({ kicker, title, text, number: step }: { kicker: string; title: string; text: string; number: string }) {
  return (
    <div className="section-heading">
      <div className="section-number mono">{step}</div>
      <div>
        <span className="section-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  )
}

function PriceTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  const labelMap: Record<string, string> = { close: '收盘', ma20: 'MA20', forecast: '模型中枢', upper: '置信上界', lower: '置信下界' }
  return (
    <div className="chart-tooltip">
      <span className="mono">{label}</span>
      {payload.filter(p => p.value != null).map(item => (
        <div key={item.name}><i style={{ background: item.color }} /><span>{labelMap[item.name] ?? item.name}</span><strong>{number(item.value)}</strong></div>
      ))}
    </div>
  )
}

function MarketChart() {
  const [range, setRange] = useState(90)
  const data = useMemo(() => {
    const historical = snapshot.chart.filter(point => point.close != null)
    const future = snapshot.chart.filter(point => point.forecast != null)
    const selected = historical.slice(-range)
    const last = selected[selected.length - 1]
    return [
      ...selected,
      { ...last, forecast: last?.close, upper: last?.close, lower: last?.close },
      ...future,
    ] as ChartPoint[]
  }, [range])
  const forecastStart = data.find(point => point.forecast != null && point.close == null)?.date

  return (
    <div className="market-chart card-surface">
      <div className="panel-heading">
        <div>
          <div className="asset-line"><span className="asset-logo">沪</span><div><strong>沪深300</strong><small>000300.SH · 日线</small></div></div>
        </div>
        <div className="price-block">
          <strong>{number(snapshot.market[0].price)}</strong>
          <span className={snapshot.market[0].change >= 0 ? 'up' : 'down'}>{snapshot.market[0].change >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{pct(snapshot.market[0].change, 2)}</span>
        </div>
        <div className="range-tabs" aria-label="图表时间范围">
          {[30, 60, 90, 150].map((value, index) => <button className={range === value ? 'active' : ''} onClick={() => setRange(value)} key={value}>{['1M', '3M', '6M', 'ALL'][index]}</button>)}
        </div>
      </div>
      <div className="chart-legend"><span><i className="legend-price" />收盘价</span><span><i className="legend-ma" />MA20</span><span><i className="legend-forecast" />5日预测区间</span></div>
      <div className="chart-wrap" aria-label="沪深300价格与预测区间图">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d3ff69" stopOpacity=".18" /><stop offset="100%" stopColor="#d3ff69" stopOpacity="0" /></linearGradient>
              <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7ee7c6" stopOpacity=".22" /><stop offset="100%" stopColor="#7ee7c6" stopOpacity=".02" /></linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={28} tick={{ fill: '#77827d', fontSize: 11, fontFamily: 'DM Mono' }} />
            <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} width={54} tick={{ fill: '#77827d', fontSize: 11, fontFamily: 'DM Mono' }} />
            <Tooltip content={<PriceTooltip />} cursor={{ stroke: 'rgba(211,255,105,.22)', strokeDasharray: '3 3' }} />
            {forecastStart && <ReferenceLine x={forecastStart} stroke="rgba(126,231,198,.45)" strokeDasharray="4 4" label={{ value: 'FORECAST', fill: '#7ee7c6', fontSize: 9, position: 'insideTopRight' }} />}
            <Area type="monotone" dataKey="close" stroke="#d3ff69" fill="url(#priceFill)" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="ma20" stroke="#65736d" strokeWidth={1.2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="upper" stroke="rgba(126,231,198,.55)" fill="url(#forecastFill)" strokeWidth={1} dot={false} connectNulls isAnimationActive={false} />
            <Line type="monotone" dataKey="lower" stroke="rgba(126,231,198,.42)" strokeWidth={1} dot={false} connectNulls isAnimationActive={false} />
            <Line type="monotone" dataKey="forecast" stroke="#7ee7c6" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2, fill: '#7ee7c6' }} connectNulls isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-caption"><span><Eye size={14} /> 阴影为历史波动率外推的 80% 经验区间</span><span>数据截至 {snapshot.market[0].asOf}</span></div>
    </div>
  )
}

type CandleShapeProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: StockCandle
}

function CandleShape({ x = 0, y = 0, width = 0, height = 0, payload }: CandleShapeProps) {
  if (!payload) return null
  const spread = Math.max(payload.high - payload.low, .0001)
  const rising = payload.close >= payload.open
  const color = rising ? '#d3ff69' : '#ff806d'
  const bodyTop = y + ((payload.high - Math.max(payload.open, payload.close)) / spread) * height
  const bodyHeight = Math.max(2, (Math.abs(payload.close - payload.open) / spread) * height)
  const center = x + width / 2
  return (
    <g aria-hidden="true">
      <line x1={center} x2={center} y1={y} y2={y + height} stroke={color} strokeWidth={1} opacity={.9} />
      <rect x={x + Math.max(1, width * .16)} y={bodyTop} width={Math.max(2, width * .68)} height={bodyHeight} rx={1} fill={rising ? color : 'rgba(255,128,109,.22)'} stroke={color} />
    </g>
  )
}

function StockTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: StockCandle }> }) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  const rising = row.close >= row.open
  return (
    <div className="stock-tooltip">
      <div className="stock-tooltip-date"><span>{row.fullDate}</span><em className={rising ? 'up' : 'down'}>{rising ? '上涨' : '下跌'}</em></div>
      <div className="ohlc-grid"><span>开 <strong>{row.open.toFixed(2)}</strong></span><span>高 <strong>{row.high.toFixed(2)}</strong></span><span>收 <strong>{row.close.toFixed(2)}</strong></span><span>低 <strong>{row.low.toFixed(2)}</strong></span></div>
      <div className="tooltip-volume">成交量 <strong>{row.volume.toFixed(1)} 万手</strong></div>
    </div>
  )
}

function StockWorkbench() {
  const [stockId, setStockId] = useState(snapshot.stocks[0]?.id ?? '')
  const [range, setRange] = useState(60)
  const [mode, setMode] = useState<'candle' | 'trend'>('candle')
  const stock = snapshot.stocks.find(item => item.id === stockId) ?? snapshot.stocks[0]
  const data = useMemo(() => stock.chart.slice(-range), [stock, range])
  const domain = useMemo(() => {
    const lows = data.map(item => item.low)
    const highs = data.map(item => item.high)
    return [Math.min(...lows) * .985, Math.max(...highs) * 1.015]
  }, [data])
  const yearPosition = Math.max(0, Math.min(100, (stock.price - stock.low52) / Math.max(stock.high52 - stock.low52, .01) * 100))

  return (
    <div className="stock-workbench card-surface">
      <div className="stock-tabs" role="group" aria-label="选择真实股票">
        {snapshot.stocks.map(item => (
          <button className={item.id === stock.id ? 'active' : ''} onClick={() => setStockId(item.id)} aria-pressed={item.id === stock.id} key={item.id}>
            {item.id === stock.id && <motion.span className="active-stock-bg" layoutId="active-stock" transition={spring} />}
            <span><strong>{item.name}</strong><small>{item.code}</small></span>
            <em className={item.change >= 0 ? 'up' : 'down'}>{pct(item.change, 2)}</em>
          </button>
        ))}
      </div>

      <div className="stock-toolbar">
        <AnimatePresence mode="wait">
          <motion.div className="stock-identity" key={stock.id} initial={false} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
            <div className="stock-avatar">{stock.name.slice(0, 1)}</div>
            <div><div className="stock-name-line"><h3>{stock.name}</h3><span>{stock.sector}</span></div><p>{stock.code} · {stock.adjustment}日线 · 数据截至 {stock.asOf}</p></div>
          </motion.div>
        </AnimatePresence>
        <div className="stock-price"><strong>{number(stock.price)}</strong><span className={stock.change >= 0 ? 'up' : 'down'}>{stock.change >= 0 ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}{pct(stock.change, 2)} <em>{stock.changeAmount >= 0 ? '+' : ''}{stock.changeAmount.toFixed(2)}</em></span></div>
        <div className="stock-view-controls">
          <div className="view-toggle"><button className={mode === 'candle' ? 'active' : ''} onClick={() => setMode('candle')}>K 线</button><button className={mode === 'trend' ? 'active' : ''} onClick={() => setMode('trend')}>走势</button></div>
          <div className="range-tabs">{[20, 60, 120].map(value => <button className={range === value ? 'active' : ''} onClick={() => setRange(value)} key={value}>{value === 20 ? '1M' : value === 60 ? '3M' : '6M'}</button>)}</div>
        </div>
      </div>

      <div className="real-data-banner"><Radio size={14} /><span>A 股真实行情快照</span><i />AKShare · 东方财富公开数据</div>
      <div className="stock-chart" role="img" aria-label={`${stock.name}${mode === 'candle' ? '日 K 线' : '收盘走势'}，含20日和60日均线`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 14, right: 8, bottom: 0, left: 2 }}>
            <defs><linearGradient id="stockTrendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d3ff69" stopOpacity=".18" /><stop offset="1" stopColor="#d3ff69" stopOpacity="0" /></linearGradient></defs>
            <CartesianGrid stroke="rgba(255,255,255,.065)" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={35} tick={{ fill: '#94a29b', fontSize: 12, fontFamily: 'DM Mono' }} />
            <YAxis domain={domain} axisLine={false} tickLine={false} width={64} tick={{ fill: '#94a29b', fontSize: 12, fontFamily: 'DM Mono' }} tickFormatter={value => Number(value).toFixed(stock.price > 100 ? 0 : 1)} />
            <Tooltip content={<StockTooltip />} cursor={{ stroke: 'rgba(211,255,105,.25)', strokeDasharray: '4 4' }} />
            {mode === 'candle' ? <Bar dataKey="range" shape={<CandleShape />} isAnimationActive={false} /> : <Area type="monotone" dataKey="close" stroke="#d3ff69" strokeWidth={2.2} fill="url(#stockTrendFill)" dot={false} isAnimationActive={false} />}
            <Line type="monotone" dataKey="ma20" stroke="#7ee7c6" strokeWidth={1.3} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="ma60" stroke="#9a8cff" strokeWidth={1.1} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="volume-chart" role="img" aria-label={`${stock.name}成交量`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 8, bottom: 0, left: 67 }}>
            <Bar dataKey="volume" isAnimationActive={false}>{data.map((item, index) => <Cell fill={item.close >= item.open ? 'rgba(211,255,105,.38)' : 'rgba(255,128,109,.38)'} key={index} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
        <span>VOL / 万手</span>
      </div>
      <div className="stock-stats">
        <div><span>今开 / 最高</span><strong>{stock.open.toFixed(2)} <em>/</em> {stock.high.toFixed(2)}</strong></div>
        <div><span>成交额 / 换手</span><strong>{moneyCn(stock.amount)} <em>/</em> {plainPct(stock.turnover, 2)}</strong></div>
        <div><span>量比 / MA20</span><strong>{stock.volumeRatio.toFixed(2)} <em>/</em> {stock.ma20.toFixed(2)}</strong></div>
        <div className="year-range"><span>52 周位置</span><div><i style={{ left: `${yearPosition}%` }} /></div><small>{stock.low52.toFixed(0)}—{stock.high52.toFixed(0)}</small></div>
      </div>
    </div>
  )
}

function FactorPanel() {
  const factors = snapshot.model.feature_importance.slice(0, 6)
  const max = Math.max(...factors.map(item => item.importance))
  return (
    <div className="factor-panel card-surface">
      <div className="panel-title-row"><div><span className="mini-kicker">INDEX TIMING MODEL</span><h3>沪深300因子贡献</h3></div><button className="icon-button" aria-label="刷新模型信息"><RefreshCcw size={16} /></button></div>
      <div className="factor-score">
        <div className="score-ring" style={{ '--score': `${snapshot.signal.probability * 360}deg` } as React.CSSProperties}>
          <div><strong>{(snapshot.signal.probability * 100).toFixed(1)}</strong><small>5 日上行概率</small></div>
        </div>
        <div><span>模型结论</span><strong>{snapshot.signal.action}</strong><small>{snapshot.model.name}</small></div>
      </div>
      <div className="factor-list">
        {factors.map((factor, index) => (
          <div className="factor-item" key={factor.key}>
            <div><span>{factor.label}</span><em className={factor.direction >= 0 ? 'positive' : 'negative'}>{factor.direction >= 0 ? '+' : ''}{factor.direction.toFixed(3)}</em></div>
            <div className="factor-bar"><motion.i initial={{ width: 0 }} whileInView={{ width: `${(factor.importance / max) * 100}%` }} viewport={{ once: true }} transition={{ delay: index * .06 }} /></div>
          </div>
        ))}
      </div>
      <div className="audit-note"><Fingerprint size={17} /><p><strong>因子贡献说明</strong>贡献度采用随机森林的平均不纯度下降估计；方向值对应最新观测期的标准化因子暴露。两者用于解释模型决策来源，不应视为独立的收益预测。</p></div>
    </div>
  )
}

function MetricCard({ label, value, meta, icon: Icon, tone = 'default' }: { label: string; value: string; meta: string; icon: typeof Activity; tone?: 'default' | 'good' | 'warn' }) {
  return (
    <motion.div className={`metric-card ${tone}`} whileHover={{ y: -4 }} transition={spring}>
      <div className="metric-icon"><Icon size={17} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </motion.div>
  )
}

function MarketSection() {
  const m = snapshot.backtest.metrics
  return (
    <section className="section" id="market">
      <SectionHeading number="01" kicker="MARKET INTELLIGENCE" title="多维市场表征与信号溯源" text="以价量结构、波动特征与成交行为构建联合判断；当证据强度不足时，风险预算自动收敛。" />
      <div className="dashboard-grid"><StockWorkbench /><FactorPanel /></div>
      <div className="metrics-grid">
        <MetricCard icon={Target} label="样本外累计回报" value={pct(m.total_return)} meta={`${snapshot.backtest.testStart} 至 ${snapshot.backtest.testEnd}`} tone="good" />
        <MetricCard icon={ShieldCheck} label="最大净值回撤" value={plainPct(m.max_drawdown)} meta="计入 10bp 单边成本" tone="good" />
        <MetricCard icon={CircleGauge} label="风险调整回报" value={m.sharpe.toFixed(2)} meta="年化 Sharpe" />
        <MetricCard icon={Activity} label="平均市场敞口" value={plainPct(m.exposure)} meta={`${m.trades} 次仓位调整`} tone="warn" />
      </div>
    </section>
  )
}

function SentimentGauge() {
  const { positive, neutral, negative } = snapshot.sentiment.distribution
  const total = Math.max(positive + neutral + negative, 1)
  const score = snapshot.sentiment.score
  return (
    <div className="sentiment-gauge card-surface">
      <span className="mini-kicker">NARRATIVE PULSE</span>
      <h3>财经语义因子</h3>
      <div className="sentiment-dial">
        <div className="dial-arc" style={{ '--dial': `${(score + 1) * 90}deg` } as React.CSSProperties}><span /></div>
        <div className="dial-value"><strong>{score >= 0 ? '+' : ''}{score.toFixed(2)}</strong><span>{score > .15 ? '偏积极' : score < -.15 ? '偏消极' : '中性'}</span></div>
      </div>
      <div className="sentiment-scale"><span>风险规避</span><span>情绪中性</span><span>风险偏好</span></div>
      <div className="sentiment-dist">
        <div><i className="pos" style={{ width: `${positive / total * 100}%` }} /><span>积极 {positive}</span></div>
        <div><i className="neu" style={{ width: `${neutral / total * 100}%` }} /><span>中性 {neutral}</span></div>
        <div><i className="neg" style={{ width: `${negative / total * 100}%` }} /><span>消极 {negative}</span></div>
      </div>
      <div className="risk-gate"><ShieldCheck size={18} /><div><small>舆情风险约束</small><strong>{snapshot.signal.riskGate}执行</strong></div><span>LIVE</span></div>
    </div>
  )
}

function NewsFeed() {
  const [selected, setSelected] = useState<NewsItem | null>(snapshot.sentiment.news[0] ?? null)
  return (
    <div className="news-panel card-surface">
      <div className="panel-title-row"><div><span className="mini-kicker">EVIDENCE STREAM</span><h3>事件证据链</h3></div><span className="source-note">{snapshot.sentiment.news.length} 条已溯源资讯</span></div>
      {snapshot.sentiment.news.length ? (
        <div className="news-list">
          {snapshot.sentiment.news.slice(0, 6).map((item, index) => (
            <button className={`news-item ${selected?.title === item.title ? 'selected' : ''}`} onClick={() => setSelected(item)} key={`${item.title}-${index}`}>
              <span className={`sentiment-dot ${item.label}`} />
              <div><div className="news-meta"><span>{item.source}</span><em>{item.published.slice(5, 16)}</em></div><strong>{item.title}</strong><div className="tag-row">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>
              <span className={`score-badge ${item.score >= 0 ? 'up' : 'down'}`}>{item.score >= 0 ? '+' : ''}{item.score.toFixed(2)}</span>
            </button>
          ))}
        </div>
      ) : <div className="empty-state">当前研究快照暂无可用资讯；量化因子链路保持独立运行。</div>}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div className="news-detail" key={selected.title} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div><Sparkles size={16} /><span>语义归因</span></div>
            <p>{selected.rationale}；事件影响等级评估为“{selected.impact}”。</p>
            <a href={selected.url} target="_blank" rel="noreferrer">查阅原始来源 <ExternalLink size={13} /></a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SentimentSection() {
  return (
    <section className="section" id="sentiment">
      <SectionHeading number="02" kicker="SENTIMENT RADAR" title="从信息流中识别可验证的定价线索" text="文本引擎提取事件方向、影响等级与风险标签，并保留原始来源，确保模型结论具备完整审计路径。" />
      <div className="sentiment-grid"><SentimentGauge /><NewsFeed /></div>
    </section>
  )
}

function EquityTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><span className="mono">{label}</span>{payload.map(p => <div key={p.name}><i style={{ background: p.color }} /><span>{p.name === 'strategy' ? 'NEXUS 策略' : '沪深300'}</span><strong>{p.value.toFixed(1)}</strong></div>)}</div>
}

function BacktestSection() {
  const [view, setView] = useState<'equity' | 'drawdown'>('equity')
  const m = snapshot.backtest.metrics
  return (
    <section className="section" id="backtest">
      <SectionHeading number="03" kicker="OUT-OF-SAMPLE LAB" title="以样本外证据约束模型判断" text="基于时间序列完成训练与测试隔离，采用次日执行并计入交易成本；所有结果均按统一口径如实呈现。" />
      <div className="backtest-card card-surface">
        <div className="backtest-head">
          <div><span className="mini-kicker">WALK-FORWARD RESULT</span><h3>策略净值与风险轨迹</h3><p>{snapshot.backtest.testStart} — {snapshot.backtest.testEnd} · 初始净值 100</p></div>
          <div className="view-toggle"><button className={view === 'equity' ? 'active' : ''} onClick={() => setView('equity')}>累计净值</button><button className={view === 'drawdown' ? 'active' : ''} onClick={() => setView('drawdown')}>策略回撤</button></div>
        </div>
        <div className="backtest-layout">
          <div className="equity-chart">
            <ResponsiveContainer width="100%" height="100%">
              {view === 'equity' ? (
                <AreaChart data={snapshot.backtest.curve} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
                  <defs><linearGradient id="strategyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d3ff69" stopOpacity=".18" /><stop offset="1" stopColor="#d3ff69" stopOpacity="0" /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,.055)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={55} tick={{ fill: '#77827d', fontSize: 10 }} tickFormatter={v => v.slice(0, 7)} />
                  <YAxis axisLine={false} tickLine={false} width={42} tick={{ fill: '#77827d', fontSize: 10 }} />
                  <Tooltip content={<EquityTooltip />} />
                  <ReferenceLine y={100} stroke="rgba(255,255,255,.12)" />
                  <Area type="monotone" dataKey="strategy" name="strategy" stroke="#d3ff69" strokeWidth={2} fill="url(#strategyFill)" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="benchmark" name="benchmark" stroke="#708079" strokeWidth={1.3} dot={false} isAnimationActive={false} />
                </AreaChart>
              ) : (
                <AreaChart data={snapshot.backtest.curve} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
                  <defs><linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff806d" stopOpacity=".05" /><stop offset="1" stopColor="#ff806d" stopOpacity=".24" /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,.055)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={55} tick={{ fill: '#77827d', fontSize: 10 }} tickFormatter={v => v.slice(0, 7)} />
                  <YAxis axisLine={false} tickLine={false} width={42} tick={{ fill: '#77827d', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(value) => [`${Number(Array.isArray(value) ? value[0] : value ?? 0).toFixed(2)}%`, '策略回撤']} />
                  <Area type="monotone" dataKey="drawdown" stroke="#ff806d" strokeWidth={1.7} fill="url(#ddFill)" dot={false} isAnimationActive={false} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="result-sheet">
            <div className="result-row hero-result"><span>样本外累计回报</span><strong>{pct(m.total_return)}</strong><small>同期基准 {pct(m.benchmark_return)}</small></div>
            <div className="result-row"><span>最大净值回撤</span><strong>{plainPct(m.max_drawdown)}</strong><small>风险预算优先</small></div>
            <div className="result-row"><span>胜率 / 平均敞口</span><strong>{plainPct(m.win_rate)} <em>/</em> {plainPct(m.exposure)}</strong><small>低换手择时框架</small></div>
            <div className="result-row"><span>样本外 AUC</span><strong>{snapshot.model.test_auc.toFixed(3)}</strong><small>{snapshot.model.test_auc >= .5 ? '呈现有限预测信息' : '未形成稳定预测优势'}</small></div>
          </div>
        </div>
        <div className="honesty-bar"><ShieldCheck size={17} /><p><strong>实证结论：</strong>本期模型有效降低市场敞口与回撤，但累计回报及 AUC 未显著优于基准。当前维持“观望”信号，以避免在低置信区间承担非必要风险敞口。</p></div>
      </div>
    </section>
  )
}

function ScenarioSection() {
  const [scenario, setScenario] = useState<ScenarioKey>('base')
  const [cost, setCost] = useState(10)
  const active = scenarioMap[scenario]
  const adjustedProbability = Math.max(.05, Math.min(.95, snapshot.signal.probability + active.probability))
  const impliedReturn = ((adjustedProbability - .5) * .16 + active.returnShift) * active.exposure
  const annualCostDrag = Math.max(0, cost - 10) / 10_000 * snapshot.backtest.metrics.trades / 6.2
  const adjustedAnnual = snapshot.backtest.metrics.annualized_return - annualCostDrag
  const scenarioBars = [
    { label: '上行概率', value: adjustedProbability * 100, max: 100 },
    { label: '风险敞口', value: Math.min(100, snapshot.backtest.metrics.exposure * active.exposure * 100), max: 100 },
    { label: '5日隐含回报', value: Math.max(0, 50 + impliedReturn * 1000), max: 100 },
  ]

  return (
    <section className="section" id="scenario">
      <SectionHeading number="04" kicker="COUNTERFACTUAL ENGINE" title="多重市场状态下的组合压力检验" text="通过调整政策、舆情与流动性假设，评估信号概率、风险敞口及交易成本的联动响应。" />
      <div className="scenario-shell">
        <div className="scenario-controls">
          <div className="control-group"><span className="mini-kicker">市场状态假设</span><div className="scenario-buttons">{(Object.keys(scenarioMap) as ScenarioKey[]).map(key => { const Icon = scenarioMap[key].icon; return <button className={scenario === key ? 'active' : ''} onClick={() => setScenario(key)} key={key}><Icon size={16} />{scenarioMap[key].name}</button> })}</div></div>
          <div className="cost-control"><div><span>单边交易成本</span><strong className="mono">{cost} BP</strong></div><input type="range" min="0" max="50" step="5" value={cost} onChange={event => setCost(Number(event.target.value))} aria-label="单边交易成本" /><div className="range-label"><span>0</span><span>25</span><span>50</span></div></div>
        </div>
        <div className="scenario-output">
          <AnimatePresence mode="wait">
            <motion.div className="scenario-summary" key={scenario} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <div className="scenario-icon"><active.icon size={24} /></div>
              <span>情景推演 / {active.name}</span>
              <h3>{adjustedProbability >= .58 ? '风险预算具备上调空间' : adjustedProbability < .44 ? '风险约束触发敞口收缩' : '方向性证据尚不充分'}</h3>
              <p>{active.note}</p>
              <div className="scenario-values"><div><small>上行概率</small><strong>{(adjustedProbability * 100).toFixed(1)}%</strong></div><div><small>5 日隐含回报</small><strong className={impliedReturn >= 0 ? 'up' : 'down'}>{pct(impliedReturn)}</strong></div><div><small>成本调整后年化</small><strong>{pct(adjustedAnnual)}</strong></div></div>
            </motion.div>
          </AnimatePresence>
          <div className="scenario-bars" aria-label="情景变量结果">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scenarioBars} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="label" width={88} axisLine={false} tickLine={false} tick={{ fill: '#a7b0ac', fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} isAnimationActive={false}>{scenarioBars.map((_, index) => <Cell fill={index === 0 ? '#d3ff69' : index === 1 ? '#7ee7c6' : '#718079'} key={index} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}

function MethodSection() {
  const disciplines = [
    {
      code: '01', eyebrow: 'DATA INTEGRITY', title: '数据完整性与时间因果', icon: Database,
      thesis: '研究结论成立的前提，是所有输入均满足当时点可得性并通过时间边界审计。',
      guardrail: '无法确认可得时点的特征不得进入训练与回测',
      items: [
        { title: '多源时钟统一', text: 'K 线、盘口、资金流、宏观指标、公告与舆情统一时区；复权、停牌、涨跌停及跳空事件显式标记。' },
        { title: '隔绝未来泄露', text: 't 时点特征仅使用当时已公开信息；特征窗口、预测时点、成交时点与标签区间相互隔离。' },
        { title: '分层清洗降噪', text: '价格序列完成去趋势与波动率归一；异常毛刺隔离处理，但保留极端行情与黑天鹅样本。' },
        { title: '覆盖市场状态', text: '按牛市、熊市与震荡市分层采样，并校正涨跌标签分布，降低单一行情依赖。' },
      ],
    },
    {
      code: '02', eyebrow: 'HYBRID INTELLIGENCE', title: '轻量化多模型融合', icon: BrainCircuit,
      thesis: '结构化模型刻画价量与资金行为，轻量语义模型补充经事实核验的事件信息。',
      guardrail: '模型压缩、推理延迟与归因稳定性均需独立验证',
      items: [
        { title: '结构化时序引擎', text: 'LightGBM、XGBoost 与轻量时序网络刻画价量、盘口和资金行为，保留低延迟与稳定解释能力。' },
        { title: '财经语义引擎', text: '量化小模型提取新闻、公告与政策中的事件方向、可信度、影响等级及有效时域。' },
        { title: '受控信号融合', text: '文本事件只在事实校验通过后修正量价信号；通过门控权重避免单一模态主导决策。' },
        { title: '压缩与解释约束', text: '采用量化、蒸馏、剪枝与特征筛选控制复杂度，并以 SHAP 区分量价驱动与事件驱动。' },
      ],
    },
    {
      code: '03', eyebrow: 'OUT-OF-SAMPLE FIRST', title: '时序训练与样本外验证', icon: FlaskConical,
      thesis: '模型选择与参数评估仅依据历史可用样本，最终结论以独立样本外表现为准。',
      guardrail: '训练、验证与测试必须严格按时间顺序推进',
      items: [
        { title: '滚动时序验证', text: '训练、验证与测试严格按时间推进，模拟模型定期重训及逐日增量获取数据的真实过程。' },
        { title: '多层抗过拟合', text: '限制因子数量与参数自由度，结合树模型正则、Dropout 及受限微调抑制历史记忆。' },
        { title: '独立压力区间', text: '完整牛熊切换、流动性枯竭与极端波动区间不参与训练，单独用于尾部风险检验。' },
        { title: '分层评价体系', text: '同时审阅 Sharpe、最大回撤、盈亏比、胜率、持仓稳定性及收益分布，不以准确率替代投资价值。' },
      ],
    },
    {
      code: '04', eyebrow: 'EXECUTION REALITY', title: '现实交易仿真与线上闭环', icon: Zap,
      thesis: '方向概率经成交约束、成本核算与仓位映射后，方可转换为组合层决策变量。',
      guardrail: '次日成交、显式成本与容量限制纳入统一回测口径',
      items: [
        { title: '高保真成交仿真', text: '统一计入手续费、滑点、冲击成本、涨跌停、停牌及流动性不足造成的成交限制。' },
        { title: '信号到仓位映射', text: '设置单票上限、波动率降仓与多模态共振条件，禁止将方向预测直接等价为满仓指令。' },
        { title: '实盘反馈回流', text: '每日回收委托、成交、滑点与盈亏数据，持续校准成本模型及训练样本。' },
        { title: '预测漂移治理', text: '监控特征分布、命中率与风险调整收益变化，市场风格切换时自动触发降级或重训。' },
      ],
    },
    {
      code: '05', eyebrow: 'RISK OVERRIDES ALPHA', title: '风险优先与事实约束', icon: ShieldCheck,
      thesis: '任何方向性模型输出均不得绕过事实核验、风险预算与组合限额。',
      guardrail: '风险阈值触发结果覆盖方向性模型输出',
      items: [
        { title: '语义事实校验', text: '对新闻来源、政策原文与事件主体进行可信度评分及交叉验证，抑制幻觉与误读触发交易。' },
        { title: '动态风险闸门', text: '净值回撤、行业集中度、隔夜风险及波动率触及阈值时，系统强制减仓或停止新增敞口。' },
        { title: '尾部风险衰减', text: '极端事件降低模型置信权重并扩大不确定性区间，避免用常态分布解释肥尾冲击。' },
        { title: '因子生命周期治理', text: '持续评估公开因子的拥挤度与衰减速度，优先保留低频、可验证且具信息增量的信号。' },
      ],
    },
  ]
  const [activeDiscipline, setActiveDiscipline] = useState(0)
  const active = disciplines[activeDiscipline]
  const ActiveIcon = active.icon

  return (
    <section className="section method-section" id="method">
      <SectionHeading number="05" kicker="RESEARCH DISCIPLINE" title="面向非平稳市场的五层研究约束" text="金融市场同时具有高噪声、肥尾、交易摩擦与对抗博弈属性。模型结论必须置于数据因果、样本外验证、执行可行性和组合风险的共同约束下。" />
      <motion.div className="market-reality" initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="reality-statement">
          <span className="mini-kicker">PRIOR ASSUMPTION / 市场先验</span>
          <h3>所有模型结论均应同时满足<em>信息可得性、样本外有效性与交易可执行性。</em></h3>
        </div>
        <div className="reality-tags" aria-label="金融市场底层约束">
          {['非平稳', '高噪声', '肥尾分布', '交易摩擦', '信息边界', '对抗博弈'].map((label, index) => <span key={label}><i className="mono">0{index + 1}</i>{label}</span>)}
        </div>
      </motion.div>

      <div className="discipline-shell">
        <div className="discipline-rail" role="tablist" aria-label="五层研究约束">
          {disciplines.map((discipline, index) => {
            const Icon = discipline.icon
            return (
              <motion.button
                type="button"
                role="tab"
                aria-selected={activeDiscipline === index}
                className={activeDiscipline === index ? 'active' : ''}
                onClick={() => setActiveDiscipline(index)}
                whileHover={{ x: 3 }}
                key={discipline.code}
              >
                {activeDiscipline === index && <motion.i className="discipline-active" layoutId="discipline-active" />}
                <span className="discipline-code mono">{discipline.code}</span>
                <span className="discipline-label"><small>{discipline.eyebrow}</small><strong>{discipline.title}</strong></span>
                <Icon size={17} />
              </motion.button>
            )
          })}
        </div>

        <div className="discipline-stage" role="tabpanel">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              className="discipline-detail"
              key={active.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: .24, ease: 'easeOut' }}
            >
              <div className="discipline-head">
                <div className="discipline-icon"><ActiveIcon size={22} /></div>
                <div><span className="mini-kicker">PRIORITY {active.code} / {active.eyebrow}</span><h3>{active.title}</h3></div>
              </div>
              <p className="discipline-thesis">{active.thesis}</p>
              <div className="discipline-checks">
                {active.items.map((item, index) => (
                  <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .045 }} key={item.title}>
                    <span className="check-index mono">0{index + 1}</span>
                    <div><strong>{item.title}</strong><p>{item.text}</p></div>
                    <Check size={15} />
                  </motion.div>
                ))}
              </div>
              <div className="discipline-guard"><ShieldCheck size={17} /><span>约束判定规则</span><strong>{active.guardrail}</strong></div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="method-bottom">
        <div><span className="mini-kicker">MODEL CARD</span><h3>{snapshot.model.name}</h3><p>训练样本 {snapshot.model.train_samples.toLocaleString()} · 样本外 {snapshot.model.test_samples.toLocaleString()} · 预测窗口 {snapshot.model.horizon_days} 日</p></div>
        <div className="method-tags"><span><Check size={13} /> 时序切分</span><span><Check size={13} /> 次日执行</span><span><Check size={13} /> 全成本约束</span><span><Check size={13} /> 因子可解释</span><span><Check size={13} /> 可复现快照</span></div>
        <button className="secondary-button" onClick={() => window.print()}><Download size={16} /> 生成研究简报</button>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer>
      <div className="footer-main"><Logo /><p>AI-native quantitative intelligence<br />for disciplined decisions.</p><div className="footer-links"><a href="#market">市场表征</a><a href="#sentiment">舆情归因</a><a href="#backtest">实证检验</a><a href="#method">研究方法</a></div></div>
      <div className="disclaimer"><ShieldCheck size={15} /><p>本系统仅用于课程实践与量化研究，不构成投资建议或收益承诺。历史实证不代表未来表现；公开数据可能存在延迟、缺失或修订。</p><span className="mono">NEXUS ALPHA / 2026</span></div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Hero />
        <TickerTape />
        <MarketSection />
        <SentimentSection />
        <BacktestSection />
        <ScenarioSection />
        <MethodSection />
      </main>
      <Footer />
      <div className="page-noise" />
    </div>
  )
}
