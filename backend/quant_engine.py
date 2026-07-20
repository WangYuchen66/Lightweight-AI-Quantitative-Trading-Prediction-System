from __future__ import annotations

from dataclasses import asdict, dataclass
from math import sqrt
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, roc_auc_score


FEATURE_LABELS = {
    "ret_5": "5日动量",
    "ret_20": "20日动量",
    "ma_gap_20": "均线偏离",
    "ma_gap_60": "中期趋势",
    "rsi_14": "RSI 强弱",
    "volatility_20": "波动率",
    "volume_z": "量能异常",
    "macd": "MACD 趋势",
    "atr_14": "真实波幅",
}


@dataclass
class BacktestMetrics:
    total_return: float
    benchmark_return: float
    annualized_return: float
    annualized_volatility: float
    sharpe: float
    max_drawdown: float
    win_rate: float
    exposure: float
    trades: int


def _rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = -delta.clip(upper=0).rolling(period).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def build_features(raw: pd.DataFrame, horizon: int = 5) -> pd.DataFrame:
    """Create causal features and a forward return target from OHLCV bars."""
    df = raw.copy().sort_values("date").reset_index(drop=True)
    close = df["close"].astype(float)
    high = df["high"].astype(float)
    low = df["low"].astype(float)
    volume = df["volume"].astype(float)

    df["ret_1"] = close.pct_change()
    df["ret_5"] = close.pct_change(5)
    df["ret_20"] = close.pct_change(20)
    df["ma_gap_20"] = close / close.rolling(20).mean() - 1
    df["ma_gap_60"] = close / close.rolling(60).mean() - 1
    df["rsi_14"] = _rsi(close) / 100
    df["volatility_20"] = df["ret_1"].rolling(20).std() * sqrt(252)
    log_volume = np.log1p(volume)
    df["volume_z"] = (
        (log_volume - log_volume.rolling(20).mean())
        / log_volume.rolling(20).std().replace(0, np.nan)
    )
    ema_12 = close.ewm(span=12, adjust=False).mean()
    ema_26 = close.ewm(span=26, adjust=False).mean()
    df["macd"] = (ema_12 - ema_26) / close
    previous_close = close.shift(1)
    true_range = pd.concat(
        [(high - low), (high - previous_close).abs(), (low - previous_close).abs()],
        axis=1,
    ).max(axis=1)
    df["atr_14"] = true_range.rolling(14).mean() / close
    df["forward_return"] = close.shift(-horizon) / close - 1
    df["target"] = (df["forward_return"] > 0.002).astype(float)
    df.loc[df["forward_return"].isna(), "target"] = np.nan
    return df.replace([np.inf, -np.inf], np.nan)


def _max_drawdown(equity: pd.Series) -> float:
    drawdown = equity / equity.cummax() - 1
    return float(drawdown.min())


def _metrics(strategy_returns: pd.Series, benchmark_returns: pd.Series, positions: pd.Series) -> BacktestMetrics:
    strategy_equity = (1 + strategy_returns).cumprod()
    benchmark_equity = (1 + benchmark_returns).cumprod()
    years = max(len(strategy_returns) / 252, 1 / 252)
    total_return = float(strategy_equity.iloc[-1] - 1)
    annualized_return = float(strategy_equity.iloc[-1] ** (1 / years) - 1)
    annualized_volatility = float(strategy_returns.std() * sqrt(252))
    sharpe = float(strategy_returns.mean() / max(strategy_returns.std(), 1e-9) * sqrt(252))
    active = strategy_returns[positions.shift(1).fillna(0) > 0]
    win_rate = float((active > 0).mean()) if len(active) else 0.0
    trades = int((positions.diff().abs() > 0).sum())
    return BacktestMetrics(
        total_return=total_return,
        benchmark_return=float(benchmark_equity.iloc[-1] - 1),
        annualized_return=annualized_return,
        annualized_volatility=annualized_volatility,
        sharpe=sharpe,
        max_drawdown=_max_drawdown(strategy_equity),
        win_rate=win_rate,
        exposure=float(positions.mean()),
        trades=trades,
    )


