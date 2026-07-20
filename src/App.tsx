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
  base: { name: '基准情景', icon: CircleGauge, probability: 0, returnShift: 0, exposure: 1, note: '公开信息与价格因子保持当前状态' },
  policy: { name: '政策增量', icon: Sparkles, probability: 0.072, returnShift: 0.018, exposure: 1.18, note: '风险偏好回升，估值与量能因子同步改善' },
  sentiment: { name: '舆情冲击', icon: Radio, probability: -0.108, returnShift: -0.025, exposure: 0.62, note: '负面事件聚集，舆情风险闸门主动降仓' },
  liquidity: { name: '流动性收缩', icon: Activity, probability: -0.064, returnShift: -0.016, exposure: 0.74, note: '成交量下降、波动率上升，信号置信度衰减' },
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
    ['市场洞察', '#market'],
    ['舆情雷达', '#sentiment'],
    ['策略验证', '#backtest'],
    ['情景实验', '#scenario'],
    ['方法论', '#method'],
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
          <span><BrainCircuit size={14} /></span> 机器学习 × 大模型 × 量化研究
        </motion.div>
        <motion.h1 initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          让信号，先于<br /><span>叙事抵达。</span>
        </motion.h1>
        <motion.p initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          把价格、量能与财经文本压缩为一张可解释的决策卡。<br className="desktop-only" />不预测神话，只量化不确定性。
        </motion.p>
        <motion.div className="hero-actions" initial={false} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <a className="primary-button" href="#market">查看今日信号 <ArrowRight size={17} /></a>
          <a className="text-button" href="#method">阅读方法论 <ChevronRight size={16} /></a>
        </motion.div>
        <div className="trust-row">
          <span><ShieldCheck size={15} /> 样本外验证</span>
          <span><Fingerprint size={15} /> 信号可追溯</span>
          <span><Database size={15} /> 公开数据源</span>
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
            <small>AI 决策</small>
            <h2>{snapshot.signal.action}</h2>
          </div>
          <div className="signal-glyph"><TrendingUp size={31} /></div>
        </div>
        <div className="probability-rail">
          <div className="rail-label"><span>上涨概率</span><strong>{(snapshot.signal.probability * 100).toFixed(1)}%</strong></div>
          <div className="rail"><motion.i initial={{ width: 0 }} animate={{ width: `${snapshot.signal.probability * 100}%` }} transition={{ duration: 1.1, delay: .45 }} /></div>
          <div className="rail-scale"><span>0</span><span>中性</span><span>100</span></div>
        </div>
        <div className="signal-stats">
          <div><small>观察区间</small><strong>{number(snapshot.signal.targetLow)}—{number(snapshot.signal.targetHigh)}</strong></div>
          <div><small>决策周期</small><strong>{snapshot.signal.horizon}</strong></div>
        </div>
        <div className="signal-footer">
          <span><ShieldCheck size={15} /> 风险闸门：{snapshot.signal.riskGate}</span>
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

      <div className="real-data-banner"><Radio size={14} /><span>真实 A 股行情</span><i />AKShare · 东方财富公开数据</div>
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
          <div><strong>{(snapshot.signal.probability * 100).toFixed(1)}</strong><small>上涨概率</small></div>
        </div>
        <div><span>当前判断</span><strong>{snapshot.signal.action}</strong><small>{snapshot.model.name}</small></div>
      </div>
      <div className="factor-list">
        {factors.map((factor, index) => (
          <div className="factor-item" key={factor.key}>
            <div><span>{factor.label}</span><em className={factor.direction >= 0 ? 'positive' : 'negative'}>{factor.direction >= 0 ? '+' : ''}{factor.direction.toFixed(3)}</em></div>
            <div className="factor-bar"><motion.i initial={{ width: 0 }} whileInView={{ width: `${(factor.importance / max) * 100}%` }} viewport={{ once: true }} transition={{ delay: index * .06 }} /></div>
          </div>
        ))}
      </div>
      <div className="audit-note"><Fingerprint size={15} /><p><strong>可审计说明</strong>贡献度来自随机森林不纯度下降；方向值是当前标准化前因子，不能单独解释为买卖建议。</p></div>
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
      <SectionHeading number="01" kicker="MARKET INTELLIGENCE" title="一眼看清，信号从何而来" text="价格趋势、波动与量能共同投票；置信度不足时，系统明确选择不交易。" />
      <div className="dashboard-grid"><StockWorkbench /><FactorPanel /></div>
      <div className="metrics-grid">
        <MetricCard icon={Target} label="样本外累计收益" value={pct(m.total_return)} meta={`${snapshot.backtest.testStart} 至 ${snapshot.backtest.testEnd}`} tone="good" />
        <MetricCard icon={ShieldCheck} label="最大回撤" value={plainPct(m.max_drawdown)} meta="含双边 10bp 成本" tone="good" />
        <MetricCard icon={CircleGauge} label="风险调整收益" value={m.sharpe.toFixed(2)} meta="年化 Sharpe" />
        <MetricCard icon={Activity} label="市场暴露" value={plainPct(m.exposure)} meta={`${m.trades} 次仓位切换`} tone="warn" />
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
      <h3>市场叙事温度</h3>
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
      <div className="risk-gate"><ShieldCheck size={18} /><div><small>情绪风险闸门</small><strong>{snapshot.signal.riskGate}运行</strong></div><span>LIVE</span></div>
    </div>
  )
}

