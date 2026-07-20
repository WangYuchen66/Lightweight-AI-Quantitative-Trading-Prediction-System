from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any


POSITIVE_WORDS = {
    "上涨": 0.50,
    "涨幅": 0.45,
    "高开": 0.35,
    "突破": 0.55,
    "增长": 0.36,
    "增持": 0.52,
    "回购": 0.50,
    "利好": 0.72,
    "创新高": 0.72,
    "超预期": 0.78,
    "提振": 0.48,
    "支持": 0.28,
    "稳定": 0.30,
    "放量": 0.26,
}

NEGATIVE_WORDS = {
    "下跌": -0.50,
    "跌幅": -0.45,
    "低开": -0.35,
    "风险": -0.34,
    "减持": -0.58,
    "亏损": -0.64,
    "利空": -0.72,
    "新低": -0.66,
    "不及预期": -0.78,
    "处罚": -0.65,
    "调查": -0.48,
    "收紧": -0.38,
    "承压": -0.42,
    "回落": -0.30,
}

RISK_TAGS = {
    "政策": "政策",
    "监管": "监管",
    "流动性": "流动性",
    "业绩": "基本面",
    "财报": "基本面",
    "回购": "资本运作",
    "减持": "资本运作",
    "外资": "资金面",
    "主力": "资金面",
    "成交": "交易热度",
}


@dataclass
class SentimentResult:
    score: float
    label: str
    impact: str
    horizon: str
    rationale: str
    tags: list[str]
    engine: str


def lexicon_analyze(text: str) -> SentimentResult:
    score = 0.0
    evidence: list[str] = []
    for word, weight in POSITIVE_WORDS.items():
        if word in text:
            score += weight
            evidence.append(word)
    for word, weight in NEGATIVE_WORDS.items():
        if word in text:
            score += weight
            evidence.append(word)
    score = max(-1.0, min(1.0, score))
    label = "积极" if score > 0.15 else "消极" if score < -0.15 else "中性"
    impact = "高" if abs(score) >= 0.62 else "中" if abs(score) >= 0.30 else "低"
    tags = list(dict.fromkeys(tag for key, tag in RISK_TAGS.items() if key in text))[:3]
    rationale = f"命中金融语义：{'、'.join(evidence[:4])}" if evidence else "未发现显著方向性金融词汇"
    return SentimentResult(score, label, impact, "1—5交易日", rationale, tags or ["市场"], "finance-lexicon-v1")


def llm_analyze(text: str) -> SentimentResult:
    """Use an LLM for auditable event sentiment when OPENAI_API_KEY is configured."""
    if not os.getenv("OPENAI_API_KEY"):
        return lexicon_analyze(text)
    try:
        from openai import OpenAI

        client = OpenAI()
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5-mini"),
            input=[
                {
                    "role": "system",
                    "content": (
                        "你是谨慎的中国股票事件研究员。只分析给定文本，不补充事实。"
                        "返回 JSON：score(-1到1), label(积极/中性/消极), impact(高/中/低), "
                        "horizon, rationale(不超过40字), tags(最多3个)。"
                    ),
                },
                {"role": "user", "content": text[:2500]},
            ],
        )
        payload: dict[str, Any] = json.loads(response.output_text)
        return SentimentResult(
            score=max(-1.0, min(1.0, float(payload["score"]))),
            label=str(payload["label"]),
            impact=str(payload["impact"]),
            horizon=str(payload["horizon"]),
            rationale=str(payload["rationale"]),
            tags=[str(tag) for tag in payload.get("tags", [])][:3],
            engine="openai-structured-sentiment",
        )
    except Exception:
        return lexicon_analyze(text)