def train_and_backtest(
    raw: pd.DataFrame,
    *,
    horizon: int = 5,
    transaction_cost_bps: float = 10.0,
    random_state: int = 42,
) -> dict[str, Any]:
    """Train on the first 70% and evaluate a causal long/cash strategy on the final 30%."""
    frame = build_features(raw, horizon=horizon)
    feature_names = list(FEATURE_LABELS)
    usable = frame.dropna(subset=feature_names + ["target"]).copy()
    if len(usable) < 400:
        raise ValueError("At least 400 clean daily bars are required")

    split = int(len(usable) * 0.70)
    train = usable.iloc[:split]
    test = usable.iloc[split:].copy()
    model = RandomForestClassifier(
        n_estimators=240,
        max_depth=6,
        min_samples_leaf=16,
        max_features=0.72,
        class_weight="balanced_subsample",
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(train[feature_names], train["target"].astype(int))
    probabilities = model.predict_proba(test[feature_names])[:, 1]
    test["probability"] = probabilities
    test["prediction"] = (test["probability"] >= 0.54).astype(int)

    position = pd.Series(0.0, index=test.index)
    holding = 0.0
    for idx, probability in test["probability"].items():
        if probability >= 0.56:
            holding = 1.0
        elif probability <= 0.48:
            holding = 0.0
        position.loc[idx] = holding
    test["position"] = position
    test["market_return"] = test["close"].pct_change().fillna(0)
    turnover = test["position"].diff().abs().fillna(test["position"])
    cost = turnover * (transaction_cost_bps / 10_000)
    test["strategy_return"] = test["position"].shift(1).fillna(0) * test["market_return"] - cost
    metrics = _metrics(test["strategy_return"], test["market_return"], test["position"])

    strategy_equity = (1 + test["strategy_return"]).cumprod()
    benchmark_equity = (1 + test["market_return"]).cumprod()
    drawdown = strategy_equity / strategy_equity.cummax() - 1
    auc = roc_auc_score(test["target"], probabilities) if test["target"].nunique() > 1 else 0.5
    accuracy = accuracy_score(test["target"], test["prediction"])

    latest_features = frame.dropna(subset=feature_names).iloc[[-1]]
    latest_probability = float(model.predict_proba(latest_features[feature_names])[:, 1][0])
    importance = sorted(
        [
            {
                "key": key,
                "label": FEATURE_LABELS[key],
                "importance": round(float(value), 4),
                "direction": round(float(latest_features[key].iloc[0]), 4),
            }
            for key, value in zip(feature_names, model.feature_importances_)
        ],
        key=lambda row: row["importance"],
        reverse=True,
    )

    curve = []
    for idx in range(len(test)):
        row = test.iloc[idx]
        if idx % 3 == 0 or idx == len(test) - 1:
            curve.append(
                {
                    "date": pd.Timestamp(row["date"]).strftime("%Y-%m-%d"),
                    "strategy": round(float(strategy_equity.iloc[idx] * 100), 2),
                    "benchmark": round(float(benchmark_equity.iloc[idx] * 100), 2),
                    "drawdown": round(float(drawdown.iloc[idx] * 100), 2),
                }
            )

    return {
        "model": {
            "name": "RF-MultiFactor v1.0",
            "horizon_days": horizon,
            "train_samples": int(len(train)),
            "test_samples": int(len(test)),
            "test_auc": round(float(auc), 4),
            "test_accuracy": round(float(accuracy), 4),
            "latest_probability": round(latest_probability, 4),
            "feature_importance": importance,
        },
        "metrics": {key: round(value, 4) if isinstance(value, float) else value for key, value in asdict(metrics).items()},
        "curve": curve,
        "test_start": pd.Timestamp(test["date"].iloc[0]).strftime("%Y-%m-%d"),
        "test_end": pd.Timestamp(test["date"].iloc[-1]).strftime("%Y-%m-%d"),
    }


def build_market_chart(raw: pd.DataFrame, probability: float, points: int = 150) -> list[dict[str, Any]]:
    recent = raw.sort_values("date").tail(points).copy()
    recent["ma20"] = recent["close"].rolling(20).mean()
    chart = [
        {
            "date": pd.Timestamp(row.date).strftime("%m-%d"),
            "full_date": pd.Timestamp(row.date).strftime("%Y-%m-%d"),
            "close": round(float(row.close), 2),
            "ma20": round(float(row.ma20), 2) if pd.notna(row.ma20) else None,
            "volume": round(float(row.volume / 1e8), 2),
        }
        for row in recent.itertuples()
    ]
    close = float(recent["close"].iloc[-1])
    daily_vol = float(recent["close"].pct_change().tail(20).std())
    expected_move = (probability - 0.5) * 2 * daily_vol * np.sqrt(5) * 0.72
    last_date = pd.Timestamp(recent["date"].iloc[-1])
    for day in range(1, 6):
        center = close * (1 + expected_move * day / 5)
        width = close * daily_vol * np.sqrt(day) * 1.28
        future_date = last_date + pd.offsets.BDay(day)
        chart.append(
            {
                "date": future_date.strftime("%m-%d"),
                "full_date": future_date.strftime("%Y-%m-%d"),
                "forecast": round(float(center), 2),
                "upper": round(float(center + width), 2),
                "lower": round(float(center - width), 2),
            }
        )
    return chart