function NewsFeed() {
  const [selected, setSelected] = useState<NewsItem | null>(snapshot.sentiment.news[0] ?? null)
  return (
    <div className="news-panel card-surface">
      <div className="panel-title-row"><div><span className="mini-kicker">EVIDENCE STREAM</span><h3>事件证据流</h3></div><span className="source-note">近 {snapshot.sentiment.news.length} 条公开资讯</span></div>
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
      ) : <div className="empty-state">当前快照未包含新闻，量化信号仍可独立运行。</div>}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div className="news-detail" key={selected.title} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div><Sparkles size={16} /><span>AI 归因</span></div>
            <p>{selected.rationale}；预期影响强度为“{selected.impact}”。</p>
            <a href={selected.url} target="_blank" rel="noreferrer">查看原文 <ExternalLink size={13} /></a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SentimentSection() {
  return (
    <section className="section" id="sentiment">
      <SectionHeading number="02" kicker="SENTIMENT RADAR" title="把噪声，变成可追溯的证据" text="文本引擎抽取方向、影响与风险标签；每一个判断都保留原始来源，不让大模型成为黑箱。" />
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
      <SectionHeading number="03" kicker="OUT-OF-SAMPLE LAB" title="用未知数据，检验已知想法" text="训练集与测试集按时间切分，信号滞后一日执行并计入交易成本；结果不好看时，也完整展示。" />
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
            <div className="result-row hero-result"><span>样本外累计</span><strong>{pct(m.total_return)}</strong><small>基准 {pct(m.benchmark_return)}</small></div>
            <div className="result-row"><span>最大回撤</span><strong>{plainPct(m.max_drawdown)}</strong><small>资金保护优先</small></div>
            <div className="result-row"><span>胜率 / 暴露</span><strong>{plainPct(m.win_rate)} <em>/</em> {plainPct(m.exposure)}</strong><small>低频择时</small></div>
            <div className="result-row"><span>测试 AUC</span><strong>{snapshot.model.test_auc.toFixed(3)}</strong><small>{snapshot.model.test_auc >= .5 ? '存在弱预测信息' : '当前无稳定预测优势'}</small></div>
          </div>
        </div>
        <div className="honesty-bar"><ShieldCheck size={17} /><p><strong>结果解读：</strong>本期模型显著降低市场暴露与回撤，但收益和 AUC 未超过基准；因此当前产品输出“观望”，不把低置信预测包装为确定机会。</p></div>
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
    { label: '方向概率', value: adjustedProbability * 100, max: 100 },
    { label: '建议仓位', value: Math.min(100, snapshot.backtest.metrics.exposure * active.exposure * 100), max: 100 },
    { label: '5日隐含收益', value: Math.max(0, 50 + impliedReturn * 1000), max: 100 },
  ]

  return (
    <section className="section" id="scenario">
      <SectionHeading number="04" kicker="COUNTERFACTUAL ENGINE" title="不要猜未来，先压力测试未来" text="改变政策、情绪与流动性假设，观察信号概率、仓位和成本敏感性如何联动。" />
      <div className="scenario-shell">
        <div className="scenario-controls">
          <div className="control-group"><span className="mini-kicker">选择市场状态</span><div className="scenario-buttons">{(Object.keys(scenarioMap) as ScenarioKey[]).map(key => { const Icon = scenarioMap[key].icon; return <button className={scenario === key ? 'active' : ''} onClick={() => setScenario(key)} key={key}><Icon size={16} />{scenarioMap[key].name}</button> })}</div></div>
          <div className="cost-control"><div><span>单边交易成本</span><strong className="mono">{cost} BP</strong></div><input type="range" min="0" max="50" step="5" value={cost} onChange={event => setCost(Number(event.target.value))} aria-label="单边交易成本" /><div className="range-label"><span>0</span><span>25</span><span>50</span></div></div>
        </div>
        <div className="scenario-output">
          <AnimatePresence mode="wait">
            <motion.div className="scenario-summary" key={scenario} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <div className="scenario-icon"><active.icon size={24} /></div>
              <span>当前运行 / {active.name}</span>
              <h3>{adjustedProbability >= .58 ? '风险预算可适度上调' : adjustedProbability < .44 ? '触发防守型降仓' : '等待更多方向确认'}</h3>
              <p>{active.note}</p>
              <div className="scenario-values"><div><small>方向概率</small><strong>{(adjustedProbability * 100).toFixed(1)}%</strong></div><div><small>5日隐含收益</small><strong className={impliedReturn >= 0 ? 'up' : 'down'}>{pct(impliedReturn)}</strong></div><div><small>成本后年化</small><strong>{pct(adjustedAnnual)}</strong></div></div>
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
  const steps = [
    { icon: Database, title: '数据对齐', text: 'OHLCV 与财经资讯按可获得时间对齐，避免把未来信息泄漏进训练集。' },
    { icon: BrainCircuit, title: '双引擎融合', text: '随机森林学习价格因子；文本引擎输出方向、影响、期限与证据标签。' },
    { icon: ShieldCheck, title: '风险闸门', text: '低置信度、负面事件聚集或波动抬升时，仓位自动收缩至现金。' },
    { icon: FlaskConical, title: '样本外验证', text: '按时间 70/30 切分，次日执行、计入成本，保留失败结果与模型版本。' },
  ]
  return (
    <section className="section method-section" id="method">
      <SectionHeading number="05" kicker="SYSTEM DESIGN" title="轻量，不意味着轻率" text="一条可在个人电脑运行、可替换数据源、可接入真实大模型与交易接口的研究链路。" />
      <div className="method-flow">
        {steps.map((step, index) => {
          const Icon = step.icon
          return <motion.div className="method-step" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} key={step.title}><span className="step-index mono">0{index + 1}</span><div className="method-icon"><Icon size={20} /></div><h3>{step.title}</h3><p>{step.text}</p>{index < steps.length - 1 && <ChevronRight className="flow-arrow" size={20} />}</motion.div>
        })}
      </div>
      <div className="method-bottom">
        <div><span className="mini-kicker">MODEL CARD</span><h3>{snapshot.model.name}</h3><p>训练样本 {snapshot.model.train_samples.toLocaleString()} · 样本外 {snapshot.model.test_samples.toLocaleString()} · 预测窗口 {snapshot.model.horizon_days} 日</p></div>
        <div className="method-tags"><span><Check size={13} /> 时间切分</span><span><Check size={13} /> 成本建模</span><span><Check size={13} /> 可解释因子</span><span><Check size={13} /> 离线快照</span></div>
        <button className="secondary-button" onClick={() => window.print()}><Download size={16} /> 导出研究简报</button>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer>
      <div className="footer-main"><Logo /><p>AI-native quantitative intelligence<br />for disciplined decisions.</p><div className="footer-links"><a href="#market">市场洞察</a><a href="#sentiment">舆情雷达</a><a href="#backtest">策略验证</a><a href="#method">方法论</a></div></div>
      <div className="disclaimer"><ShieldCheck size={15} /><p>本项目仅用于课程实践与量化研究展示，不构成任何投资建议。历史回测不代表未来表现；公开数据可能存在延迟、缺失或修订。</p><span className="mono">NEXUS ALPHA / 2026</span></div>
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
