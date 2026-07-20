import numpy as np
import pandas as pd

from backend.quant_engine import build_features, train_and_backtest


def sample_bars(size: int = 900) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    returns = rng.normal(0.00035, 0.011, size)
    close = 100 * np.cumprod(1 + returns)
    return pd.DataFrame(
        {
            "date": pd.bdate_range("2020-01-01", periods=size),
            "open": close * (1 + rng.normal(0, 0.002, size)),
            "high": close * (1 + rng.uniform(0.001, 0.014, size)),
            "low": close * (1 - rng.uniform(0.001, 0.014, size)),
            "close": close,
            "volume": rng.integers(10_000_000, 50_000_000, size),
        }
    )


def test_features_are_causal_and_finite():
    result = build_features(sample_bars())
    assert result["forward_return"].tail(5).isna().all()
    assert result["ret_20"].dropna().map(np.isfinite).all()


def test_backtest_produces_valid_metrics():
    result = train_and_backtest(sample_bars(), random_state=7)
    assert 0 <= result["model"]["latest_probability"] <= 1
    assert result["model"]["test_samples"] > 100
    assert len(result["curve"]) > 20
    assert result["metrics"]["max_drawdown"] <= 0
