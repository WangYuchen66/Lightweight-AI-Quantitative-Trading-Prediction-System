# 领先产品调研与设计转化

调研日期：2026-07-20。仅采用产品官方页面或官方文档作为核心依据。

## 1. QuantConnect / LEAN

官方把 LEAN 定位为开源的算法交易引擎，并强调同一算法可在回测与实盘之间迁移；其流式分析通过“时间前沿”降低未来数据泄漏风险。QuantConnect 还将 Alpha 统一描述为方向、幅度、置信度和建议权重，而不是一个孤立的买卖标签。

来源：

- [QuantConnect Algorithm Engine](https://www.quantconnect.com/docs/v2/writing-algorithms/key-concepts/algorithm-engine)
- [QuantConnect Alpha Key Concepts](https://www.quantconnect.com/docs/v2/writing-algorithms/algorithm-framework/alpha/key-concepts)
- [QuantConnect Backtesting](https://www.quantconnect.com/docs/v2/cloud-platform/backtesting)

本项目的转化：

- 采用严格的时间切分和次日执行，防止同日信号偷看未来；
- 输出方向概率、置信度、观察区间和风险状态；
- 把快照生成与产品页面解耦，为后续接入实时数据保留接口。

## 2. TradingView

TradingView 的优势不是单个技术指标，而是把图表、筛选器、条件提醒、策略测试和脚本环境组织为连续工作流。官方功能页显示其提醒可组合价格、指标、图形和自定义逻辑，策略测试器也同时展示交易与风险指标。

来源：

- [TradingView Features](https://www.tradingview.com/features/)
- [TradingView Alerts](https://www.tradingview.com/support/solutions/43000520149-introduction-to-tradingview-alerts/)

本项目的转化：

- 图表与信号卡在同一视野中，避免“数据页”和“结论页”割裂；
- 时间范围、净值/回撤、新闻证据和情景假设均可交互；
- 页面保留清晰的信号状态，为后续条件提醒接口提供落点。

## 3. Bloomberg PORT

Bloomberg PORT 将持仓、风险、绩效、归因和情景压力测试整合在同一工作流中。官方说明特别强调风险驱动、绩效归因和因子/宏观等多类情景测试。

来源：

- [Bloomberg Portfolio & Risk Analytics](https://professional.bloomberg.com/products/bloomberg-terminal/portfolio-analytics/)

本项目的转化：

- 不只展示收益，同时展示回撤、暴露、交易次数和风险调整收益；
- 因子贡献与模型卡直接进入产品界面；
- 增加反事实情景实验室，让用户观察假设变化如何影响概率和仓位。

## 4. AlphaSense

AlphaSense 官方平台强调结构化金融数据、定性研究和内部知识的统一搜索，并要求生成式研究结果准确、可审计；其监控功能把定制看板与定期提醒结合起来。

来源：

- [AlphaSense Platform](https://www.alpha-sense.com/platform/)

本项目的转化：

- 新闻情绪不只给分数，还保留来源、链接、命中语义、影响强度与标签；
- LLM 采用受约束 JSON 输出，失败时回退到本地词典；
- 文本结果只作为风险闸门的一部分，不直接替代价格模型。

## 5. Numerai Signals

Numerai 把基本面、技术面、另类数据和混合因子统一抽象为 0—1 信号，并强调信号需要在样本外持续提交和验证。官方也明确指出，仅凭验证诊断很容易过拟合，持续纸面交易更有意义。

来源：

- [Numerai Signals Overview](https://docs.numer.ai/numerai-signals/signals-overview)
- [Numerai Signals Data](https://docs.numer.ai/numerai-signals/data)

本项目的转化：

- 用 0—1 方向概率作为跨模型通用接口；
- 明示样本外区间与测试 AUC，不把训练集表现当成产品价值；
- 产品结论允许是“观望”，而不是每天强行产生交易。

## 综合定位

NEXUS Alpha 不试图复制机构终端的数据规模，而是把最有价值的产品原则压缩到个人电脑可运行的范围：

| 领先实践 | 本项目落地 |
|---|---|
| 研究与执行一致 | 因果特征、次日执行、可版本化快照 |
| 图表即工作台 | 信号、行情、因子、资讯同屏联动 |
| 收益风险一体 | 净值、回撤、暴露、成本同时展示 |
| AI 结果可审计 | 新闻原文、规则证据、模型卡 |
| 情景压力测试 | 政策、舆情、流动性、成本四类反事实 |

