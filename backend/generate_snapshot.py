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

STOCKS = [
    {"id": "KWEICHOW", "symbol": "600519", "name": "贵州茅台", "code": "600519.SH", "sector": "食品饮料"},
    {"id": "CATL", "symbol": "300750", "name": "宁德时代", "code": "300750.SZ", "sector": "新能源"},
    {"id": "CMB", "symbol": "600036", "name": "招商银行", "code": "600036.SH", "sector": "银行"},
    {"id": "INNOLIGHT", "symbol": "300308", "name": "中际旭创", "code": "300308.SZ", "sector": "光通信"},
    {"id": "BYD", "symbol": "002594", "name": "比亚迪", "code": "002594.SZ", "sector": "汽车"},
    {"id": "PINGAN", "symbol": "601318", "name": "中国平安", "code": "601318.SH", "sector": "非银金融"},
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


def fetch_stock(stock: dict[str, str]) -> dict[str, Any]:
    """Fetch a real, forward-adjusted A-share daily series and compact it for the UI."""
    source = ak.stock_zh_a_hist(
        symbol=stock["symbol"],
        period="daily",
        start_date="20240101",
        adjust="qfq",
    )
    if source.empty:
        raise ValueError(f"No stock data returned for {stock['symbol']}")
    columns = {
        "日期": "date",
        "开盘": "open",
        "收盘": "close",
        "最高": "high",
        "最低": "low",
        "成交量": "volume",
        "成交额": "amount",
        "涨跌幅": "change_pct",
        "涨跌额": "change_amount",
        "换手率": "turnover",
    }
    frame = source.rename(columns=columns)[list(columns.values())].copy()
    frame["date"] = pd.to_datetime(frame["date"])
    for column in columns.values():
        if column != "date":
            frame[column] = pd.to_numeric(frame[column], errors="coerce")
    frame = frame.dropna(subset=["date", "open", "close", "high", "low", "volume"]).sort_values("date")
    frame["ma20"] = frame["close"].rolling(20).mean()
    frame["ma60"] = frame["close"].rolling(60).mean()
    frame["volume_ma20"] = frame["volume"].rolling(20).mean()
    latest = frame.iloc[-1]
    trailing_year = frame.tail(250)
    chart = []
    for row in frame.tail(120).itertuples():
        chart.append(
            {
                "date": pd.Timestamp(row.date).strftime("%m-%d"),
                "fullDate": pd.Timestamp(row.date).strftime("%Y-%m-%d"),
                "open": round(float(row.open), 2),
                "close": round(float(row.close), 2),
                "high": round(float(row.high), 2),
                "low": round(float(row.low), 2),
                "range": [round(float(row.low), 2), round(float(row.high), 2)],
                "ma20": round(float(row.ma20), 2) if pd.notna(row.ma20) else None,
                "ma60": round(float(row.ma60), 2) if pd.notna(row.ma60) else None,
                "volume": round(float(row.volume / 10_000), 2),
            }
        )
    return {
        **stock,
        "price": round(float(latest["close"]), 2),
        "open": round(float(latest["open"]), 2),
        "high": round(float(latest["high"]), 2),
        "low": round(float(latest["low"]), 2),
        "change": round(float(latest["change_pct"]) / 100, 4),
        "changeAmount": round(float(latest["change_amount"]), 2),
        "volume": round(float(latest["volume"]), 0),
        "amount": round(float(latest["amount"]), 0),
        "turnover": round(float(latest["turnover"]) / 100, 4),
        "high52": round(float(trailing_year["high"].max()), 2),
        "low52": round(float(trailing_year["low"].min()), 2),
        "ma20": round(float(latest["ma20"]), 2),
        "ma60": round(float(latest["ma60"]), 2),
        "volumeRatio": round(float(latest["volume"] / latest["volume_ma20"]), 2),
        "asOf": pd.Timestamp(latest["date"]).strftime("%Y-%m-%d"),
        "adjustment": "前复权",
        "chart": chart,
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
    stocks = [fetch_stock(stock) for stock in STOCKS]

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
        "stocks": stocks,
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
