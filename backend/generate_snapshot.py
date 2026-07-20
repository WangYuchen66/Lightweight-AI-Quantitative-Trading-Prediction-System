from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import akshare as ak
import pandas as pd

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.quant_engine import build_market_chart, train_and_backtest
from backend.sentiment import lexicon_analyze


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT = ROOT / "src" / "data" / "snapshot.json"

ASSETS = [
    {"id": "CSI300", "symbol": "sh000300", "name": "沪深300", "code": "000300.SH"},
    {"id": "SSE", "symbol": "sh000001", "name": "上证指数", "code": "000001.SH"},
    {"id": "CSI500", "symbol": "sh000905", "name": "中证500", "code": "000905.SH"},
    {"id": "CHINEXT", "symbol": "sz399006", "name": "创业板指", "code": "399006.SZ"},
]


def fetch_asset(asset: dict[str, str]) -> pd.DataFrame:
    frame = ak.stock_zh_index_daily(symbol=asset["symbol"])
    frame["date"] = pd.to_datetime(frame["date"])
    return frame.dropna().sort_values("date").reset_index(drop=True)


def market_summary(asset: dict[str, str], frame: pd.DataFrame) -> dict[str, Any]:
    latest = frame.iloc[-1]
    previous = frame.iloc[-2]
    change = float(latest["close"] / previous["close"] - 1)
    twenty_day = float(latest["close"] / frame.iloc[-21]["close"] - 1)
    return {
        **asset,
        "price": round(float(latest["close"]), 2),
        "change": round(change, 4),
        "change20": round(twenty_day, 4),
        "asOf": pd.Timestamp(latest["date"]).strftime("%Y-%m-%d"),
    }


def fetch_news() -> list[dict[str, Any]]:
    try:
        source = ak.stock_news_em(symbol="A股").head(10)
        items = []
        for row in source.itertuples(index=False, name=None):
            title, content, published, publisher, link = str(row[1]), str(row[2]), str(row[3]), str(row[4]), str(row[5])
            result = lexicon_analyze(f"{title}。{content[:500]}")
            items.append(
                {
                    "title": title,
                    "summary": content[:90] + ("…" if len(content) > 90 else ""),
                    "published": published,
                    "source": publisher,
                    "url": link,
                    "score": round(result.score, 2),
                    "label": result.label,
                    "impact": result.impact,
                    "tags": result.tags,
                    "rationale": result.rationale,
                    "engine": result.engine,
                }
            )
        return items
    except Exception as exc:
        print(f"news fetch warning: {exc}", file=sys.stderr)
        return []


def generate(output: Path) -> dict[str, Any]:
    market = []
    frames: dict[str, pd.DataFrame] = {}
    for asset in ASSETS:
        frame = fetch_asset(asset)
        frames[asset["id"]] = frame
        market.append(market_summary(asset, frame))

    primary = frames["CSI300"]
    results = train_and_backtest(primary)
    probability = results["model"]["latest_probability"]
    news = fetch_news()
    sentiment_score = sum(item["score"] for item in news) / len(news) if news else 0.0
    positive = sum(item["label"] == "积极" for item in news)
    negative = sum(item["label"] == "消极" for item in news)
    neutral = len(news) - positive - negative

    signal = "增配" if probability >= 0.58 else "谨慎增配" if probability >= 0.52 else "观望" if probability >= 0.45 else "降配"
    confidence = int(54 + abs(probability - 0.5) * 85)
    latest_close = float(primary.iloc[-1]["close"])
    snapshot = {
        "meta": {
            "product": "NEXUS Alpha",
            "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
            "dataSource": "AKShare / 东方财富公开行情与资讯",
            "mode": "离线可复现研究快照",
        },
        "market": market,
        "signal": {
            "assetId": "CSI300",
            "action": signal,
            "probability": probability,
            "confidence": min(confidence, 88),
            "horizon": "未来5个交易日",
            "sentimentScore": round(sentiment_score, 3),
            "riskGate": "正常" if sentiment_score > -0.25 else "收缩",
            "targetLow": round(latest_close * 0.975, 2),
            "targetHigh": round(latest_close * 1.035, 2),
        },
        "chart": build_market_chart(primary, probability),
        "model": results["model"],
        "backtest": {
            "metrics": results["metrics"],
            "curve": results["curve"],
            "testStart": results["test_start"],
            "testEnd": results["test_end"],
            "assumptions": {"transactionCostBps": 10, "slippageBps": 0, "execution": "次日收盘", "mode": "多头/现金"},
        },
        "sentiment": {
            "score": round(sentiment_score, 3),
            "distribution": {"positive": positive, "neutral": neutral, "negative": negative},
            "news": news,
        },
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    return snapshot


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build the reproducible dashboard snapshot")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    result = generate(args.output)
    print(json.dumps({"output": str(args.output), "asOf": result["market"][0]["asOf"], "probability": result["signal"]["probability"]}, ensure_ascii=False))

